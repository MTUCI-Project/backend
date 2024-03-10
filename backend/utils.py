from datetime import datetime

import backend.config as config
import backend.db as db

def get_today_list(username: str):
    """Return list of today interviews"""

    if db.ga(username):
        js = db.get_today_js()
        if js != []:
            job_seekers = []
            for _, job_seeker in enumerate(js):
                job_seekers.append([{job_seeker[1]}, {job_seeker[2]}, {db.get_vacancy(job_seeker[3])[0][0]}, {job_seeker[5]}])
            return job_seekers
        else:
            return None
    else:
        return config.PERMISSION_ERROR



def get_future_list(username: str):
    """Return list of future interviews"""

    if db.ga(username):
        js = db.get_future_js()
        if js != []:
            message = []
            for _, v in enumerate(js):
                dt = datetime.fromordinal(v[4])
                message.append([v[1], v[2], db.get_vacancy(v[3])[0][0], dt.day, dt.month-1, dt.year, v[5]])
            return message
        else:
            return None
    else:
        return config.PERMISSION_ERROR
