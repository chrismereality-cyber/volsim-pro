from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import TradeEvent, Base
import threading
import queue

# Setup DB connection
engine = create_engine('postgresql://user:password@localhost:5432/volsim_db')
Session = sessionmaker(bind=engine)
event_queue = queue.Queue()

def db_worker():
    while True:
        event_data = event_queue.get()
        session = Session()
        try:
            event = TradeEvent(**event_data)
            session.add(event)
            session.commit()
        finally:
            session.close()
            event_queue.task_done()

# Start logger thread
threading.Thread(target=db_worker, daemon=True).start()

def log_event(event_type, symbol, message, ticket=None):
    event_queue.put({
        'event_type': event_type,
        'symbol': symbol,
        'message': message,
        'ticket': ticket
    })
