from aiogram.fsm.state import StatesGroup, State

class AddVacancy(StatesGroup):
    name = State()
    link = State()
    admin = State()

class DelVacancy(StatesGroup):
    name = State()

class JobSeeker(StatesGroup):
    fio = State()
    phone = State()
    vacancy = State()
    date = State()
    time = State()
    inviter = State()

class AddAdmin(StatesGroup):
    fio = State()
    phone = State()
    username = State()

class DelAdmin(StatesGroup):
    phone = State()

class ActJobSeeker(StatesGroup):
    phone = State()
    date = State()
    time = State()

class Tickets(StatesGroup):
    message = State()
    chatid = State()
    mid = State()