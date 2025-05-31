import pandas as pd
import requests
import time

# CSV'yi yükle
df = pd.read_csv("data/job_listings_processed.csv")

# Giriş yapan employer'ın token'ı 
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInJvbGUiOiJFTVBMT1lFUiIsImlhdCI6MTc0ODY5NDU2MCwiZXhwIjoxNzQ4NzgwOTYwfQ.H8FgJfKMoN6STIV19arfMCVlRB36H00sq08nqwlMNyI"

# Backend endpoint
API_URL = "http://localhost:3000/api/jobs"  

# Employer ID'yi belirle
EMPLOYER_ID = 5  

# Her ilan için POST isteği at
headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

for i, row in df.iterrows():
    payload = {
        "title": row["title"],
        "description": row["description"],
        "companyName": row["company"],
        "employerId": EMPLOYER_ID
    }

    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        print(f"[{i+1}] Status: {response.status_code} - {response.json()}")
        time.sleep(0.2)  # isteği yavaşlat (rate limit için)
    except Exception as e:
        print(f"❌ HATA: {e}")

# En sona ekle
print("✅ İşlem tamamlandı")
