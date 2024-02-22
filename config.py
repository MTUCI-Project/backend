from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
SORRY_MESSAGE = "Извините, но я потерял контекст, пожалуйста, попробуйте ещё раз: "
MONTHS = [
    "Января",
    "Февраля",
    "Марта",
    "Апреля",
    "Мая",
    "Июня",
    "Июля",
    "Августа",
    "Сентября",
    "Октября",
    "Ноября", 
    "Декабря"
]
INTERVIEW_TIME = os.getenv('INTERVIEW_TIME').split(' ')
PERMISSION_ERROR = "У вас нет прав для запуска данной команды, обратитесь к администратору!"
ADDRESS = os.getenv('ADDRESS')
