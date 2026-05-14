from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from bot.models.features import Achievement, StudentAchievement
from bot.models.education import HomeworkSubmission, Attendance

class GamificationService:
    def __init__(self, session: AsyncSession, bot=None):
        self.session = session
        self.bot = bot

    async def _grant_achievement(self, student_id: int, achievement_id: int, telegram_id: int = None):
        stmt = select(StudentAchievement).where(StudentAchievement.student_id == student_id, StudentAchievement.achievement_id == achievement_id)
        exists = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not exists:
            new_sa = StudentAchievement(student_id=student_id, achievement_id=achievement_id)
            self.session.add(new_sa)
            await self.session.commit()
            
            stmt_a = select(Achievement).where(Achievement.id == achievement_id)
            ach = (await self.session.execute(stmt_a)).scalar_one()
            
            if self.bot and telegram_id:
                try:
                    await self.bot.send_message(
                        telegram_id,
                        f"🎉 *НОВОЕ ДОСТИЖЕНИЕ!*\n\n{ach.icon} *{ach.name}*\n_{ach.description}_\n\nВы получили +{ach.xp_reward} XP!",
                        parse_mode="Markdown"
                    )
                except Exception:
                    pass

    async def check_homework_achievements(self, student_id: int, telegram_id: int = None):
        stmt = select(func.count(HomeworkSubmission.id)).where(HomeworkSubmission.student_id == student_id, HomeworkSubmission.status == "accepted")
        hw_count = await self.session.scalar(stmt) or 0
        
        achievements_to_grant = []
        if hw_count >= 1:
            achievements_to_grant.append("Первое ДЗ")
        if hw_count >= 5:
            achievements_to_grant.append("Новатор")
        if hw_count >= 10:
            achievements_to_grant.append("Магистр ДЗ")
            
        for name in achievements_to_grant:
            stmt_ach = select(Achievement).where(Achievement.name == name)
            ach = (await self.session.execute(stmt_ach)).scalar_one_or_none()
            if ach:
                await self._grant_achievement(student_id, ach.id, telegram_id)
