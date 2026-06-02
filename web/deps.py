import os
from fastapi import Header, HTTPException

async def verify_bot_secret(x_bot_secret: str = Header(None)):
    expected = os.getenv("BOT_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=500, detail="Bot secret is not configured on the server")
    if not x_bot_secret or x_bot_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden: invalid bot secret")
    return x_bot_secret
