from fastapi import APIRouter

import db



jobseeker_router = APIRouter()



@jobseeker_router.get("/jobseeker/", tags=["jobseekers"])
async def get_jobseekers():
    jobseekers = db.get_job_seekers()
    return jobseekers


@jobseeker_router.get("/jobseeker/{phone}", tags=["jobseekers"])
async def get_jobseeker(phone: str):
    jobseeker = db.get_js(phone)
    return jobseeker


@jobseeker_router.post("/jobseeker/add/{fio}/{phone}/{vacancy}/{date}/{time}/{inviter}", tags=["jobseekers"])
async def add_jobseeker(fio: str, phone: str, vacancy: str, date: str, time: str, inviter: str):
    jobseeker = db.add_job_seeker(fio, phone, vacancy, date, time, inviter)
    return jobseeker


@jobseeker_router.delete("/jobseeker/{phone}", tags=["jobseekers"])
async def delete_jobseeker(phone: str):
    deleted_vacancy = db.del_job_seeker(phone)
    return deleted_vacancy
