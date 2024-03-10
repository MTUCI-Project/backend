from fastapi import APIRouter

import backend.db as db



admin_router = APIRouter()



@admin_router.get("/admin/", tags=["admins"])
async def get_admins():
    admins = db.get_administrators()
    return admins


@admin_router.get("/admin/{phone}", tags=["admins"])
async def get_admin(phone: str):
    admin = db.get_admin(phone)
    return admin


@admin_router.post("/admin/add/{fio}/{phone}/{username}", tags=["admins"])
async def add_admin(fio: str, phone: str, username: str):
    g = db.add_admin(fio, phone, username)
    return g


@admin_router.delete("/admin/{phone}", tags=["admins"])
async def delete_admin(phone: str):
    deleted_vacancy = db.del_admin(phone)
    return deleted_vacancy
