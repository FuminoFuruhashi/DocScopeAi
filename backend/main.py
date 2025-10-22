from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import google.generativeai as genai
import json
import os

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Aceptar desde cualquier origen (cambia después a tu dominio)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key desde variable de entorno
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

def detect_document_type(text: str) -> str:
    """Detecta el tipo de documento basándose en palabras clave"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['abstract', 'methodology', 'referencias', 'bibliografía', 'doi', 'issn', 'journal']):
        return 'articulo_cientifico'
    elif any(word in text_lower for word in ['tarea', 'ensayo', 'trabajo', 'universidad', 'profesor', 'alumno', 'matrícula', 'carrera']):
        return 'trabajo_academico'
    elif any(word in text_lower for word in ['contrato', 'arrendamiento', 'cláusula', 'partes', 'obligaciones', 'términos y condiciones', 'vigencia', 'rescisión']):
        return 'contrato'
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
  "resumen": "RESUMEN EJECUTIVO DETALLADO del artículo de 4-6 líneas que incluya: objetivo del estudio, metodología empleada, principales hallazgos y conclusiones"
}}

Si algún campo no está presente, usa null.

DOCUMENTO:
{text[:8000]}
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
  "resumen": "RESUMEN EJECUTIVO DETALLADO del trabajo de 4-6 líneas que incluya: tema principal, objetivos, desarrollo y conclusiones principales"
}}

Si algún campo no está presente, usa null.
Para múltiples autores o matrículas, usa arrays.

DOCUMENTO:
{text[:8000]}
"""
    
    elif doc_type == 'contrato':
        return f"""
Analiza DETALLADAMENTE este contrato legal y extrae toda la información relevante en formato JSON.
IMPORTANTE: Sé exhaustivo y específico en tu análisis.

{{
  "tipo_documento": "contrato",
  "tipo_contrato": "tipo específico (arrendamiento, compraventa, prestación de servicios, laboral, etc.)",
  "fecha": "fecha de firma o emisión del contrato",
  "vigencia_inicio": "fecha de inicio de vigencia",
  "vigencia_fin": "fecha de término o duración",
  "partes": {{
    "parte_a": {{
      "nombre": "nombre completo de la primera parte",
      "tipo": "rol (propietario/arrendador/empleador/prestador de servicios/etc.)",
      "identificacion": "RFC, CURP o identificación fiscal",
      "domicilio": "domicilio si está presente"
    }},
    "parte_b": {{
      "nombre": "nombre completo de la segunda parte",
      "tipo": "rol (inquilino/arrendatario/empleado/cliente/etc.)",
      "identificacion": "RFC, CURP o identificación fiscal",
      "domicilio": "domicilio si está presente"
    }}
  }},
  "objeto_contrato": "descripción DETALLADA del objeto o propósito del contrato",
  "monto": "monto principal (renta, precio, salario, etc.)",
  "moneda": "moneda",
  "periodicidad_pago": "periodicidad de pago",
  "forma_pago": "forma de pago especificada",
  "clausulas_importantes": [
    {{
      "numero": "número de cláusula",
      "titulo": "título o tema de la cláusula",
      "contenido": "resumen del contenido de la cláusula"
    }}
  ],
  "obligaciones_parte_a": ["lista", "DETALLADA", "de", "obligaciones"],
  "obligaciones_parte_b": ["lista", "DETALLADA", "de", "obligaciones"],
  "derechos_parte_a": ["derechos", "de", "la", "primera", "parte"],
  "derechos_parte_b": ["derechos", "de", "la", "segunda", "parte"],
  "condiciones_rescision": "condiciones ESPECÍFICAS para terminar anticipadamente",
  "penalizaciones": "penalizaciones, multas o sanciones por incumplimiento",
  "garantias": "garantías o avales requeridos",
  "jurisdiccion": "jurisdicción o fuero aplicable para controversias",
  "condiciones_especiales": ["cualquier", "condición", "especial"],
  "lugar_firma": "lugar donde se firma",
  "testigos": ["nombres", "de", "testigos"],
  "resumen": "RESUMEN EJECUTIVO DETALLADO del contrato de 4-6 líneas que incluya: propósito principal, partes involucradas, montos clave, vigencia, y obligaciones principales"
}}

Si algún campo no está presente, usa null.
Sé lo más exhaustivo y detallado posible.

DOCUMENTO COMPLETO:
{text[:8000]}
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
  "resumen": "RESUMEN DETALLADO del documento de 3-4 líneas que incluya: tipo de transacción, monto total, emisor/receptor y conceptos principales"
}}

Si algún campo no está presente, usa null.

DOCUMENTO:
{text[:8000]}
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
{text[:8000]}
"""

@app.get("/")
def read_root():
    return {"message": "DocScope AI Backend - Ready! 🚀"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
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
            'gemini-2.0-flash-exp',
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
        
        return {
            "filename": file.filename,
            "pages": num_pages,
            "text_preview": full_text[:500],
            "analysis": analysis,
            "detected_type": doc_type,
            "success": True
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "filename": file.filename if file else "unknown",
            "success": False
        }