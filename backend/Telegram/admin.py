"""This module handle admin functionality for Telegram Bot"""
from datetime import datetime

from aiogram import F, Router
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types.callback_query import CallbackQuery
from aiogram.utils.deep_linking import create_start_link

import backend.db as db
import backend.utils as utils
import backend.config as config
from backend.Telegram import states, kb



admin_router = Router()



@admin_router.message(Command("today"))
async def today_list(msg: Message):
    """Sends to the telegram all information about upcoming today interviews"""

    tl = utils.get_today_list(msg.from_user.username)
    if isinstance(tl, str):
        await msg.reply(config.PERMISSION_ERROR)
    elif tl is None:
        await msg.reply("На сегодня собеседований нет!")
    else:
        for _, v in enumerate(tl):
            await msg.reply(text=f"""
Собеседуемый {v[0]}:
Телефон: {v[1]}
Вакансия: {v[2]}
Время: {v[3]}
""")



@admin_router.message(Command("list"))
async def future_list(msg: Message):
    """Sends to the telegram all information about upcoming today interviews"""

    fl = utils.get_future_list(msg.from_user.username)
    if isinstance(fl, str):
        await msg.reply(config.PERMISSION_ERROR)
    elif fl is None:
        await msg.reply("В ближайшем будущем собеседований нет!")
    else:
        for _, v in enumerate(fl):
            await msg.reply(text=f"""
Собеседуемый {v[0]}:
Телефон: {v[1]}
Вакансия: {v[2]}
Время: {v[3]} {v[4]} {v[5]} в {v[6]}
""")



@admin_router.message(StateFilter(None), Command("av"))
async def add_vacancy(msg: Message, state: FSMContext):
    """This handler helps add vacancy from telegram"""

    await state.clear()
    if db.get_administrators():
        if db.ga(msg.from_user.username):
            await msg.reply(
                text="Введите название для вашей вакансии:",
            )
            await state.set_state(states.AddVacancy.name)
        else:
            await msg.reply(
                text="У вас нет прав для запуска данной команды, обратитесь к администратору!"
            )
    else:
        await msg.reply(
            text="На данный момент незарегистрировани ни один администратор, обратитесь к тех специалисту!"
        )


@admin_router.message(states.AddVacancy.name)
async def vacancy_name_picked(message: Message, state: FSMContext):
    """Handle name for the vacncy"""

    message.bot.edit_message_reply_markup(message.chat.id, message.message_id, reply_markup=None)
    await state.update_data(name=message.text)
    await message.reply(
        text="Теперь, введите ссылку на данную вакансию:",
        reply_markup=kb.exit_menu
    )
    await state.set_state(states.AddVacancy.link)


@admin_router.message(states.AddVacancy.link)
async def vacancy_admin(message: Message, state: FSMContext):
    """Handle vacancy link"""

    message.bot.edit_message_reply_markup(message.chat.id, message.message_id, reply_markup=None)
    await state.update_data(link=message.text)
    y = db.get_administrators()
    administrators = []
    for ind,val in enumerate(y):
        administrators.append([InlineKeyboardButton(text=val[1], callback_data=f"vad{ind}")])
    administrators.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])

    adm_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=administrators)
    await message.reply(
        text="Теперь, выберите админа на данную вакансию:",
        reply_markup=adm_kb
    )
    await state.set_state(states.AddVacancy.admin)


@admin_router.callback_query(F.data.startswith('vad'))
async def vacancy_added(clbck: CallbackQuery, state: FSMContext):
    """Handle fo picked admin for the vacancy"""

    vacancy_data = await state.get_data()
    y = db.get_administrators()
    await state.update_data(admin=y[int(clbck.data.split("d")[1])][1])
    db.add_vacancy(vacancy_data['name'], vacancy_data['link'], y[int(clbck.data.split("d")[1])][1])
    await clbck.message.reply(f"Вакансия \"{vacancy_data['name']}\" успешно добавлена!")
    await state.clear()


@admin_router.message(StateFilter(None), Command("dv"))
async def del_vacancy(msg: Message, state: FSMContext):
    """Handler for deleting vacancy"""

    if db.ga(msg.from_user.username):
        if db.get_vacancies():
            vacancies = []
            y = db.get_vacancies()
            for ind,val in enumerate(y):
                vacancies.append([InlineKeyboardButton(text=val[1], callback_data=f"dvac{ind}")])

            vacancies.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])
            vac_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=vacancies)
            await msg.reply(
                text="Выберите вакансию, которую хотите удалить:",
                reply_markup=vac_kb
            )
            await state.set_state(states.DelVacancy.name)
        else:
            await msg.reply(
                text="Не нашел существующих вакансий, добавьте их командой /av",
            )
            state.clear()
    else:
        await msg.reply("У вас нет прав для запуска данной команды, обратитесь к администратору!")


@admin_router.callback_query(F.data.startswith('dvac'))
async def vacancy_deleted(clbck: CallbackQuery, state: FSMContext):
    """Deleting vacancy"""

    try:
        vacancies = db.get_vacancies()
        db.del_vacancy(vacancies[int(clbck.data.split("c")[1])][0])
        await clbck.message.reply(
            text=f"Вакансия \"{vacancies[int(clbck.data.split('c')[1])][1]}\" успешно удалена!"
        )
        await state.clear()
    except:
        await clbck.message.reply(text=config.SORRY_MESSAGE + "/dv")



@admin_router.message(StateFilter(None), Command("djs"))
async def del_jobseeker(msg: Message, state: FSMContext):
    """Delete jobseeker command handler"""

    try:
        if db.ga(msg.from_user.username):
            js = db.get_job_seekers()
            names = []
            for i, v in enumerate(js):
                names.append([InlineKeyboardButton(text=v[1], callback_data=f'djs{i[2]}')])
            names.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])
            await msg.reply(
                text="Выберите соискателя, которого хотите удалить:",
                reply_markup=names
            )
            await state.set_state(states.DelVacancy.name)
        else:
            await msg.reply("У вас нет прав для запуска данной команды, обратитесь к администратору!")
    except:
        await msg.reply(text=config.SORRY_MESSAGE + "/djs")


@admin_router.callback_query(F.data.startswith('djs'))
async def del_jobseeker_name(clbck: CallbackQuery, state: FSMContext):
    """Name handler for deleting jobseeker"""

    try:
        phone = clbck.data.split('s')[1]
        db.del_job_seeker(phone)
        await clbck.message.reply("Соискаель успешно удалён!")
        await state.clear()
    except:
        await clbck.message.reply(text=config.SORRY_MESSAGE + "/djs")



@admin_router.message(StateFilter(None), Command("aa"))
async def add_admin(msg: Message, state: FSMContext):
    """Add admin handler"""

    if db.get_administrators():
        if db.ga(msg.from_user.username):
            await msg.reply(
                text="Введите ФИО Администратора:",
                reply_markup=kb.exit_menu
            )
            await state.set_state(states.AddAdmin.fio)
        else:
            await msg.reply(
                "У вас нет прав для запуска данной команды, обратитесь к администратору!"
            )
    else:
        await msg.reply("На данный момент незарегистрировани ни один администратор, обратитесь к тех специалисту!")


@admin_router.message(states.AddAdmin.fio)
async def add_admin_phone(message: Message, state: FSMContext):
    """This handler handle FIO parametr for adding admin"""

    try:
        await state.update_data(fio=message.text)
        await message.reply(
            text="Теперь, введите номер телефона Администратора:",
            reply_markup=kb.exit_menu
        )
        await state.set_state(states.AddAdmin.phone)
    except:
        await message.reply(text=config.SORRY_MESSAGE + "/aa")


@admin_router.message(states.AddAdmin.phone)
async def add_admin_username(message: Message, state: FSMContext):
    """This handler handle phone for the admin"""

    try:
        await state.update_data(phone=message.text)
        await message.reply(
            text="Теперь, введите юзернейм Администратора (без @):",
            reply_markup=kb.exit_menu
        )
        await state.set_state(states.AddAdmin.username)
    except:
        await message.reply(text=config.SORRY_MESSAGE + "/aa")


@admin_router.message(states.AddAdmin.username)
async def add_admin_done(msg: Message, state: FSMContext):
    """This handler handle admin username"""

    try:
        admin = await state.get_data()
        db.add_admin(admin['fio'], admin['phone'], msg.text)
        v = await create_start_link(msg.bot, f"ad{admin['phone']}", encode=True)
        await msg.reply(f"Администратор \"{admin['fio']}\" успешно добавлен! Ссылка: {v}")
        await state.clear()
    except:
        await msg.reply(text=config.SORRY_MESSAGE + "/aa")



@admin_router.message(StateFilter(None), Command("da"))
async def del_admin(msg: Message, state: FSMContext):
    """This handler handle delete admin command"""

    try:
        if db.get_administrators():
            if db.ga(msg.from_user.username):
                y = db.get_administrators()
                administrators = []
                for ind,val in enumerate(y):
                    administrators.append([InlineKeyboardButton(text=val[1], callback_data=f"da{ind}")])
                administrators.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])
                adm_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=administrators)
                await msg.reply(
                    text="Выберите администратора, которого хотите удалить:",
                    reply_markup= adm_kb
                )
                await state.set_state(states.DelAdmin.phone)
            else:
                await msg.reply("У вас нет прав для запуска данной команды, обратитесь к администратору!")
        else:
            await msg.reply("На данный момент незарегистрировани ни один администратор, обратитесь к тех специалисту!")
    except:
        await msg.reply(text=config.SORRY_MESSAGE + "/da")


@admin_router.callback_query(F.data.startswith('da'))
async def del_admin_done(clbck: CallbackQuery, state: FSMContext):
    """This handler finally delete admin"""

    try:
        y = db.get_administrators()
        v = int(clbck.data.split("a")[1])
        db.del_admin(y[v][2])
        await clbck.message.reply(f"Администратор \"{y[v][1]}\" успешно удален!")
        await state.clear()
    except:
        await clbck.message.reply(text=config.SORRY_MESSAGE + "/da")



@admin_router.message(Command('c'))
async def convert_link(msg: Message):
    """This command convert hh.ru link to the link of our bot"""

    if db.ga(msg.from_user.username):
        v = msg.text.split(' ')
        hh_link = v[1].split('/')[-1]
        bot_link = await create_start_link(msg.bot, hh_link, encode=True)
        await msg.reply(bot_link)
    else:
        await msg.reply("У вас нет прав для запуска данной команды, обратитесь к администратору!")



@admin_router.message(Command("tickets"))
async def get_tickets(msg: Message):
    """Ths handler post all unsolved tickets"""

    if db.ga(msg.from_user.username):
        tickets = db.get_tickets() #mid, text, chatid
        for i in tickets:
            await msg.reply(text=f"""Вопрос от соискателя:
{i[1]}""", reply_markup=InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=[
        [InlineKeyboardButton(text="Ответить", callback_data=f'ans{i[2]} {i[0]}')]
    ]))
    else:
        await msg.reply("У вас нет прав для запуска данной команды, обратитесь к администратору!")


@admin_router.callback_query(F.data.startswith("ans"))
async def answer(clbck: CallbackQuery, state: FSMContext):
    """This handler handle ticket and wait answer for it"""

    chatid = clbck.data.split('s')[1].split(' ')[0]
    mid = clbck.data.split('s')[1].split(' ')[1]
    await clbck.message.reply("Отправьте мне ответ на данный вопрос:", reply_markup=kb.exit_menu)
    await state.update_data(chatid=chatid)
    await state.update_data(mid = mid)
    await state.set_state(states.Tickets.message)


@admin_router.message(states.Tickets.message)
async def add_answear_done(msg: Message, state: FSMContext):
    """This handler get answer for the tickets and send answer to the user"""

    ans = await state.get_data()
    db.solve_ticket(ans['mid'])
    await msg.bot.send_message(ans['chatid'], msg.text, reply_to_message_id=ans['mid'])
    await msg.reply("Ваш ответ успешно доставлен!")
    await state.clear()
