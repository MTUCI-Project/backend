from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
sorry_msg = "Извините, но я потерял контекст, пожалуйста, попробуйте ещё раз: "
months = [
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
interview_time = os.getenv('INTERVIEW_TIME').split(' ')
permission_error = "У вас нет прав для запуска данной команды, обратитесь к администратору!"
address = os.getenv('ADDRESS')