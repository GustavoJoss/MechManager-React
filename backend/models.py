from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

# --- USUÁRIOS ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = None
    password: str
    is_superuser: bool = Field(default=False)
    
    profile: Optional["Profile"] = Relationship(back_populates="user")
    vehicles: List["Vehicle"] = Relationship(back_populates="owner")

class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    bio: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    user: Optional[User] = Relationship(back_populates="profile")

# --- OFICINA ---
class Vehicle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    plate: str
    make: str
    model: str
    year: int
    notes: Optional[str] = None
    owner: Optional[User] = Relationship(back_populates="vehicles")

class Mechanic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    specialty: Optional[str] = None
    is_active: bool = True

class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: Optional[str] = None
    default_price: float
    stock: int = Field(default=100) # NOVO: Controle de Estoque (padrão 100)

# --- ORDEM DE SERVIÇO ---
class WorkOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    vehicle_id: int = Field(foreign_key="vehicle.id")
    mechanic_id: Optional[int] = Field(default=None, foreign_key="mechanic.id")
    status: str = "open"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    customer_confirmed: bool = False
    
    # NOVO: Avaliação do Cliente
    rating: Optional[int] = None # 1 a 5 estrelas
    feedback: Optional[str] = None # Comentário do cliente

    vehicle: Optional[Vehicle] = Relationship()
    mechanic: Optional[Mechanic] = Relationship()
    items: List["WorkItem"] = Relationship(back_populates="workorder")
    photos: List["WorkOrderPhoto"] = Relationship(back_populates="workorder")

class WorkOrderPhoto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workorder_id: int = Field(foreign_key="workorder.id")
    photo_url: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    workorder: Optional[WorkOrder] = Relationship(back_populates="photos")

class WorkItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workorder_id: int = Field(foreign_key="workorder.id")
    service_id: int = Field(foreign_key="service.id")
    quantity: int
    unit_price: float
    workorder: Optional[WorkOrder] = Relationship(back_populates="items")
    service: Optional[Service] = Relationship()

# --- SCHEMAS ---
class UserCreate(SQLModel):
    username: str; email: Optional[str]=None; password: str; phone: str

class WorkItemCreate(SQLModel):
    service_id: int; quantity: int; unit_price: float

class WorkOrderCreate(SQLModel):
    vehicle_id: int; mechanic_id: Optional[int]; notes: Optional[str]; items: List[WorkItemCreate]

# Schema para Atualização de Estoque
class StockUpdate(SQLModel):
    stock: int

# Schema para Avaliação
class RatingCreate(SQLModel):
    rating: int
    feedback: str