"""This file contains Telegram bot user handlers"""
from datetime import datetime

from aiogram import F, Router
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.filters import Command, StateFilter, CommandStart, CommandObject
from aiogram.fsm.context import FSMContext
from aiogram.types.callback_query import CallbackQuery
from aiogram.utils.deep_linking import create_start_link, decode_payload

import states
import db
import kb
import config



router = Router()



@router.callback_query(F.data == "sign")
@router.message(StateFilter(None), Command("ajs"))
async def add_job_seeker(msg: Message, state: FSMContext):
    """Add JobSeeker handler"""

    try:
        if db.ga(msg.from_user.username):
            if db.get_vacancies():
                await msg.reply(
                    text="Введите ФИО соискателя:",
                    reply_markup=kb.exit_menu
                )
                await state.set_state(states.JobSeeker.fio)
            else:
                await msg.reply(text="Не нашел существующих вакансий, добавьте их командой /av",)
                state.clear()
        else:
            if db.get_vacancies():
                await msg.reply(
                    text="Введите ваше ФИО:",
                    reply_markup=kb.exit_menu
                )
                await state.set_state(states.JobSeeker.fio)
    except AttributeError:
        if db.ga(msg.from_user.username):
            if db.get_vacancies():
                await msg.message.reply(
                    text="Введите ФИО соискателя:",
                    reply_markup=kb.exit_menu
                )
                await state.set_state(states.JobSeeker.fio)
            else:
                await msg.reply(text="Не нашел существующих вакансий, добавьте их командой /av",)
        else:
            if db.get_vacancies():

                await msg.message.reply(
                    text="Введите ваше ФИО:",
                    reply_markup=kb.exit_menu
                )
                await state.set_state(states.JobSeeker.fio)
    except:
        await msg.reply(text=config.SORRY_MESSAGE + "/ajs")


@router.message(states.JobSeeker.fio)
async def add_job_seeker_fio(message: Message, state: FSMContext):
    """FIO handler"""

    try:
        if db.ga(message.from_user.username):
            await state.update_data(fio=message.text)
            await message.reply(
                text="Теперь, введите номер телефона соискателя:",
                reply_markup=kb.exit_menu
            )
            await state.set_state(states.JobSeeker.phone)
        else:
            await state.update_data(fio=message.text)
            await message.reply(
                text="Теперь, введите ваш номер телефона:",
                reply_markup=kb.exit_menu
            )
            await state.set_state(states.JobSeeker.phone)
    except:
        await message.reply(text=config.SORRY_MESSAGE + "/ajs")


@router.message(states.JobSeeker.phone)
async def add_job_seeker_phone(message: Message, state: FSMContext):
    """Phone vacancy handler"""

    try:
        if db.ga(message.from_user.username):
            await state.update_data(phone=message.text)
            vacancies = []
            y = db.get_vacancies()
            for ind,val in enumerate(y):
                vacancies.append([InlineKeyboardButton(text=val[1], callback_data=f"avac{ind}")])
            vacancies.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])
            vac_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=vacancies)
            await message.reply(
                text="Теперь, выберите название вакансии:",
                reply_markup=vac_kb
            )
            await state.set_state(states.JobSeeker.vacancy)
        else:
            await state.update_data(phone=message.text)
            vacancies = []
            y = db.get_vacancies()
            for ind,val in enumerate(y):
                vacancies.append([InlineKeyboardButton(text=val[1], callback_data=f"avac{ind}")])
            vacancies.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])
            vac_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=vacancies)
            await message.reply(
                text="Теперь, выберите название вакансии:",
                reply_markup=vac_kb
            )
            await state.set_state(states.JobSeeker.vacancy)
    except:
        await message.reply(text=config.SORRY_MESSAGE + "/ajs")


@router.callback_query(F.data.startswith('avac'))
async def add_job_seeker_vacancy(clbck: CallbackQuery, state: FSMContext):
    """Vacncy handler"""

    try:
        y = db.get_vacancies()
        await state.update_data(vacancy=y[int(clbck.data.split("c")[1])][0])
        await state.update_data(admin=y[int(clbck.data.split("c")[1])][3])
        dt = datetime.now()
        days = [[], []]
        for i in range(6):
            v = datetime.fromordinal(dt.toordinal()+i)
            if v.weekday() < 5 and len(days[0]) < 2:
                days[0].append(
                    InlineKeyboardButton(
                        text=f"{v.day} {config.MONTHS[v.month-1]}",
                        callback_data=f'day{v.toordinal()}'
                    )
                )
        days[1].append(InlineKeyboardButton(text="Отмена", callback_data='cancel'))
        day_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=days)
        await clbck.message.reply(
            text="Теперь, выберите день:",
            reply_markup=day_kb
        )
        await state.set_state(states.JobSeeker.date)
    except:
        await clbck.message.reply(text=config.MONTHS + "/ajs")


@router.callback_query(F.data.startswith('day'))
async def add_job_seeker_date(clbck: CallbackQuery, state: FSMContext):
    """Add job seedker date"""

    try:
        await state.update_data(date=clbck.data.split('y')[1])
        tk = []
        for i, v in enumerate(config.MONTHS):
            r = db.get_totime_js(clbck.data.split('y')[1], v)
            if len(r) < 5:
                tk.append([InlineKeyboardButton(text=v, callback_data=f'time{i}')])
        tk.append([InlineKeyboardButton(text="Отмена", callback_data='cancel')])
        time_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=tk)
        await clbck.message.reply(
            text="Теперь, назначьте время:",
            reply_markup=time_kb
        )
        await state.set_state(states.JobSeeker.time)
    except:
        await clbck.message.reply(text=config.SORRY_MESSAGE + "/ajs")


@router.callback_query(F.data.startswith('time'))
async def add_job_seeker_time(clbck: CallbackQuery, state: FSMContext):
    """Handle time for jobseeker"""

    try:
        if db.ga(clbck.message.from_user.username):
            job_seeker = await state.get_data()
            time = config.INTERVIEW_TIME[int(clbck.data.split('e')[1])]
            await state.update_data(time=time)
            db.add_job_seeker(
                job_seeker['fio'],
                job_seeker['phone'],
                job_seeker['vacancy'],
                job_seeker['date'],
                time,
                job_seeker['admin']
            )
            bot_link = await create_start_link(clbck.bot, job_seeker['phone'], encode=True)
            await clbck.message.reply(
                f"""Соискатель \"{job_seeker['fio']}\" успешно добавлен!
Ссылка для приглашения: {bot_link}"""
            )
            await state.clear()
        else:
            job_seeker = await state.get_data()
            time = config.INTERVIEW_TIME[int(clbck.data.split('e')[1])]
            await state.update_data(time=time)
            db.verify_js(job_seeker['phone'], clbck.message.chat.id)
            db.add_job_seeker(
                job_seeker['fio'],
                job_seeker['phone'],
                job_seeker['vacancy'],
                job_seeker['date'],
                time,
                job_seeker['admin']
            )
            a =[]
            for i in db.get_administrators():
                a.append(i[2])
            for i in a:
                t = db.get_admin(i)
                await clbck.bot.send_message(t[0][1], """Назначено новое собеседование:
для того чтобы посмотреть отправьте команду /list""")
            await clbck.message.reply(f"""Вы успешно записались на собеседование в {time} {datetime.fromordinal(int(job_seeker['date'])).day} {config.MONTHS[datetime.fromordinal(int(job_seeker['date'])).month-1]} {datetime.fromordinal(int(job_seeker['date'])).year}.
Ждём вас по адресу {config.ADDRESS}. 
Ваш администратор: {job_seeker['admin'].split(' ')[1]} ({job_seeker['admin'].split(' ')[2]}). 
До встречи!🌻""")
            await state.clear()
    except:
        await clbck.message.reply(text=config.SORRY_MESSAGE + "/ajs")



@router.message(CommandStart(deep_link=True))
async def handler(message: Message, command: CommandObject, state: FSMContext):
    """This function handle Telegram DeepLink"""

    await state.clear()
    txt = decode_payload(command.args)
    if "ad" in txt:
        db.verify_administrator(txt.split("d")[1], message.chat.id)
        await message.reply("Вы успешно верифицированы!")
    else:
        js = db.get_js(txt)
        if js:
            date = datetime.fromordinal(js[0][2])
            time = js[0][3]
            await state.update_data(phone=txt)
            db.verify_js(txt, message.chat.id)
            await message.reply(f"Добрый день! {js[0][0]} вы записаны на собеседование {date.day}.{date.month}.{date.year} {config.INTERVIEW_TIME[int(time.split('e')[1])]}, пожалуйста подтвердите свою запись😌", reply_markup=kb.подтверждение)
        else:
            await message.reply("Вы кто такие? Я вас не звал, идите нахуй!")




@router.callback_query(F.data == "decline")
async def decline(clbck: CallbackQuery):
    """This handler suppose to user redate interview"""

    await clbck.message.reply("Хорошо! 🌹\nДавайте перенесем ваше собеседование на другой день🙂", reply_markup=kb.отказ)



@router.callback_query(F.data == "record")
async def record(clbck: CallbackQuery, state: FSMContext):
    """This handler help user choose date when he will come to the interview"""

    v = await state.get_data()
    dt = datetime.now()
    days = [[], []]
    for i in range(6):
        v = datetime.fromordinal(dt.toordinal()+i)
        if v.weekday() < 5 and len(days[0]) < 2:
            days[0].append(InlineKeyboardButton(text=f"{v.day} {config.MONTHS[v.month-1]}", callback_data=f'rday{db.shit(dt.toordinal()+i)}'),)
    days[1].append(InlineKeyboardButton(text="Отмена", callback_data='cancel'))
    await clbck.message.reply("Выберете дату, когда вы сможете подойти:", reply_markup=days)


@router.callback_query(F.data.startswith('rday'))
async def retime(clbck: CallbackQuery, state: FSMContext):
    """This function helps user rechoose time when the user will come to the interview"""

    await state.update_data(date=clbck.data.split('y')[1])
    tk = []
    for i, v in enumerate(config.INTERVIEW_TIME):
        tk.append([InlineKeyboardButton(text=v, callback_data=f'rtime{i}')])
    time_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=tk)
    await clbck.message.reply("Теперь, переназначьте время:",reply_markup= time_kb)



@router.callback_query(F.data.startswith('rtime'))
async def done(clbck: CallbackQuery, state: FSMContext):
    """Handler says thanks and add job seeker to the database"""

    v = await state.get_data()
    await state.update_data(time=config.INTERVIEW_TIME[int(clbck.data.split('e')[1])])
    db.change_job_seeker(v['phone'], v["date"], config.INTERVIEW_TIME[int(clbck.data.split('e')[1])])
    await state.clear()
    await clbck.message.reply(f"Благодарю вас за ответ! 🌿\nХорошо перезаписали вас на {datetime.fromordinal(int(v['date'])).day}.{datetime.fromordinal(int(v['date'])).month}.{datetime.fromordinal(int(v['date'])).year} {config.INTERVIEW_TIME[int(clbck.data.split('e')[1])]}.\nЖдём вас по адресу {config.ADDRESS}. \nДо встречи!🌻")




@router.callback_query(F.data == "redecline")
async def redecline(clbck: CallbackQuery, state: FSMContext):
    """Handler says bye to the user"""

    v = await state.get_data()
    db.del_job_seeker(v['phone'])
    await clbck.message.reply("Поняла! \nВсего доброго! До свидания 👋")




@router.callback_query(F.data == "accept")
async def accept(clbck: CallbackQuery, state: FSMContext):
    """This handler says, that user checked-in"""

    await state.clear()
    await clbck.message.reply(f"Отлично! Ваше время подтверждено ✅ \nЖдём вас по адресу {config.ADDRESS}. \nДо встречи!🌻")




@router.message(Command("start"))
async def cmd_start(msg: Message, state: FSMContext):
    """Start command handler"""

    await state.clear()
    await msg.reply("Добрый день! Вы откликались на нашу вакансию в Hh.ru , с помощью данного бота вы можете записаться на вводное собеседование😌🌿", reply_markup=kb.запись)



@router.callback_query(F.data == "cancel")
async def cancel(clbck: CallbackQuery, state: FSMContext):
    """Cancel handler"""

    await clbck.message.reply("Ваш запрос успешно отменён.")
    await state.clear()



@router.callback_query(F.data == "supdec")
async def sup_dec(clbck: CallbackQuery, state: FSMContext):
    """Handler when user don't need support"""

    await state.clear()
    await clbck.message.reply("Отменил!")



@router.callback_query(F.data == "supace")
async def sup_ace(clbck: CallbackQuery, state: FSMContext):
    """Handler when user need support"""

    db.add_ticket(clbck.message.message_id, clbck.message.text, clbck.message.chat.id)
    b= await state.get_data()
    a =[]
    for i in db.get_administrators():
        a.append(i[2])
    for i in a:
        t = db.get_admin(i)
        await clbck.bot.send_message(t[0][1], """Новый вопрос от соискателя:
для того чтобы посмотреть и ответить отправьте команду /tickets""")

    db.add_ticket(b['mid'], b['text'], b['chatid'])

    await clbck.message.reply("Позвал администратора, он должен ответить в течение 15 минут.")
    await state.clear()



@router.message(F.text)
async def handle_support(msg: Message, state: FSMContext):
    """Handler of bare text messages"""

    if not db.ga(msg.from_user.username):
        await state.update_data(text=msg.text)
        await state.update_data(mid=msg.message_id)
        await state.update_data(chatid=msg.chat.id)

        await msg.reply("Здравствуйте, не могу ответить на ваше сообщение, позвать администратора?", reply_markup=kb.поддержка)
