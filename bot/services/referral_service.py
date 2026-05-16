"""Referral system service."""
import secrets
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from bot.models.user import User
from bot.models.features import Referral
from bot.services.gamification_service import GamificationService

log = structlog.get_logger()
REFERRAL_XP_REWARD = 200


def generate_code() -> str:
    return "SMART" + secrets.token_hex(3).upper()[:6]


class ReferralService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def ensure_code(self, user: User) -> str:
        if user.referral_code:
            return user.referral_code
        code = generate_code()
        while await self.session.scalar(select(User).where(User.referral_code == code)):
            code = generate_code()
        user.referral_code = code
        await self.session.commit()
        return code

    async def apply_referral(self, code: str, new_user: User) -> bool:
        referrer = await self.session.scalar(
            select(User).where(User.referral_code == code)
        )
        if not referrer or referrer.id == new_user.id:
            return False
        existing = await self.session.scalar(
            select(Referral).where(Referral.referred_id == new_user.id)
        )
        if existing:
            return False
        ref = Referral(referrer_id=referrer.id, referred_id=new_user.id)
        self.session.add(ref)
        await self.session.commit()
        if referrer.student:
            gs = GamificationService(self.session)
            await gs._add_xp(referrer.student.id, REFERRAL_XP_REWARD, referrer.telegram_id)
        log.info("Referral applied", referrer=referrer.id, referred=new_user.id)
        return True

    async def get_referral_stats(self, user: User) -> dict:
        total = await self.session.scalar(
            select(func.count(Referral.id)).where(Referral.referrer_id == user.id)
        ) or 0
        rewarded = await self.session.scalar(
            select(func.count(Referral.id)).where(
                Referral.referrer_id == user.id, Referral.reward_status == "paid"
            )
        ) or 0
        return {
            "code": user.referral_code or "",
            "total": total,
            "rewarded": rewarded,
        }
