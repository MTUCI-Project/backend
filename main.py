import asyncio
import logging
from os import path, curdir

from aiogram import Bot, Dispatcher
from aiogram.enums.parse_mode import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from fastapi import FastAPI

from backend.Telegram.handlers import router
from backend.Telegram.admin import admin_router
import backend.db as db
import backend.config as config



async def main():
    """Main function"""

    bot = Bot(token=config.BOT_TOKEN, parse_mode=ParseMode.HTML)
    dp = Dispatcher(storage=MemoryStorage())
    app = FastAPI()

    dp.include_router(router)
    dp.include_router(admin_router)
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())



if __name__ == "__main__":
    if not path.isfile(curdir + "/eve.db"):
        admin_usr = input("Type admin's username from Telegram (without \"@\" character): ")
        admin_phone = input("Type admin's phone (like '+78005553535'): ")
        admin_name = input("Type admin's name (like 'Ну типо разраб'): ")
        db.init()
        db.add_admin(admin_name, admin_phone, admin_usr)
        
    logging.basicConfig(level=logging.INFO)
    print("Aiogram started!")
    asyncio.run(main())
