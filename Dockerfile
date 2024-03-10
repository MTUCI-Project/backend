FROM python:alpine

RUN apk update && apk upgrade && apk add bash poetry
WORKDIR /usr/src/backend
COPY . .
RUN poetry install
ENTRYPOINT poetry run python main.py
VOLUME /my_volume