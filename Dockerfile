FROM python:alpine

RUN apk update && apk upgrade && apk add bash poetry
COPY . /app
WORKDIR /app
RUN poetry install
VOLUME /my_volum
