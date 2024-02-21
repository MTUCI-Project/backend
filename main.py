import asyncio
import logging
from os import path, curdir

from aiogram import Bot, Dispatcher
from aiogram.enums.parse_mode import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

import db
import config
from handlers import router
from admin import admin_router



async def main():
    bot = Bot(token=config.BOT_TOKEN, parse_mode=ParseMode.HTML)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)
    dp.include_router(admin_router)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    if not path.isfile(curdir + "/eve.db"):
        db.init()
    logging.basicConfig(level=logging.INFO)
    print("Aiogram started!")
    asyncio.run(main())
