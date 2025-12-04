from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordRequestForm
import shutil
import os
import uuid

from .database import create_db_and_tables, get_session, engine
from .models import *
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

os.makedirs("backend/static/profiles", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
        # Admin Padrão
        if not session.exec(select(User).where(User.username == "admin")).first():
            pwd = get_password_hash("admin")
            admin = User(username="admin", email="admin@oficina.com", password=pwd, is_superuser=True)
            session.add(admin)
            session.commit()
            session.refresh(admin)
            session.add(Profile(user_id=admin.id, phone="000000000"))
            session.commit()
        
        if not session.exec(select(Mechanic)).first():
            session.add(Mechanic(name="João Mecânico", specialty="Geral"))
            session.commit()

# --- AUTH ---
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Credenciais inválidas")
    return {"access_token": create_access_token({"sub": user.username}), "token_type": "bearer"}

@app.post("/signup")
def signup(data: UserCreate, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    # Usuário criado aqui SEMPRE é comum (False)
    new_user = User(username=data.username, email=data.email, password=get_password_hash(data.password), is_superuser=False)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    new_profile = Profile(user_id=new_user.id, phone=data.phone)
    session.add(new_profile)
    session.commit()
    return {"status": "ok"}

# --- USER ---
@app.get("/users/me")
def get_me(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    return {
        "username": user.username,
        "email": user.email,
        "is_superuser": user.is_superuser, 
        "phone": user.profile.phone if user.profile else "",
        "bio": user.profile.bio if user.profile else "",
        "photo": user.profile.photo if user.profile else None
    }

@app.put("/users/me/profile")
async def update_profile(current_user: str = Depends(get_current_user), bio: str = Form(""), phone: str = Form(""), email: str = Form(""), photo: UploadFile = File(None), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    user.email = email
    user.profile.bio = bio
    user.profile.phone = phone
    if photo:
        file_ext = photo.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        path = f"backend/static/profiles/{filename}"
        with open(path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        user.profile.photo = f"http://localhost:8000/static/profiles/{filename}"
    session.add(user)
    session.add(user.profile)
    session.commit()
    return {"status": "updated"}

# --- VEÍCULOS ---
@app.get("/vehicles")
def list_vehicles(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if user.is_superuser:
        return session.exec(select(Vehicle)).all()
    return user.vehicles

@app.post("/vehicles")
def create_vehicle(vehicle: Vehicle, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    
    # BLOQUEIO: Só admin cadastra veículo
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Apenas administradores podem cadastrar veículos.")

    # Se for admin, precisamos saber de QUEM é o carro. 
    # Como seu form frontend atual manda o vehicle.owner_id vazio ou fixo, vamos ajustar:
    # Se o admin mandou um owner_id no JSON, usa ele. Se não, associa ao admin (ou erro).
    if not vehicle.owner_id:
         vehicle.owner_id = user.id # Fallback
         
    session.add(vehicle)
    session.commit()
    return vehicle

# --- ORDENS ---
@app.get("/orders")
def list_orders(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if user.is_superuser:
        statement = select(WorkOrder).join(Vehicle)
    else:
        statement = select(WorkOrder).join(Vehicle).where(Vehicle.owner_id == user.id)
    
    orders = session.exec(statement).all()
    result = []
    for o in orders:
        total = sum(i.quantity * i.unit_price for i in o.items)
        title = " | ".join([i.service.name for i in o.items[:2]])
        result.append({
            "id": o.id, "title": title, "vehicle_plate": o.vehicle.plate,
            "total": total, "customer_confirmed": o.customer_confirmed,
            "owner_name": o.vehicle.owner.username
        })
    return result

@app.post("/orders")
def create_order(data: WorkOrderCreate, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    
    # BLOQUEIO: Só admin cria OS
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar Ordens de Serviço.")

    order = WorkOrder(vehicle_id=data.vehicle_id, mechanic_id=data.mechanic_id, notes=data.notes)
    session.add(order)
    session.commit()
    session.refresh(order)
    for item in data.items:
        session.add(WorkItem(workorder_id=order.id, **item.dict()))
    session.commit()
    return {"status": "created"}

@app.post("/orders/{oid}/confirm")
def confirm_order(oid: int, session: Session = Depends(get_session)):
    order = session.get(WorkOrder, oid)
    if order:
        order.customer_confirmed = True
        session.add(order)
        session.commit()
    return {"status": "ok"}

@app.get("/services")
def services(session: Session = Depends(get_session)): return session.exec(select(Service)).all()

@app.get("/mechanics")
def mechanics(session: Session = Depends(get_session)): return session.exec(select(Mechanic)).all()

# Endpoint para listar todos usuários (útil para o Admin escolher dono do carro)
@app.get("/users")
def list_users(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser:
        raise HTTPException(status_code=403)
    return session.exec(select(User)).all()