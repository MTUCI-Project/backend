import datetime

from aiogram import F, Router
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.filters import Command, StateFilter, CommandStart, CommandObject
from aiogram.fsm.context import FSMContext
from aiogram.types.callback_query import CallbackQuery
from aiogram.utils.deep_linking import create_start_link, decode_payload

import db
import config


admin_router = Router()

@admin_router.message(Command("today"))
async def today_list(msg: Message):
    """Sends to the telegram all information about upcoming today interviews"""

    if db.ga(msg.from_user.username):
        js = db.get_today_js()
        if js != []:
            for _, v in enumerate(js):
                mess = f"""Собеседуемый {v[1]}:
Телефон: {v[2]}
Вакансия: {db.get_vacancy(v[3])[0][0]}
Время: {v[5]}"""
                await msg.reply(text=mess)
    else:
        await msg.reply(config.permission_error)



@admin_router.message(Command("list"))
async def future_list(msg: Message):
    """Sends to the telegram all information about upcoming today interviews"""

    if db.ga(msg.from_user.username):
        js = db.get_future_js()
        if js != []:
            for _, v in enumerate(js):
                dt = datetime.fromordinal(v[4])
                mess = f"""Собеседуемый {v[1]}:
Телефон: {v[2]}
Вакансия: {db.get_vacancy(v[3])[0][0]}
Время: {dt.day} {dt.month-1} {dt.year} в {v[5]}"""
                await msg.reply(text=mess)
        else:
            await msg.reply("В ближайшем будующем собеседований нет!")
    else:
        await msg.reply(config.permission_error)


