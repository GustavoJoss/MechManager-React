import csv
import os
import sys
import random
from sqlmodel import Session, select

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import engine, create_db_and_tables
from models import Service

def import_csv():
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "oficina_servicos_precos.csv")
    if not os.path.exists(csv_path):
        print(f"❌ Arquivo não encontrado: {csv_path}")
        return

    print("🛠️  Criando banco de dados...")
    create_db_and_tables()

    with Session(engine) as session:
        if session.exec(select(Service)).first():
            print("⚠️  Serviços já existem. Pulando.")
            return

        print("📖 Importando serviços e gerando estoque...")
        try:
            with open(csv_path, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    try:
                        p_min = float(row['price_min_brl'])
                        p_max = float(row['price_max_brl'])
                        avg_price = (p_min + p_max) / 2
                    except: avg_price = 0.0

                    # Simula estoque: Serviços (Mão de obra) tem estoque infinito (9999), Peças tem estoque limitado
                    is_service = "Mão de obra" in row['service_name'] or "Serviço" in row['category']
                    initial_stock = 9999 if is_service else random.randint(5, 50)

                    service = Service(
                        name=row['service_name'],
                        category=row['category'],
                        default_price=avg_price,
                        stock=initial_stock
                    )
                    session.add(service)
                    count += 1
            session.commit()
            print(f"✅ {count} serviços importados com estoque inicial.")
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == "__main__":
    import_csv()