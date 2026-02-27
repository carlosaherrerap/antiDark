import os
import pandas as pd
import psycopg2
from fastapi import FastAPI, UploadFile, File

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_conn():
    return psycopg2.connect(DATABASE_URL)

@app.post("/import/excel")
async def import_excel(file: UploadFile = File(...)):
    content = await file.read()
    with open("/tmp/upload.xlsx", "wb") as f:
        f.write(content)
    df = pd.read_excel("/tmp/upload.xlsx")
    conn = get_conn()
    cur = conn.cursor()
    inserted = 0
    for _, row in df.iterrows():
        tipo_documento = str(row.get("tipo_documento", "") or "")
        documento = str(row.get("documento", "") or "")
        tipo_entidad = str(row.get("tipo_entidad", "") or "")
        departamento = str(row.get("departamento", "") or "")
        provincia = str(row.get("provincia", "") or "")
        distrito = str(row.get("distrito", "") or "")
        direccion = str(row.get("direccion", "") or "")
        tipo = str(row.get("tipo", "") or "")
        rubro = str(row.get("rubro", "") or "")
        cur.execute(
            "INSERT INTO entidades(tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (tipo_documento, documento, tipo_entidad, departamento, provincia, distrito, direccion, tipo, rubro)
        )
        inserted += 1
    conn.commit()
    cur.close()
    conn.close()
    return {"inserted": inserted}
