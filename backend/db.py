import sqlite3
from hashlib import sha512
import datetime
import config
from aiogram.utils.deep_linking import create_start_link, decode_payload



def init():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('''
CREATE TABLE IF NOT EXISTS JobSeekers (
id TEXT PRIMARY KEY,
fio TEXT NOT NULL,
phone TEXT NOT NULL,
vacancy TEXT NOT NULL,
date INT NOT NULL,
time TEXT NOT NULL,
inviter TEXT NOT NULL,
chatid TEXT NOT NULL
)
''')
    cursor.execute('''
CREATE TABLE IF NOT EXISTS Admins (
id TEXT PRIMARY KEY,
fio TEXT NOT NULL,
phone TEXT NOT NULL,
username TEXT NOT NULL,
chatid TEXT NOT NULL
)
''')
    cursor.execute('''
CREATE TABLE IF NOT EXISTS Vacancies (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
link TEXT NOT NULL,
admin TEXT NOT NULL
)
''')
    cursor.execute('''
CREATE TABLE IF NOT EXISTS Supports (
id TEXT PRIMARY KEY,
text TEXT NOT NULL,
answered TEXT NOT NULL,
chatid TEXT NOT NULL,
mid TEXT NOT NULL 
)
''')
    connection.commit()
    connection.close()
    return True


def add_job_seeker(fio: str, phone: str, vacancy: str, date: int, time: str, inviter: str):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()
    hassh = sha512()
    chatid = "k"
    hassh.update(f"{fio}{phone}{vacancy}{time}{inviter}".encode())
    cursor.execute('INSERT INTO JobSeekers (fio, phone, vacancy, date, time, inviter, chatid, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', (fio, phone, vacancy, date, time, inviter, chatid, hassh.hexdigest()))

    connection.commit()
    connection.close()
    return hassh


def add_admin(fio: str, phone: str, username: str):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()
    hassh = sha512()
    hassh.update(f"{fio}{phone}{username}".encode())
    chatid = "k"
    cursor.execute('INSERT INTO Admins (fio, phone, username, chatid, id) VALUES (?, ?, ?, ?, ?)', (fio, phone, username, chatid, hassh.hexdigest()))

    connection.commit()
    connection.close()
    return hassh


def del_admin(phone: str):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('DELETE FROM Admins WHERE phone = ?', (phone,))

    connection.commit()
    connection.close()
    return True


def add_vacancy(name: str, link: str, admin: str):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()
    hassh = sha512()
    hassh.update(f"{name}{link}{admin}".encode())
    cursor.execute('INSERT INTO Vacancies (name, link, id, admin) VALUES (?, ?, ?, ?)', (name, link, hassh.hexdigest(), admin))

    connection.commit()
    connection.close()
    return hassh


def del_vacancy(hash: str):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('DELETE FROM Vacancies WHERE id = ?', (hash,))

    connection.commit()
    connection.close()
    return True


def is_this_time_free(time: int):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM Users')
    job_seekers = cursor.fetchall()

    connection.commit()
    connection.close()

    if time in job_seekers:
        return False
    return True


def get_vacancies():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM Vacancies')
    job_seekers = cursor.fetchall()

    connection.commit()
    connection.close()

    return job_seekers

def get_administrators():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM Admins')
    admins = cursor.fetchall()

    connection.commit()
    connection.close()

    return admins

def get_verified_administrators():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM Admins WHERE chatid != ?', ('k'))
    admins = cursor.fetchall()

    connection.commit()
    connection.close()

    return admins

def get_job_seekers():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM JobSeekers')
    js = cursor.fetchall()

    connection.commit()
    connection.close()

    return js

def get_tickets():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT mid, text, chatid FROM Supports WHERE answered = ?', ("False",))
    js = cursor.fetchall()

    connection.commit()
    connection.close()

    return js

def get_js(phone):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    # cursor.execute('SELECT fio, vacancy, date, time, phone FROM JobSeekers WHERE phone = ?', (phone))
    cursor.execute('SELECT fio, vacancy, date, time, inviter, phone FROM JobSeekers WHERE phone = ?', (str(phone),))

    js = cursor.fetchall()
    l = []
    for item in js:
        l.append(item)

    connection.commit()
    connection.close()

    return l

def get_admin(phone):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    # cursor.execute('SELECT fio, vacancy, date, time, phone FROM JobSeekers WHERE phone = ?', (phone))
    cursor.execute('SELECT fio, chatid, phone FROM Admins WHERE phone = ?', (str(phone),))

    js = cursor.fetchall()
    l = []
    for item in js:
        l.append(item)

    connection.commit()
    connection.close()

    return l

def ga(username):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    # cursor.execute('SELECT fio, vacancy, date, time, phone FROM JobSeekers WHERE phone = ?', (phone))
    cursor.execute('SELECT fio, username FROM Admins WHERE username = ?', (str(username),))

    js = cursor.fetchall()
    l = []
    for item in js:
        l.append(item)

    connection.commit()
    connection.close()

    return l

def del_job_seeker(phone: str):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('DELETE FROM JobSeekers WHERE phone = ?', (phone,))

    connection.commit()
    connection.close()
    return True

def change_job_seeker(phone, date, time):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('UPDATE JobSeekers SET time = ? WHERE phone = ?', (time, phone))
    cursor.execute('UPDATE JobSeekers SET date = ? WHERE phone = ?', (date, phone))

    connection.commit()
    connection.close()
    return True


def shit(ordinal) -> int:
    c = datetime.datetime.fromordinal(ordinal)
    if c.weekday() == 5:
        return ordinal+2
    elif c.weekday() == 6:
        return ordinal+1
    else:
        return ordinal
    

def add_ticket(mid, message, chatid):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()
    b = sha512()
    b.update(f"{message}{mid}{chatid}".encode())
    cursor.execute('INSERT INTO Supports (text, answered, chatid, mid, id) VALUES (?, ?, ?, ?, ?)', (message, "False", chatid, mid, b.hexdigest()))

    connection.commit()
    connection.close()
    return True

def solve_ticket(mid):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('UPDATE Supports SET answered = ? WHERE mid = ?', ("True", mid))

    connection.commit()
    connection.close()
    return True

def get_today_js():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()
    dt = datetime.datetime.now()

    cursor.execute('SELECT * FROM JobSeekers WHERE date = ?', (str(dt.toordinal()),))
    js = cursor.fetchall()

    connection.commit()
    connection.close()

    return js


def get_future_js():
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()
    dt = datetime.datetime.now()

    cursor.execute('SELECT * FROM JobSeekers WHERE date > ?', (str(dt.toordinal()-1),))
    js = cursor.fetchall()

    connection.commit()
    connection.close()

    return js


def get_vacancy(hash):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT name FROM Vacancies WHERE id = ?', (str(hash),))

    js = cursor.fetchall()
    l = []
    for item in js:
        l.append(item)

    connection.commit()
    connection.close()

    return js

def verify_administrator(phone, chatid):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('UPDATE Admins SET chatid = ? WHERE phone = ?', (chatid, phone))

    connection.commit()
    connection.close()
    return True

def verify_js(phone, chatid):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('UPDATE JobSeekers SET chatid = ? WHERE phone = ?', (chatid, phone))

    connection.commit()
    connection.close()
    return True


def get_totime_js(date, time):
    connection = sqlite3.connect(config.DB_PATH)
    cursor = connection.cursor()

    cursor.execute('SELECT fio FROM JobSeekers WHERE date = ? AND time = ?', (date, time))
    js = cursor.fetchall()

    connection.commit()
    connection.close()

    return js
