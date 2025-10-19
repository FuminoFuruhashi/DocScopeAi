"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  BarChart3, 
  FileText, 
  Search, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Home,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';


interface Document {
  id: number;
  filename: string;
  pages: number;
  tipo_documento: string | null;
  fecha: string | null;
  emisor: string | string[] | null;
  total: string | null;
  moneda: string | null;
  resumen: string | null;
  created_at: string;
}

interface Stats {
  total_documents: number;
  document_types: Record<string, number>;
  total_expenses: number;
  currency: string;
}

interface Document {
  id: number;
  filename: string;
  pages: number;
  tipo_documento: string | null;
  fecha: string | null;
  emisor: string | string[] | null;
  total: string | null;
  moneda: string | null;
  resumen: string | null;
  created_at: string;
}

interface Stats {
  total_documents: number;
  document_types: Record<string, number>;
  total_expenses: number;
  currency: string;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, statsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/documents'),
        fetch('http://127.0.0.1:8000/stats')
      ]);

      const docsData = await docsRes.json();
      const statsData = await statsRes.json();

      setDocuments(docsData.documents || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await fetch(`http://127.0.0.1:8000/documents/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.resumen?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.tipo_documento === filterType;
    return matchesSearch && matchesFilter;
  });

  const documentTypes = stats?.document_types || {};
  const pieData = Object.entries(documentTypes).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#a855f7', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">DocScope AI</h1>
                <p className="text-xs text-purple-300">Dashboard</p>
              </div>
            </Link>
          </div>
          
          <Link 
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Home className="w-4 h-4" />
            Subir documento
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-purple-300">Total de documentos</p>
                <p className="text-3xl font-bold">{stats?.total_documents || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-purple-300">Gastos totales</p>
                <p className="text-3xl font-bold">
                  ${stats?.total_expenses.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-purple-300">Tipos diferentes</p>
                <p className="text-3xl font-bold">
                  {Object.keys(documentTypes).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        {pieData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Distribución de documentos
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: Record<string, unknown>) => {
                      const name = props.name as string;
                      const percent = props.percent as number;
                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-12 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 transition-colors appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="all">Todos los tipos</option>
                {Object.keys(documentTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-purple-300 mt-4">
            {filteredDocuments.length} documento(s) encontrado(s)
          </p>
        </motion.div>

        {/* Documents List */}
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-bold">{doc.filename}</h3>
                      {doc.tipo_documento && (
                        <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs font-medium capitalize">
                          {doc.tipo_documento}
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-3">
                      {doc.fecha && (
                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <Calendar className="w-4 h-4" />
                          {doc.fecha}
                        </div>
                      )}
                      
                      {doc.total && (
                        <div className="flex items-center gap-2 text-sm text-green-300">
                          <DollarSign className="w-4 h-4" />
                          {doc.moneda || '$'} {doc.total}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-purple-300">
                        <FileText className="w-4 h-4" />
                        {doc.pages} página(s)
                      </div>
                    </div>

                    {doc.resumen && (
                      <p className="text-sm text-purple-200 line-clamp-2">{doc.resumen}</p>
                    )}

                    <p className="text-xs text-purple-400 mt-2">
                      Analizado: {formatDate(doc.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5 text-blue-300" />
                    </button>
                    
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5 text-red-300" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
              <p className="text-purple-300">No se encontraron documentos</p>
            </div>
          )}
        </div>
      </main>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedDoc.filename}</h2>
                  {selectedDoc.tipo_documento && (
                    <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-sm capitalize">
                      {selectedDoc.tipo_documento}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {selectedDoc.fecha && (
                  <div>
                    <p className="text-sm text-purple-400 mb-1">Fecha</p>
                    <p className="font-medium">{selectedDoc.fecha}</p>
                  </div>
                )}

                {selectedDoc.emisor && (
                  <div>
                    <p className="text-sm text-purple-400 mb-1">Emisor</p>
                    {Array.isArray(selectedDoc.emisor) ? (
                      <ul className="space-y-1">
                        {selectedDoc.emisor.map((e, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-medium">{selectedDoc.emisor}</p>
                    )}
                  </div>
                )}

                {selectedDoc.total && (
                  <div>
                    <p className="text-sm text-purple-400 mb-1">Total</p>
                    <p className="font-medium text-xl text-green-300">
                      {selectedDoc.moneda || '$'} {selectedDoc.total}
                    </p>
                  </div>
                )}

                {selectedDoc.resumen && (
                  <div>
                    <p className="text-sm text-purple-400 mb-1">Resumen</p>
                    <p className="text-purple-100 leading-relaxed">{selectedDoc.resumen}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-purple-400 mb-1">Páginas</p>
                  <p className="font-medium">{selectedDoc.pages}</p>
                </div>

                <div>
                  <p className="text-sm text-purple-400 mb-1">Analizado</p>
                  <p className="font-medium">{formatDate(selectedDoc.created_at)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}