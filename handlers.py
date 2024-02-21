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



@router.message(StateFilter(None), Command("av"))
async def add_vacancy(msg: Message, state: FSMContext):
    """This handler helps add vacancy from telegram"""

    try:
        if db.get_administrators():
            if db.ga(msg.from_user.username):
                await msg.reply(
                    text="Введите название для вашей вакансии:",
                )
                await state.set_state(states.AddVacancy.name)
            else:
                await msg.reply(
                    text="У вас нет прав для запуска данной команды, обратитесь к администратору!",
                    reply_markup=kb.exit_menu
                )
        else:
            await msg.reply(
                text="На данный момент незарегистрировани ни один администратор, обратитесь к тех специалисту!"
            )
    except:
        await msg.reply(text=mesg + "/av")


@router.message(states.AddVacancy.name)
async def vacancy_name_picked(message: Message, state: FSMContext):
    """Handle name for the vacncy"""
    
    message.bot.edit_message_reply_markup(message.chat.id, message.message_id, reply_markup=None)
    try:
        await state.update_data(name=message.text)
        await message.reply(
            text="Теперь, введите ссылку на данную вакансию:",
            reply_markup=kb.exit_menu
        )
        await state.set_state(states.AddVacancy.link)
    except:
        await message.reply(text=mesg + "/av")


@router.message(states.AddVacancy.link)
async def vacancy_admin(message: Message, state: FSMContext):
    """Handle vacancy link"""

    message.bot.edit_message_reply_markup(message.chat.id, message.message_id, reply_markup=None)
    try:
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
    except:
        await message.reply(text=mesg + "/av")


@router.callback_query(F.data.startswith('vad'))
async def vacancy_added(clbck: CallbackQuery, state: FSMContext):
    """Handle fo picked admin for the vacancy"""

    try:
        vacancy_data = await state.get_data()
        y = db.get_administrators()
        await state.update_data(admin=y[int(clbck.data.split("d")[1])][1])
        db.add_vacancy(vacancy_data['name'], vacancy_data['link'], y[int(clbck.data.split("d")[1])][1])
        await clbck.message.reply(f"Вакансия \"{vacancy_data['name']}\" успешно добавлена!")
        await state.clear()
    except:
        await clbck.message.reply(text=mesg + "/av")


@router.message(StateFilter(None), Command("dv"))
async def del_vacancy(msg: Message, state: FSMContext):
    """Handler for deleting vacancy"""

    try:
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
    except:
        await msg.reply(text=mesg + "/av")


@router.callback_query(F.data.startswith('dvac'))
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
        await clbck.message.reply(text=mesg + "/av")


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
        await msg.reply(text=mesg + "/ajs")


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
        await message.reply(text=mesg + "/ajs")


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
        await message.reply(text=mesg + "/ajs")


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
                        text=f"{v.day} {months[v.month-1]}",
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
        await clbck.message.reply(text=mesg + "/ajs")


@router.callback_query(F.data.startswith('day'))
async def add_job_seeker_date(clbck: CallbackQuery, state: FSMContext):
    """Add job seedker date"""

    try:
        await state.update_data(date=clbck.data.split('y')[1])
        tk = []
        for i, v in enumerate(times):
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
        await clbck.message.reply(text=mesg + "/ajs")


@router.callback_query(F.data.startswith('time'))
async def add_job_seeker_time(clbck: CallbackQuery, state: FSMContext):
    """Handle time for jobseeker"""

    try:
        if db.ga(clbck.message.from_user.username):
            job_seeker = await state.get_data()
            time = times[int(clbck.data.split('e')[1])]
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
            time = times[int(clbck.data.split('e')[1])]
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
            await clbck.message.reply(f"""Вы успешно записались на собеседование в {time} {datetime.fromordinal(int(job_seeker['date'])).day} {months[datetime.fromordinal(int(job_seeker['date'])).month-1]} {datetime.fromordinal(int(job_seeker['date'])).year}.
Ждём вас по адресу {config.address}. 
Ваш администратор: {job_seeker['admin'].split(' ')[1]} ({job_seeker['admin'].split(' ')[2]}). 
До встречи!🌻""")
            await state.clear()
    except:
        await clbck.message.reply(text=mesg + "/ajs")


@router.message(StateFilter(None), Command("djs"))
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
        await msg.reply(text=mesg + "/djs")


@router.callback_query(F.data.startswith('djs'))
async def del_jobseeker_name(clbck: CallbackQuery, state: FSMContext):
    """Name handler for deleting jobseeker"""

    try:
        phone = clbck.data.split('s')[1]
        db.del_job_seeker(phone)
        await clbck.message.reply("Соискаель успешно удалена!")
        await state.clear()
    except:
        await clbck.message.reply(text=mesg + "/djs")



@router.message(StateFilter(None), Command("aa"))
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


@router.message(states.AddAdmin.fio)
async def add_admin_phone(message: Message, state: FSMContext):

    try:
        await state.update_data(fio=message.text)
        await message.reply(
            text="Теперь, введите номер телефона Администратора:",
            reply_markup=kb.exit_menu
        )
        await state.set_state(states.AddAdmin.phone)
    except:
        await message.reply(text=mesg + "/aa")


@router.message(states.AddAdmin.phone)
async def add_admin_username(message: Message, state: FSMContext):

    try:
        await state.update_data(phone=message.text)
        await message.reply(
            text="Теперь, введите юзернейм Администратора (без @):",
            reply_markup=kb.exit_menu
        )
        await state.set_state(states.AddAdmin.username)
    except:
        await message.reply(text=mesg + "/aa")


@router.message(states.AddAdmin.username)
async def add_admin_done(msg: Message, state: FSMContext):

    try:
        admin = await state.get_data()
        db.add_admin(admin['fio'], admin['phone'], msg.text)
        v = await create_start_link(msg.bot, f"ad{admin['phone']}", encode=True)
        await msg.reply(f"Администратор \"{admin['fio']}\" успешно добавлен! Ссылка: {v}")
        await state.clear()
    except:
        await msg.reply(text=mesg + "/aa")





@router.message(StateFilter(None), Command("da"))
async def del_admin(msg: Message, state: FSMContext):

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
        await msg.reply(text=mesg + "/da")


@router.callback_query(F.data.startswith('da'))
async def del_admin_done(clbck: CallbackQuery, state: FSMContext):

    try:
        y = db.get_administrators()
        v = int(clbck.data.split("a")[1])
        db.del_admin(y[v][2])
        await clbck.message.reply(f"Администратор \"{y[v][1]}\" успешно удален!")
        await state.clear()
    except:
        await clbck.message.reply(text=mesg + "/da")


@router.message(Command('c'))
async def convert_link(msg: Message):

    if db.ga(msg.from_user.username):
        v = msg.text.split(' ')
        hh_link = v[1].split('/')[-1]
        bot_link = await create_start_link(msg.bot, hh_link, encode=True)
        await msg.reply(bot_link)
    else:
        await msg.reply("У вас нет прав для запуска данной команды, обратитесь к администратору!")
            




@router.message(CommandStart(deep_link=True))
async def handler(message: Message, command: CommandObject, state: FSMContext):
    args = command.args
    await state.clear()
    dt = datetime
    txt = decode_payload(args)
    if "ad" in txt:
        db.verify_administrator(txt.split("d")[1], message.chat.id)
        await message.reply("Вы успешно верифицированы!")
    else:
        js = db.get_js(txt)
        if js:
            date = dt.fromordinal(js[0][2])
            time = js[0][3]
            await state.update_data(phone=txt)
            db.verify_js(txt, message.chat.id)
            await message.reply(f"Добрый день! {js[0][0]} вы записаны на собеседование {date.day}.{date.month}.{date.year} {times[int(time.split('e')[1])]}, пожалуйста подтвердите свою запись😌", reply_markup=kb.подтверждение)
        else:
            await message.reply("Вы кто такие? Я вас не звал, идите нахуй!")




@router.callback_query(F.data == "decline")
async def decline(clbck: CallbackQuery):
    await clbck.message.reply("Хорошо! 🌹\nДавайте перенесем ваше собеседование на другой день🙂", reply_markup=kb.отказ)



@router.callback_query(F.data == "record")
async def record(clbck: CallbackQuery, state: FSMContext):
        
    v = await state.get_data()
    dt = datetime.now()
    days = [[], []]
    for i in range(6):
        v = datetime.fromordinal(dt.toordinal()+i)
        if v.weekday() < 5 and len(days[0]) < 2:
            days[0].append(InlineKeyboardButton(text=f"{v.day} {months[v.month-1]}", callback_data=f'rday{db.shit(dt.toordinal()+i)}'),)
    days[1].append(InlineKeyboardButton(text="Отмена", callback_data='cancel'))
    await clbck.message.reply("Выберете дату, когда вы сможете подойти:", reply_markup=days)


@router.callback_query(F.data.startswith('rday'))
async def retime(clbck: CallbackQuery, state: FSMContext):
    await state.update_data(date=clbck.data.split('y')[1])
    tk = []
    for i, v in enumerate(times):
        tk.append([InlineKeyboardButton(text=v, callback_data=f'rtime{i}')])
    time_kb = InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=tk)
    await clbck.message.reply("Теперь, переназначьте время:",reply_markup= time_kb)



@router.callback_query(F.data.startswith('rtime'))
async def done(clbck: CallbackQuery, state: FSMContext):
    v = await state.get_data()
    await state.update_data(time=times[int(clbck.data.split('e')[1])])
    db.change_job_seeker(v['phone'], v["date"], times[int(clbck.data.split('e')[1])])
    await state.clear()
    await clbck.message.reply(f"Благодарю вас за ответ! 🌿\nХорошо перезаписали вас на {datetime.fromordinal(int(v['date'])).day}.{datetime.fromordinal(int(v['date'])).month}.{datetime.fromordinal(int(v['date'])).year} {times[int(clbck.data.split('e')[1])]}.\nЖдём вас по адресу {config.address}. \nДо встречи!🌻")




@router.callback_query(F.data == "redecline")
async def redecline(clbck: CallbackQuery, state: FSMContext):
    v = await state.get_data()
    db.del_job_seeker(v['phone'])
    await clbck.message.reply("Поняла! \nВсего доброго! До свидания 👋")




@router.callback_query(F.data == "accept")
async def accept(clbck: CallbackQuery, state: FSMContext):
    await state.clear()
    await clbck.message.reply(f"Отлично! Ваше время подтверждено ✅ \nЖдём вас по адресу {config.address}. \nДо встречи!🌻")




@router.message(Command("start"))
async def cmd_start(msg: Message, state: FSMContext):
    await state.clear()
    await msg.reply("Добрый день! Вы откликались на нашу вакансию в Hh.ru , с помощью данного бота вы можете записаться на вводное собеседование😌🌿", reply_markup=kb.запись)



@router.callback_query(F.data == "cancel")
async def cancel(state: FSMContext):
    await state.clear()



@router.callback_query(F.data == "supdec")
async def sup_dec(clbck: CallbackQuery, state: FSMContext):
    await state.clear()
    await clbck.message.reply("Отменил!")



@router.callback_query(F.data == "supace")
async def sup_ace(clbck: CallbackQuery, state: FSMContext):
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



@router.message(Command("tickets"))
async def get_tickets(msg: Message):
    tickets = db.get_tickets() #mid, text, chatid
    for i in tickets:
        await msg.reply(text=f"""Вопрос от соискателя:
{i[1]}""", reply_markup=InlineKeyboardMarkup(one_time_keyboard=True, inline_keyboard=[
    [InlineKeyboardButton(text="Ответить", callback_data=f'ans{i[2]} {i[0]}')]
]))


@router.callback_query(F.data.startswith("ans"))
async def answer(clbck: CallbackQuery, state: FSMContext):

    chatid = clbck.data.split('s')[1].split(' ')[0]
    mid = clbck.data.split('s')[1].split(' ')[1]
    await clbck.message.reply("Отправьте мне ответ на данный вопрос:", reply_markup=kb.exit_menu)
    await state.update_data(chatid=chatid)
    await state.update_data(mid = mid)
    await state.set_state(states.Tickets.message)


@router.message(states.Tickets.message)
async def add_answear_done(msg: Message, state: FSMContext):
    ans = await state.get_data()
    db.solve_ticket(ans['mid'])
    await msg.bot.send_message(ans['chatid'], msg.text, reply_to_message_id=ans['mid'])
    await msg.reply("Ваш ответ успешно доставлен!")
    await state.clear()



@router.message(F.text)
async def handle_support(msg: Message, state: FSMContext):
    if not db.ga(msg.from_user.username):
        await state.update_data(text=msg.text)
        await state.update_data(mid=msg.message_id)
        await state.update_data(chatid=msg.chat.id)

        await msg.reply("Здравствуйте, не могу ответить на ваше сообщение, позвать администратора?", reply_markup=kb.поддержка)
    else:
        pass