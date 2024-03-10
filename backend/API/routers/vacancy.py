from fastapi import APIRouter

import backend.db as db



vacancy_router = APIRouter()



@vacancy_router.get("/vacancy/", tags=["vacancies"])
async def get_vacancies():
    vacancies = db.get_vacancies()
    return vacancies


@vacancy_router.get("/vacancy/{hash}", tags=["vacancies"])
async def get_vacancy(hash: str):
    vacancy = db.get_vacancy(hash)
    return vacancy


@vacancy_router.post("/vacancy/add/{vacancy_name}/{link}/{admin}", tags=["vacancies"])
async def add_vacancy(vacancy_name: str, link: str, admin: str):
    g = db.add_vacancy(vacancy_name, link, admin)
    return g


@vacancy_router.delete("/vacancy/{hash}", tags=["vacancies"])
async def delete_vacancy(hash: str):
    deleted_vacancy = db.del_vacancy(hash)
    return deleted_vacancy
