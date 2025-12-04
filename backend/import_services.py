import csv
import os
import sys
from sqlmodel import Session, select

# Garante que o Python ache os arquivos vizinhos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, create_db_and_tables
from models import Service

def import_csv():
    # 1. Caminho do CSV
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "oficina_servicos_precos.csv")
    
    if not os.path.exists(csv_path):
        print(f"❌ ERRO: O arquivo 'oficina_servicos_precos.csv' não está na pasta backend.")
        return

    # 2. Garante que as tabelas existem (Cria o banco se não existir)
    print("🛠️  Verificando tabelas...")
    create_db_and_tables()

    # 3. Importa
    with Session(engine) as session:
        # Limpa serviços antigos se houver (opcional, bom para testes)
        # session.exec(delete(Service)) 
        
        if session.exec(select(Service)).first():
            print("⚠️  O banco já tem serviços. Pulando importação.")
            return

        print("📖 Lendo CSV...")
        count = 0
        try:
            with open(csv_path, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Cálculo simples do preço médio
                    try:
                        p_min = float(row['price_min_brl'])
                        p_max = float(row['price_max_brl'])
                        avg = (p_min + p_max) / 2
                    except:
                        avg = 0.0

                    service = Service(
                        name=row['service_name'],
                        category=row['category'],
                        default_price=avg
                    )
                    session.add(service)
                    count += 1
            
            session.commit()
            print(f" SUCESSO! {count} serviços importados.")
            
        except Exception as e:
            print(f" Erro: {e}")

if __name__ == "__main__":
    import_csv()