import structlog
from aiohttp import web
from bot.database import async_session_factory
from bot.payments.service import PaymentService

log = structlog.get_logger()

async def yookassa_webhook_handler(request: web.Request):
    """
    Handle incoming notifications from ЮKassa.
    """
    try:
        data = await request.json()
    except Exception as e:
        log.error("Failed to parse webhook JSON", error=str(e))
        return web.Response(status=400)

    log.info("Received ЮKassa webhook", event=data.get("event"))

    # Process in a background session
    async with async_session_factory() as session:
        # We need the bot instance to send notifications. 
        # It's usually stored in the aiohttp app state.
        bot = request.app.get("bot")
        service = PaymentService(session, bot=bot)
        
        try:
            await service.process_webhook_notification(data)
        except Exception as e:
            log.error("Error processing webhook in service", error=str(e))
            return web.Response(status=500)

    return web.Response(status=200)


def setup_webhook_app(bot):
    """
    Creates and returns the aiohttp web application for webhooks.
    """
    app = web.Application()
    app["bot"] = bot
    app.router.add_post("/payments/yookassa/webhook", yookassa_webhook_handler)
    return app
