from fastapi import FastAPI
from routes.users import router as users_router
from database import engine, get_db
from models.user import User

app = FastAPI()

app.include_router(users_router)

@app.get("/")
def root():
    return {"message": "FastAPI is running!"}

@app.get("/test")
def test():
    db = next(get_db())
    users = db.query(User).all()
    return {"count": len(users), "users": [u.user_name for u in users]}