import uuid
from yookassa import Configuration, Payment
from bot.config import config

# Configure ЮKassa
# In a real app, these would come from .env
Configuration.account_id = config.YOOKASSA_SHOP_ID
Configuration.secret_key = config.YOOKASSA_SECRET_KEY.get_secret_value()

class YookassaGateway:
    @staticmethod
    async def create_payment(amount: float, description: str, metadata: dict) -> dict:
        """
        Creates a payment in ЮKassa and returns the response.
        """
        idempotency_key = str(uuid.uuid4())
        res = Payment.create({
            "amount": {
                "value": str(amount),
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": config.PAYMENT_RETURN_URL
            },
            "capture": True,
            "description": description,
            "metadata": metadata
        }, idempotency_key)
        
        return {
            "id": res.id,
            "status": res.status,
            "confirmation_url": res.confirmation.confirmation_url
        }

    @staticmethod
    async def get_payment_details(payment_id: str):
        """
        Retrieves payment details by ID.
        """
        return Payment.find_one(payment_id)
