FROM python:alpine

RUN apk update
RUN apk upgrade
RUN apk add --no-cache poetry
WORKDIR /code
COPY . .
RUN poetry install
VOLUME /code
