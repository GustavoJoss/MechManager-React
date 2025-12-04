from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = None
    password: str
    is_superuser: bool = Field(default=False) # NOVO CAMPO
    
    profile: Optional["Profile"] = Relationship(back_populates="user")
    vehicles: List["Vehicle"] = Relationship(back_populates="owner")

class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    bio: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    user: Optional[User] = Relationship(back_populates="profile")

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
    category: Optional[str] = None # NOVO (Do CSV)
    default_price: float

class WorkOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    vehicle_id: int = Field(foreign_key="vehicle.id")
    mechanic_id: Optional[int] = Field(default=None, foreign_key="mechanic.id")
    status: str = "open"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    customer_confirmed: bool = False
    
    vehicle: Optional[Vehicle] = Relationship()
    items: List["WorkItem"] = Relationship(back_populates="workorder")

class WorkItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workorder_id: int = Field(foreign_key="workorder.id")
    service_id: int = Field(foreign_key="service.id")
    quantity: int
    unit_price: float
    workorder: Optional[WorkOrder] = Relationship(back_populates="items")
    service: Optional[Service] = Relationship()

# Schemas
class UserCreate(SQLModel):
    username: str
    email: Optional[str] = None
    password: str
    phone: str

class WorkItemCreate(SQLModel):
    service_id: int
    quantity: int
    unit_price: float

class WorkOrderCreate(SQLModel):
    vehicle_id: int
    mechanic_id: Optional[int]
    notes: Optional[str]
    items: List[WorkItemCreate]