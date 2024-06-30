FROM python:3.12-alpine

RUN apk update && apk upgrade
RUN pip install aiogram fastapi pyyaml

WORKDIR /code
COPY . .

CMD ["python", "./main.py"]
