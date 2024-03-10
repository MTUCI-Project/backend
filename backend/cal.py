from ics import Calendar, Event
c = Calendar()
e = Event()
e.name = "My cool event"
e.begin = '2024-02-02 00:00:00'
c.events.add(e)
with open('my.ics', 'w') as f:
    f.writelines(c.serialize_iter())
