import bcrypt
from typing import Optional
from bot.models.user import User
from bot.repositories.user import UserRepository

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

    @staticmethod
    async def authenticate_user(repo: UserRepository, username: str, password: str) -> Optional[User]:
        user = await repo.get_by_username(username)
        if user and user.password_hash and AuthService.verify_password(password, user.password_hash):
            return user
        return None
