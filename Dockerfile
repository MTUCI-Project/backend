FROM python:alpine

RUN apk update
RUN apk upgrade
RUN pip install aiogram fastapi pyyaml
WORKDIR /code
COPY . .
RUN poetry install

