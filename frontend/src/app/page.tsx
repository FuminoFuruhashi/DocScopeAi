"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Upload, FileText, Sparkles, Zap, TrendingUp, CheckCircle2, Calendar, DollarSign, Building2, FileCheck, Receipt, List } from 'lucide-react';

interface DocumentAnalysis {
  tipo_documento: string | null;
  fecha: string | null;
  emisor: string | string[] | null;
  receptor: string | null;
  total: string | null;
  moneda: string | null;
  rfc_emisor: string | null;
  conceptos: string[] | null;
  subtotal: string | null;
  iva: string | null;
  resumen: string | null;
}

interface AnalysisResult {
  filename: string;
  pages: number;
  text_preview: string;
  analysis?: DocumentAnalysis;
  success?: boolean;
  error?: string;
}

export default function DocScopeAI() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      await analyzeDocument(droppedFiles[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      await analyzeDocument(selectedFiles[0]);
    }
  };

  const analyzeDocument = async (file: File) => {
    setAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar si hubo un error en el análisis
      if (data.error) {
        setResults({ 
          error: data.error,
          filename: file.name,
          pages: 0,
          text_preview: '',
          success: false
        });
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error('Error completo:', error);
      setResults({ 
        error: error instanceof Error ? error.message : 'Error al conectar con el servidor. Verifica que el backend esté corriendo.',
        filename: file.name,
        pages: 0,
        text_preview: '',
        success: false
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getDocumentIcon = (type: string | null) => {
    if (!type) return FileText;
    const lowerType = type.toLowerCase();
    if (lowerType.includes('factura')) return Receipt;
    if (lowerType.includes('recibo') || lowerType.includes('ticket')) return FileCheck;
    if (lowerType.includes('contrato')) return FileText;
    return FileText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DocScope AI</h1>
              <p className="text-xs text-purple-300">Análisis inteligente con Gemini</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm cursor-pointer inline-block"
            >
              Dashboard
            </Link>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer">
              Upgrade Pro
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        {!files.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10" />
              </div>
            </motion.div>
            
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Analiza tus documentos con IA
            </h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Sube facturas, recibos o contratos y obtén información clave al instante
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              {[
                { icon: Zap, text: 'Análisis instantáneo' },
                { icon: TrendingUp, text: 'Estadísticas visuales' },
                { icon: CheckCircle2, text: 'Extracción precisa' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                >
                  <feature.icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm text-purple-200">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
              isDragging
                ? 'border-purple-400 bg-purple-500/20 scale-105'
                : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              multiple
            />
            
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-center">
                <motion.div
                  animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4"
                >
                  <Upload className="w-8 h-8" />
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-2">
                  {isDragging ? '¡Suelta aquí!' : 'Arrastra tu documento'}
                </h3>
                <p className="text-purple-300 mb-4">
                  O haz clic para seleccionar archivos PDF
                </p>
                
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  <Upload className="w-5 h-5" />
                  Seleccionar archivo
                </div>
              </div>
            </label>
          </div>
        </motion.div>

        {/* Analyzing Animation */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Analizando con Gemini AI...</h3>
              <p className="text-purple-300">Extrayendo información inteligente del documento</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results && !analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 space-y-6"
            >
              {/* Header */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">Análisis completado</h3>
                    <p className="text-purple-300">{results.filename} • {results.pages} página(s)</p>
                  </div>
                  <button
                    onClick={() => {
                      setFiles([]);
                      setResults(null);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
                  >
                    Nuevo análisis
                  </button>
                </div>
              </div>

              {results.error ? (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
                  {results.error}
                </div>
              ) : results.analysis ? (
                <>
                  {/* Tipo de Documento */}
                  {results.analysis.tipo_documento && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-4">
                        {(() => {
                          const Icon = getDocumentIcon(results.analysis.tipo_documento);
                          return <Icon className="w-10 h-10 text-purple-300" />;
                        })()}
                        <div>
                          <p className="text-sm text-purple-300 mb-1">Tipo de documento</p>
                          <p className="text-2xl font-bold capitalize">{results.analysis.tipo_documento}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Información Clave */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    {results.analysis.fecha && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-xs text-purple-300">Fecha</p>
                            <p className="font-medium">{results.analysis.fecha}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {results.analysis.total && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-xs text-purple-300">Total</p>
                            <p className="font-medium text-xl">
                              {results.analysis.moneda || '$'} {results.analysis.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {results.analysis.emisor && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-purple-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-purple-300 mb-1">
                              {Array.isArray(results.analysis.emisor) ? 'Autores/Emisores' : 'Emisor'}
                            </p>
                            {Array.isArray(results.analysis.emisor) ? (
                              <ul className="space-y-1">
                                {results.analysis.emisor.map((e, i) => (
                                  <li key={i} className="font-medium flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                                    {e}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="font-medium">{results.analysis.emisor}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {results.analysis.rfc_emisor && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <FileCheck className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="text-xs text-purple-300">RFC / ID Fiscal</p>
                            <p className="font-medium font-mono">{results.analysis.rfc_emisor}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Resumen */}
                  {results.analysis.resumen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                    >
                      <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Resumen inteligente
                      </h4>
                      <p className="text-purple-100 leading-relaxed">{results.analysis.resumen}</p>
                    </motion.div>
                  )}

                  {/* Conceptos */}
                  {results.analysis.conceptos && results.analysis.conceptos.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                    >
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <List className="w-5 h-5 text-pink-400" />
                        Conceptos detectados
                      </h4>
                      <ul className="space-y-2">
                        {results.analysis.conceptos.map((concepto, i) => (
                          <li key={i} className="flex items-center gap-2 text-purple-100">
                            <div className="w-2 h-2 bg-purple-400 rounded-full" />
                            {concepto}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Detalles adicionales */}
                  {(results.analysis.subtotal || results.analysis.iva || results.analysis.receptor) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                    >
                      <h4 className="text-lg font-bold mb-4">Detalles adicionales</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {results.analysis.subtotal && (
                          <div>
                            <p className="text-xs text-purple-300 mb-1">Subtotal</p>
                            <p className="font-medium">{results.analysis.subtotal}</p>
                          </div>
                        )}
                        {results.analysis.iva && (
                          <div>
                            <p className="text-xs text-purple-300 mb-1">IVA / Impuestos</p>
                            <p className="font-medium">{results.analysis.iva}</p>
                          </div>
                        )}
                        {results.analysis.receptor && (
                          <div>
                            <p className="text-xs text-purple-300 mb-1">Receptor</p>
                            <p className="font-medium">{results.analysis.receptor}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <p className="text-purple-300">No se pudo analizar el documento con IA</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}