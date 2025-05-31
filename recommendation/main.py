from fastapi import FastAPI, HTTPException
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

app = FastAPI()

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


#Request Modeli

class CVRequest(BaseModel):
    cv_text: str


#  PostgreSQL'den Veri Çekme

def fetch_job_postings_from_db():
    conn = psycopg2.connect(
        host="localhost",
        database="careerlink",
        user="postgres",
        password="123456",  
        port=5432
    )
    query = 'SELECT id AS job_id, title, description, "companyName", processed_text FROM "JobPosting"'
    df = pd.read_sql(query, conn)
    conn.close()

    # NaN olanları boş string yap
    df["processed_text"] = df["processed_text"].fillna("")
    return df


# API Endpointleri

@app.post("/preprocess")
def preprocess_cv(request: CVRequest):
    try:
        processed = preprocess_text(request.cv_text)
        return { "processed_text": processed }
    except Exception as e:
        print("Önişleme hatası:", e)
        raise HTTPException(status_code=500, detail="Önişleme yapılamadı.")

@app.post("/recommend")
def recommend_jobs(request: CVRequest):
    try:
        df_jobs = fetch_job_postings_from_db()
        if df_jobs.empty:
            raise HTTPException(status_code=404, detail="Veritabanında iş ilanı bulunamadı.")

        vectorizer = TfidfVectorizer()
        job_vectors = vectorizer.fit_transform(df_jobs["processed_text"])

        # CV'yi önişle ve vektörle
        processed_cv = preprocess_text(request.cv_text)
        cv_vector = vectorizer.transform([processed_cv])

        # Benzerlik hesapla
        similarities = cosine_similarity(cv_vector, job_vectors)[0]
        top_indices = similarities.argsort()[::-1][:3]

        recommendations = []
        for idx in top_indices:
            job = df_jobs.iloc[idx]
            recommendations.append({
                "job_id": int(job["job_id"]),
                "title": job["title"],
                "company": job["companyName"],
                "similarity_score": round(similarities[idx], 4)
            })

        return recommendations
    except Exception as e:
        print("Öneri hatası detay:", str(e)) 
        raise HTTPException(status_code=500, detail="Öneri oluşturulamadı.")
