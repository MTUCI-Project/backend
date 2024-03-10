from fastapi import APIRouter

import backend.db as db



support_router = APIRouter()



@support_router.get("/support/", tags=["support"])
async def get_tickets():
    tickets = db.get_tickets()
    return tickets


@support_router.post("/support/add/{mid}/{message}/{chatid}", tags=["support"])
async def add_ticket(mid: str, message: str, chatid: str):
    ticket = db.add_ticket(mid, message, chatid)
    return ticket


@support_router.delete("/support/{mid}", tags=["support"])
async def delete_ticket(mid: str):
    deleted_ticket = db.solve_ticket(mid)
    return deleted_ticket
