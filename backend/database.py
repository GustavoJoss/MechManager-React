import os
from sqlmodel import SQLModel, create_engine, Session

# --- CORREÇÃO DEFINITIVA DE CAMINHO ---
# Pega o caminho exato da pasta onde este arquivo (database.py) está
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Força o banco a ficar na pasta 'backend', não importa de onde rode o comando
sqlite_file_name = os.path.join(BASE_DIR, "database.db")
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    print(f"📁 Conectado ao banco de dados em: {sqlite_file_name}")
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session