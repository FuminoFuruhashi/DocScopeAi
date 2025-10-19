from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pdfplumber
import google.generativeai as genai
import json
from datetime import datetime

from database import engine, get_db
import models

# Crear las tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⚠️ IMPORTANTE: Reemplaza con tu API key de Gemini
GEMINI_API_KEY = "AIzaSyBLp9SVFfuNzcLJ1bMmwGwU9MXeFWa4LLk"
genai.configure(api_key=GEMINI_API_KEY)

def detect_document_type(text: str) -> str:
    """Detecta el tipo de documento basándose en palabras clave"""
    text_lower = text.lower()
    
    # Palabras clave para cada tipo
    if any(word in text_lower for word in ['abstract', 'methodology', 'referencias', 'bibliografía', 'doi', 'issn', 'journal']):
        return 'articulo_cientifico'
    elif any(word in text_lower for word in ['tarea', 'ensayo', 'trabajo', 'universidad', 'profesor', 'alumno', 'matrícula', 'carrera']):
        return 'trabajo_academico'
    elif any(word in text_lower for word in ['factura', 'ticket', 'recibo', 'rfc', 'subtotal', 'iva', 'total', 'comprobante']):
        return 'documento_financiero'
    else:
        return 'general'

def get_specialized_prompt(doc_type: str, text: str) -> str:
    """Genera un prompt especializado según el tipo de documento"""

    
    
    if doc_type == 'articulo_cientifico':
        return f"""
Analiza este artículo científico y extrae la siguiente información en formato JSON:

{{
  "tipo_documento": "artículo científico",
  "titulo": "título completo del artículo",
  "autores": ["lista", "de", "autores"],
  "institucion": "institución o universidad",
  "fecha": "fecha de publicación",
  "abstract": "resumen o abstract del artículo",
  "palabras_clave": ["keywords", "del", "artículo"],
  "metodologia": "breve descripción de la metodología utilizada",
  "resultados_principales": "principales hallazgos o resultados",
  "referencias_count": "número aproximado de referencias bibliográficas",
  "revista_journal": "nombre de la revista o journal si aplica",
  "doi": "DOI si está presente",
  "resumen": "resumen ejecutivo del artículo en 2-3 líneas"
}}

Si algún campo no está presente, usa null.

DOCUMENTO:
{text[:4000]}
"""
    
    elif doc_type == 'trabajo_academico':
        return f"""
Analiza este trabajo académico (tarea, ensayo o proyecto) y extrae la siguiente información en formato JSON:

{{
  "tipo_documento": "trabajo académico",
  "titulo": "título del trabajo",
  "autores": ["nombre", "de", "estudiantes"],
  "matriculas": ["matrículas", "si", "están"],
  "institucion": "universidad o institución educativa",
  "carrera": "carrera o programa",
  "materia": "materia o asignatura",
  "profesor": "nombre del profesor si está presente",
  "fecha": "fecha de entrega o realización",
  "tema_principal": "tema o tópico principal del trabajo",
  "objetivos": "objetivos del trabajo",
  "palabras_clave": ["conceptos", "clave"],
  "tipo_trabajo": "tipo (tarea, ensayo, proyecto, investigación, etc.)",
  "resumen": "resumen del contenido en 2-3 líneas"
}}

Si algún campo no está presente, usa null.
Para múltiples autores o matrículas, usa arrays.

DOCUMENTO:
{text[:4000]}
"""
    
    elif doc_type == 'documento_financiero':
        return f"""
Analiza este documento financiero y extrae la siguiente información en formato JSON:

{{
  "tipo_documento": "tipo (factura, recibo, ticket, comprobante)",
  "fecha": "fecha del documento",
  "emisor": "nombre de la empresa o persona que emite",
  "receptor": "nombre de quien recibe (si aplica)",
  "total": "monto total (solo el número, sin símbolos)",
  "moneda": "moneda (MXN, USD, etc.)",
  "rfc_emisor": "RFC o identificación fiscal del emisor",
  "rfc_receptor": "RFC del receptor si aplica",
  "conceptos": ["lista", "de", "conceptos", "o", "items"],
  "subtotal": "subtotal si existe",
  "iva": "IVA o impuestos",
  "forma_pago": "forma de pago si está especificada",
  "folio": "número de folio o referencia",
  "resumen": "resumen breve del documento en 1-2 líneas"
}}


Si algún campo no está presente, usa null.

DOCUMENTO:
{text[:3000]}
"""
    
    else:  # general
        return f"""
Analiza este documento y extrae la información más relevante en formato JSON:

{{
  "tipo_documento": "tipo de documento detectado",
  "fecha": "fecha si existe",
  "emisor": "quien emite o crea el documento",
  "receptor": "destinatario si aplica",
  "tema_principal": "tema o propósito principal",
  "puntos_clave": ["puntos", "importantes", "del", "documento"],
  "resumen": "resumen del contenido en 2-3 líneas"
}}

DOCUMENTO:
{text[:3000]}
"""

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # 1. Extraer texto del PDF
        with pdfplumber.open(file.file) as pdf:
            full_text = ""
            num_pages = len(pdf.pages)
            for page in pdf.pages:
                full_text += page.extract_text() or ""
        
        if not full_text.strip():
            return {"error": "No se pudo extraer texto del PDF", "success": False}
        
        # 2. Detectar tipo de documento
        doc_type = detect_document_type(full_text)
        
        # 3. Obtener prompt especializado
        prompt = get_specialized_prompt(doc_type, full_text)
        
        # 4. Analizar con Gemini
        generation_config = {
            "temperature": 0.4,
            "max_output_tokens": 8192,
        }

        model = genai.GenerativeModel(
            'gemini-2.5-pro',
            generation_config=generation_config
        )
        
        response = model.generate_content(prompt)
        ai_text = response.text
        
        # Extraer JSON del markdown
        if "```json" in ai_text:
            ai_text = ai_text.split("```json")[1].split("```")[0]
        elif "```" in ai_text:
            ai_text = ai_text.split("```")[1].split("```")[0]
        
        analysis = json.loads(ai_text.strip())
        
        # 5. Guardar en la base de datos
        new_document = models.Document(
            filename=file.filename,
            pages=num_pages,
            text_preview=full_text[:500],
            tipo_documento=analysis.get("tipo_documento"),
            fecha=analysis.get("fecha"),
            emisor=json.dumps(analysis.get("emisor") or analysis.get("autores")) if (analysis.get("emisor") or analysis.get("autores")) else None,
            receptor=analysis.get("receptor"),
            total=analysis.get("total"),
            moneda=analysis.get("moneda"),
            rfc_emisor=analysis.get("rfc_emisor"),
            conceptos=json.dumps(analysis.get("conceptos") or analysis.get("palabras_clave")) if (analysis.get("conceptos") or analysis.get("palabras_clave")) else None,
            subtotal=analysis.get("subtotal"),
            iva=analysis.get("iva"),
            resumen=analysis.get("resumen")
        )
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        return {
            "filename": file.filename,
            "pages": num_pages,
            "text_preview": full_text[:500],
            "analysis": analysis,
            "detected_type": doc_type,
            "success": True,
            "document_id": new_document.id
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "filename": file.filename,
            "success": False
        }

@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    """Obtener todos los documentos analizados"""
    documents = db.query(models.Document).order_by(models.Document.created_at.desc()).all()
    
    result = []
    for doc in documents:
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "pages": doc.pages,
            "tipo_documento": doc.tipo_documento,
            "fecha": doc.fecha,
            "emisor": json.loads(doc.emisor) if doc.emisor else None,
            "receptor": doc.receptor,
            "total": doc.total,
            "moneda": doc.moneda,
            "rfc_emisor": doc.rfc_emisor,
            "conceptos": json.loads(doc.conceptos) if doc.conceptos else None,
            "subtotal": doc.subtotal,
            "iva": doc.iva,
            "resumen": doc.resumen,
            "created_at": doc.created_at.isoformat()
        })
    
    return {"documents": result, "total": len(result)}

@app.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Obtener un documento específico por ID"""
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if not doc:
        return {"error": "Documento no encontrado"}
    
    return {
        "id": doc.id,
        "filename": doc.filename,
        "pages": doc.pages,
        "text_preview": doc.text_preview,
        "tipo_documento": doc.tipo_documento,
        "fecha": doc.fecha,
        "emisor": json.loads(doc.emisor) if doc.emisor else None,
        "receptor": doc.receptor,
        "total": doc.total,
        "moneda": doc.moneda,
        "rfc_emisor": doc.rfc_emisor,
        "conceptos": json.loads(doc.conceptos) if doc.conceptos else None,
        "subtotal": doc.subtotal,
        "iva": doc.iva,
        "resumen": doc.resumen,
        "created_at": doc.created_at.isoformat()
    }

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Eliminar un documento"""
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    
    if not doc:
        return {"error": "Documento no encontrado"}
    
    db.delete(doc)
    db.commit()
    
    return {"message": "Documento eliminado", "success": True}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Obtener estadísticas generales"""
    total_docs = db.query(models.Document).count()
    
    # Contar por tipo de documento
    tipos = db.query(models.Document.tipo_documento).all()
    tipos_count = {}
    for tipo in tipos:
        if tipo[0]:
            tipos_count[tipo[0]] = tipos_count.get(tipo[0], 0) + 1
    
    # Calcular total de gastos (solo documentos con total numérico)
    total_gastos = 0
    docs_con_total = db.query(models.Document.total, models.Document.moneda).filter(
        models.Document.total.isnot(None)
    ).all()
    
    for total, moneda in docs_con_total:
        try:
            # Intentar convertir a número
            valor = float(total.replace(',', ''))
            if moneda in ['MXN', 'USD', '$']:
                total_gastos += valor
        except:
            pass
    
    return {
        "total_documents": total_docs,
        "document_types": tipos_count,
        "total_expenses": round(total_gastos, 2),
        "currency": "MXN"
    }