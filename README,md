# 🚀 DocScope AI

Sistema inteligente de análisis de documentos con IA. Analiza PDFs (facturas, contratos, artículos científicos, trabajos académicos) y extrae información clave automáticamente.

## ✨ Características

- 📄 Análisis inteligente de documentos con Gemini AI
- 🎯 Detección automática del tipo de documento
- 📊 Dashboard con estadísticas y gráficos
- 💾 Almacenamiento en base de datos
- 🎨 Interfaz moderna con animaciones

## 🛠️ Tecnologías

**Frontend:**
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

**Backend:**
- FastAPI
- Google Gemini AI
- SQLAlchemy
- SQLite
- pdfplumber

## 📦 Instalación Local

### Requisitos previos
- Python 3.10+
- Node.js 18+
- API Key de Google Gemini ([obtener aquí](https://aistudio.google.com/app/apikey))

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# o
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

Crea un archivo `.env` en la carpeta `backend`:
```
GEMINI_API_KEY=tu_api_key_aqui
```

Ejecuta el servidor:
```bash
uvicorn main:app --reload
```

El backend estará en: http://127.0.0.1:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```

El frontend estará en: http://localhost:3000

## 🌐 Variables de Entorno

### Backend (`backend/.env`)
```
GEMINI_API_KEY=tu_api_key_de_gemini
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Para producción, cambia la URL del backend por tu URL desplegada.

## 🚀 Deploy

### Backend (Render)
1. Conecta tu repositorio
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Agrega variable de entorno: `GEMINI_API_KEY`

### Frontend (Vercel)
1. Conecta tu repositorio
2. Root Directory: `frontend`
3. Framework: Next.js
4. Agrega variable de entorno: `NEXT_PUBLIC_API_URL` con la URL de tu backend


## 👤 Autor

Angel Sepulveda