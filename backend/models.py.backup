from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    pages = Column(Integer)
    text_preview = Column(Text)
    
    # Campos del análisis
    tipo_documento = Column(String, nullable=True)
    fecha = Column(String, nullable=True)
    emisor = Column(Text, nullable=True)  # Guardamos como JSON string si es array
    receptor = Column(String, nullable=True)
    total = Column(String, nullable=True)
    moneda = Column(String, nullable=True)
    rfc_emisor = Column(String, nullable=True)
    conceptos = Column(Text, nullable=True)  # JSON string
    subtotal = Column(String, nullable=True)
    iva = Column(String, nullable=True)
    resumen = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)