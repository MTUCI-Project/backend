FROM python:bookworm

RUN apt update
RUN apt install pipx
RUN pipx install poetry
COPY . /app
WORKDIR /app
RUN poetry install
VOLUME /my_volum
