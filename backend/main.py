from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select, func
from fastapi.security import OAuth2PasswordRequestForm
import shutil
import os
import uuid

from .database import create_db_and_tables, get_session, engine
from .models import *
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

os.makedirs("backend/static/profiles", exist_ok=True)
os.makedirs("backend/static/orders", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
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
    new_user = User(username=data.username, email=data.email, password=get_password_hash(data.password), is_superuser=False)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    session.add(Profile(user_id=new_user.id, phone=data.phone))
    session.commit()
    return {"status": "ok"}

# --- USER ---
@app.get("/users/me")
def get_me(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    return {
        "username": user.username, "email": user.email, "is_superuser": user.is_superuser,
        "phone": user.profile.phone if user.profile else "",
        "bio": user.profile.bio if user.profile else "",
        "photo": user.profile.photo if user.profile else None
    }

@app.put("/users/me/profile")
async def update_profile(current_user: str = Depends(get_current_user), bio: str = Form(""), phone: str = Form(""), email: str = Form(""), photo: UploadFile = File(None), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    user.email = email; user.profile.bio = bio; user.profile.phone = phone
    if photo:
        ext = photo.filename.split(".")[-1]
        fname = f"{uuid.uuid4()}.{ext}"
        path = f"backend/static/profiles/{fname}"
        with open(path, "wb") as buffer: shutil.copyfileobj(photo.file, buffer)
        user.profile.photo = f"http://localhost:8000/static/profiles/{fname}"
    session.add(user); session.add(user.profile); session.commit()
    return {"status": "updated"}

@app.get("/users")
def list_users(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403)
    return session.exec(select(User)).all()

# --- ADMIN STATS ---
@app.get("/admin/stats")
def get_stats(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403)
    total_vehicles = len(session.exec(select(Vehicle)).all())
    all_orders = session.exec(select(WorkOrder)).all()
    revenue = sum([sum(i.unit_price * i.quantity for i in o.items) for o in all_orders if o.status == 'completed'])
    pending = len([o for o in all_orders if o.status == 'in_progress'])
    # Média de Avaliação
    ratings = [o.rating for o in all_orders if o.rating]
    avg_rating = sum(ratings)/len(ratings) if ratings else 0
    return {"vehicles": total_vehicles, "orders": len(all_orders), "revenue": revenue, "pending": pending, "rating": avg_rating}

# --- VEÍCULOS ---
@app.get("/vehicles")
def list_vehicles(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if user.is_superuser: return session.exec(select(Vehicle)).all()
    return user.vehicles

@app.post("/vehicles")
def create_vehicle(vehicle: Vehicle, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403, detail="Apenas admins.")
    if not vehicle.owner_id: vehicle.owner_id = user.id 
    session.add(vehicle); session.commit()
    return vehicle

# --- HISTÓRICO DO VEÍCULO (NOVO) ---
@app.get("/vehicles/{vid}/history")
def vehicle_history(vid: int, session: Session = Depends(get_session)):
    orders = session.exec(select(WorkOrder).where(WorkOrder.vehicle_id == vid, WorkOrder.status == 'completed')).all()
    history = []
    for o in orders:
        items_str = ", ".join([f"{i.service.name}" for i in o.items])
        history.append({
            "date": o.created_at,
            "mechanic": o.mechanic.name if o.mechanic else "Geral",
            "items": items_str,
            "rating": o.rating
        })
    return history

# --- ORDENS DE SERVIÇO ---
@app.get("/orders")
def list_orders(current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    stmt = select(WorkOrder).join(Vehicle) if user.is_superuser else select(WorkOrder).join(Vehicle).where(Vehicle.owner_id == user.id)
    orders = session.exec(stmt).all()
    result = []
    for o in orders:
        total = sum(i.quantity * i.unit_price for i in o.items)
        title = " | ".join([i.service.name for i in o.items[:2]])
        status = o.status
        if not o.customer_confirmed: status = "waiting_approval"
        result.append({
            "id": o.id, "title": title, "vehicle_plate": o.vehicle.plate,
            "total": total, "customer_confirmed": o.customer_confirmed, "status": status,
            "owner_name": o.vehicle.owner.username, "rating": o.rating
        })
    return result

@app.get("/orders/{oid}")
def get_order_details(oid: int, session: Session = Depends(get_session)):
    order = session.get(WorkOrder, oid)
    if not order: raise HTTPException(status_code=404)
    items_data = []
    total = 0
    for item in order.items:
        sub = item.quantity * item.unit_price
        total += sub
        items_data.append({"service_name": item.service.name, "quantity": item.quantity, "unit_price": item.unit_price, "subtotal": sub})
    return {
        "id": order.id, "status": order.status, 
        "vehicle": f"{order.vehicle.make} {order.vehicle.model} ({order.vehicle.plate})",
        "mechanic": order.mechanic.name if order.mechanic else "N/A",
        "notes": order.notes, "items": items_data, "total": total,
        "created_at": order.created_at, "customer_confirmed": order.customer_confirmed,
        "photos": order.photos, "rating": order.rating, "feedback": order.feedback
    }

@app.post("/orders")
def create_order(data: WorkOrderCreate, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403)

    # Verifica Estoque antes de criar
    for item in data.items:
        service = session.get(Service, item.service_id)
        if service.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {service.name}. Restam: {service.stock}")
        # Deduz estoque
        service.stock -= item.quantity
        session.add(service)

    order = WorkOrder(vehicle_id=data.vehicle_id, mechanic_id=data.mechanic_id, notes=data.notes)
    session.add(order); session.commit(); session.refresh(order)
    for item in data.items:
        session.add(WorkItem(workorder_id=order.id, **item.dict()))
    session.commit()
    return {"status": "created"}

@app.post("/orders/{oid}/confirm")
def confirm_order(oid: int, session: Session = Depends(get_session)):
    order = session.get(WorkOrder, oid)
    if order:
        order.customer_confirmed = True; order.status = "in_progress"
        session.add(order); session.commit()
    return {"status": "ok"}

@app.post("/orders/{oid}/finish")
def finish_order(oid: int, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403)
    order = session.get(WorkOrder, oid)
    order.status = "completed"; session.add(order); session.commit()
    return {"status": "ok"}

@app.post("/orders/{oid}/photos")
async def upload_photo(oid: int, description: str = Form(""), photo: UploadFile = File(...), current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403)
    ext = photo.filename.split(".")[-1]
    fname = f"os_{oid}_{uuid.uuid4()}.{ext}"
    path = f"backend/static/orders/{fname}"
    with open(path, "wb") as buffer: shutil.copyfileobj(photo.file, buffer)
    new_photo = WorkOrderPhoto(workorder_id=oid, photo_url=f"http://localhost:8000/static/orders/{fname}", description=description)
    session.add(new_photo); session.commit()
    return {"status": "ok", "url": new_photo.photo_url}

# --- NOVO: AVALIAÇÃO DO CLIENTE ---
@app.post("/orders/{oid}/rate")
def rate_order(oid: int, data: RatingCreate, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    order = session.get(WorkOrder, oid)
    if not order or order.status != 'completed': raise HTTPException(status_code=400, detail="OS não finalizada")
    order.rating = data.rating
    order.feedback = data.feedback
    session.add(order); session.commit()
    return {"status": "rated"}

# --- CONTROLE DE ESTOQUE ---
@app.put("/services/{sid}/stock")
def update_stock(sid: int, data: StockUpdate, current_user: str = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user.is_superuser: raise HTTPException(status_code=403)
    service = session.get(Service, sid)
    if service:
        service.stock = data.stock
        session.add(service); session.commit()
    return {"status": "ok"}

@app.get("/services")
def services(session: Session = Depends(get_session)): return session.exec(select(Service)).all()

@app.get("/mechanics")
def mechanics(session: Session = Depends(get_session)): return session.exec(select(Mechanic)).all()