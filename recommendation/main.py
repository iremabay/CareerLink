from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
import pandas as pd
import psycopg2
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import jpype
import os
from io import BytesIO
from PyPDF2 import PdfReader
import requests
from datetime import datetime


app = FastAPI()

latest_cv_processed = None  # En son yüklenen CV'nin işlenmiş hali burada tutulacak

# Zemberek ve NLTK Ayarları
jar_path = "zemberek-full.jar"
if not os.path.exists(jar_path):
    raise FileNotFoundError(f"'{jar_path}' bulunamadı.")
if not jpype.isJVMStarted():
    jpype.startJVM(jpype.getDefaultJVMPath(),
                   f"-Djava.class.path={jar_path}",
                   "-Xmx2G",
                   convertStrings=False)

TurkishMorphology = jpype.JClass("zemberek.morphology.TurkishMorphology")
morphology = TurkishMorphology.createWithDefaults()

nltk.download("stopwords")
nltk.download("punkt")
turkish_stopwords = stopwords.words("turkish")


#  Metin Önişleme Fonksiyonları

def get_stem(word):
    try:
        java_word = jpype.JString(word)
        results = morphology.analyze(java_word)
        analysis_results = results.getAnalysisResults()
        if analysis_results.size() > 0:
            lemmas = analysis_results.get(0).getLemmas()
            if lemmas.size() > 0:
                return str(lemmas.get(0))
    except:
        pass
    return word

def preprocess_text(text):
    text = text.translate(str.maketrans("", "", string.punctuation)).lower()
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in turkish_stopwords]
    stemmed = [get_stem(word) for word in tokens]
    return " ".join(stemmed)


# Request Modeli

class CVRequest(BaseModel):
    cv_text: str


#  İş İlanlarını DB'den Çekme
def fetch_job_postings_from_db():
    conn = psycopg2.connect(
        host="localhost",
        database="careerlink",
        user="postgres",
        password="123456",  
        port=5432
    )
    query = 'SELECT id AS job_id, title, description, "companyName" AS company, processed_text FROM "JobPosting"'
    df = pd.read_sql(query, conn)
    conn.close()
    df["processed_text"] = df["processed_text"].fillna("")
    return df

# DB'den veri çek ve TF-IDF hesapla
df_jobs = fetch_job_postings_from_db()
vectorizer = TfidfVectorizer()
job_vectors = vectorizer.fit_transform(df_jobs["processed_text"])


# API Endpointleri
@app.post("/preprocess")
def preprocess_cv(request: CVRequest):
    try:
        processed = preprocess_text(request.cv_text)
        return { "processed_text": processed }
    except Exception as e:
        print("Önişleme hatası:", e)
        raise HTTPException(status_code=500, detail="Önişleme yapılamadı.")

@app.post("/upload")
async def upload_cv(file: UploadFile = File(...), user_id: int = Query(...)):
    global latest_cv_processed

    try:
        content = await file.read()

        # PDF veya TXT dosyası okuma
        if file.filename.endswith(".pdf"):
            reader = PdfReader(BytesIO(content))
            text = " ".join([page.extract_text() or "" for page in reader.pages])
        elif file.filename.endswith(".txt"):
            text = content.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Sadece .pdf veya .txt dosyaları kabul edilir.")

        # Önişleme
        processed = preprocess_text(text)
        latest_cv_processed = processed

        # CV metnini dosya olarak kaydetme
        filename = f"cv_{user_id}_{int(datetime.now().timestamp())}.txt"
        save_dir = "stored_cvs"
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, filename)

        with open(save_path, "w", encoding="utf-8") as f:
            f.write(text)

        # Node backende istek at ilgili kullanıcının CV yolunu güncelle
        response = requests.put(
            f"http://localhost:3000/api/users/{user_id}/cv",
            json={"cvPath": save_path}
        )

        if response.status_code != 200:
            print("CV path güncellenemedi:", response.text)

        # cv path dön
        return {
            "message": "CV başarıyla yüklendi, işlendi ve kaydedildi.",
            "cvPath": save_path
        }

    except Exception as e:
        print("Upload/Önişleme hatası:", e)
        raise HTTPException(status_code=500, detail="CV yükleme/işleme başarısız.")

@app.get("/recommend")
def recommend_jobs():
    global latest_cv_processed

    if not latest_cv_processed:
        raise HTTPException(status_code=400, detail="Önce bir CV yüklemelisiniz (/upload).")

    try:
        cv_vector = vectorizer.transform([latest_cv_processed])
        similarities = cosine_similarity(cv_vector, job_vectors)[0]
        top_indices = similarities.argsort()[::-1][:3]

        recommendations = []
        for idx in top_indices:
            recommendations.append({
                "job_id": int(df_jobs.iloc[idx]["job_id"]),
                "title": df_jobs.iloc[idx]["title"],
                "company": df_jobs.iloc[idx]["company"],
                "similarity_score": round(similarities[idx], 4)
            })

        return recommendations

    except Exception as e:
        print("Öneri hatası:", e)
        raise HTTPException(status_code=500, detail="Öneri oluşturulamadı")
