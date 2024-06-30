import asyncio
import logging
from os import path, curdir
import sys

from aiogram import Bot, Dispatcher
from aiogram.enums.parse_mode import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from fastapi import FastAPI
import yaml

import backend.db as db
from backend.Telegram.handlers import router
from backend.Telegram.admin import admin_router
import config as config


async def main():
    """Main function"""

    bot = Bot(token=config.BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    app = FastAPI()

    dp.include_routers(admin_router, router)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())



if __name__ == "__main__":
    if not path.isfile(curdir + "/config.yml"):
        print("Can't find config.yaml, exiting...")
        sys.exit()

    if not path.isfile(config.DB_PATH):
        db.init()
        db.add_admin(config.INITIAL_ADMIN_NAME, config.INITIAL_ADMIN_PHONE, config.INITIAL_ADMIN_USERNAME)    

    logging.basicConfig(level=logging.INFO)
    print("Aiogram started!")
    
    asyncio.run(main())
