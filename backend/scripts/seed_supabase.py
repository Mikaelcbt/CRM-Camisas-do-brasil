import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Environment variables missing!")
    sys.exit(1)

supabase: Client = create_client(url, key)

def seed():
    print("Seeding Supabase Database...")
    
    # Exemplo: categorias, cores, tamanhos - ajuste conforme a necessidade exata
    # supabase.table("categories").insert([{"name": "Camisas"}, {"name": "Calças"}]).execute()
    
    # Kanban board básico
    try:
        supabase.table("kanban_boards").insert([{"name": "Vendas"}]).execute()
        print("Board created.")
    except Exception as e:
        print(f"Error or already exists: {e}")
        
    print("Done!")

if __name__ == "__main__":
    seed()
