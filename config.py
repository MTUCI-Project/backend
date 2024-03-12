import yaml
from os import getcwd

with open(getcwd() + "/config.yml") as f:
    conf = yaml.safe_load(f)

BOT_TOKEN = conf["BOT_TOKEN"]
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
    "Декабря",
]
INTERVIEW_TIME = conf["INTERVIEW_TIME"].split(" ")
PERMISSION_ERROR = (
    "У вас нет прав для запуска данной команды, обратитесь к администратору!"
)
ADDRESS = conf["ADDRESS"]
DB_PATH = conf["DB_PATH"]
INITIAL_ADMIN_USERNAME = conf['INITIAL_ADMIN_USERNAME']
INITIAL_ADMIN_PHONE = conf['INITIAL_ADMIN_PHONE']
INITIAL_ADMIN_NAME = conf['INITIAL_ADMIN_NAME']
