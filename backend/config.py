import yaml

with open("config.yaml") as f:
    conf = yaml.safe_load(f)

BOT_TOKEN = conf[0]
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
INTERVIEW_TIME = conf[1].split(" ")
PERMISSION_ERROR = (
    "У вас нет прав для запуска данной команды, обратитесь к администратору!"
)
ADDRESS = conf[2]
