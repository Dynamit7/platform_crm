import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from bot.payments.models import Finance
from bot.payments.yookassa import YookassaGateway
from bot.notifications.service import NotificationService
from bot.notifications.types import NotificationType
import aiohttp
from bot.config import config


log = structlog.get_logger()

class PaymentService:
    def __init__(self, session: AsyncSession, bot=None):
        self.session = session
        self.notif_service = NotificationService(bot) if bot else None

    async def create_new_payment(self, user_id: int, student_id: int, amount: float, description: str) -> str:
        """
        Creates a payment record and returns the URL.
        """
        metadata = {
            "user_id": user_id,
            "student_id": student_id
        }
        
        yookassa_res = await YookassaGateway.create_payment(amount, description, metadata)
        
        finance_record = Finance(
            yookassa_id=yookassa_res["id"],
            user_id=user_id,
            amount=amount,
            description=description,
            confirmation_url=yookassa_res["confirmation_url"],
            status="pending"
        )
        
        self.session.add(finance_record)
        await self.session.commit()
        
        return yookassa_res["confirmation_url"]

    async def process_webhook_notification(self, notification_data: dict):
        """
        Processes the notification from ЮKassa.
        """
        event = notification_data.get("event")
        payment_obj = notification_data.get("object")
        
        if not payment_obj:
            return

        payment_id = payment_obj.get("id")
        status = payment_obj.get("status")
        
        log.info("Processing payment webhook", payment_id=payment_id, status=status)

        stmt = select(Finance).where(Finance.yookassa_id == payment_id).options(selectinload(Finance.user))
        result = await self.session.execute(stmt)
        payment_record = result.scalar_one_or_none()

        if not payment_record:
            log.error("Payment record not found in DB", payment_id=payment_id)
            return

        # Update status
        payment_record.status = status
        
        if status == "succeeded":
            # Update student account
            metadata = payment_obj.get("metadata", {})
            student_id = metadata.get("student_id")
            
            # Logic: If we had a balance, we'd update it here.
            # For now, we'll just log and notify the user.
            log.info("Payment succeeded", student_id=student_id, amount=payment_record.amount)
            
            if self.notif_service:
                await self.notif_service.send_notification(
                    user_id=payment_record.user_id,
                    notification_type=NotificationType.PAYMENT_SUCCESS,
                    amount=payment_record.amount,
                    currency="RUB",
                    description=payment_record.description or "Оплата обучения"
                )
                
            # Sync with CRM
            try:
                async with aiohttp.ClientSession() as http_session:
                    payload = {
                        "telegram_id": payment_record.user.telegram_id,
                        "amount": float(payment_record.amount),
                        "currency": "RUB",
                        "method": "yookassa",
                        "description": payment_record.description or "Автоматическая оплата ЮKassa",
                        "course_id": None  # Not available in webhook context
                    }
                    await http_session.post(f"{config.API_URL}/sync-payment", json=payload, timeout=3)
            except Exception as e:
                log.error("Failed to sync webhook payment to CRM", error=str(e))
        
        await self.session.commit()
