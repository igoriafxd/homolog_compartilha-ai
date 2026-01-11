// UploadScreen V3 - Integrado com autenticação e histórico do Supabase
import { useState, useEffect } from 'react';
import { 
  Upload, ArrowRight, LoaderCircle, Camera, Sparkles, 
  Menu, X, User, History, LogOut, ChevronRight, Clock, 
  Search, Calendar, Users, Eye, Share2, PlayCircle, Trash2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import ModalConfirmacao from './ModalConfirmacao';

export default function UploadScreen({ onScanComplete, onManualStart, onContinueDivisao }) {
  // Auth
  const { user, profile, signOut, updateProfile } = useAuth();
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // UI states
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  
  // Data states
  const [historico, setHistorico] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingContinue, setLoadingContinue] = useState(null); // ID da divisão sendo carregada
  
  // Profile edit states
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { id, nome }

  // Carrega histórico quando abre o modal
  useEffect(() => {
    if (showHistory) {
      fetchHistorico();
    }
  }, [showHistory]);

  // Inicializa campos de edição quando abre o modal de perfil
  useEffect(() => {
    if (showEditProfile && profile) {
      setEditNome(profile.nome || '');
      setEditTelefone(profile.telefone || '');
    }
  }, [showEditProfile, profile]);

  // Busca histórico de divisões do usuário
  const fetchHistorico = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/api/divisoes');
      
      // Busca totais para cada divisão
      const divisoesComTotais = await Promise.all(
        response.data.map(async (divisao) => {
          try {
            const totaisResponse = await api.get(`/api/calcular-totais/${divisao.id}`);
            const total = totaisResponse.data.pessoas.reduce((acc, p) => acc + p.total, 0);
            return {
              ...divisao,
              total,
              peopleCount: divisao.pessoas?.length || 0,
              pessoas: totaisResponse.data.pessoas.map(p => ({
                nome: p.nome,
                total: p.total
              }))
            };
          } catch {
            return {
              ...divisao,
              total: 0,
              peopleCount: divisao.pessoas?.length || 0,
              pessoas: []
            };
          }
        })
      );
      
      setHistorico(divisoesComTotais);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtra histórico
  const filteredHistory = historico
    .filter(item => {
      if (historyFilter === 'all') return true;
      if (historyFilter === 'progress') return item.status === 'em_andamento';
      if (historyFilter === 'finished') return item.status === 'finalizada';
      return true;
    })
    .filter(item => {
      if (!searchTerm) return true;
      const nome = item.nome || '';
      return nome.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Upload handlers
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande (máx 10MB).');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError("Selecione um arquivo para escanear.");
      return;
    }
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/scan-comanda', formData);
      const data = response.data;

      if (data.success && data.itens.length > 0) {
        onScanComplete(data.itens);
      } else {
        setError('Não foi possível extrair itens. Tente uma imagem mais nítida.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Erro ao escanear:", err);
      setError('Ocorreu um erro ao processar. Tente novamente ou inicie a divisão manualmente.');
      setIsLoading(false);
    }
  };

  // Profile handlers
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        nome: editNome,
        telefone: editTelefone
      });
      setShowEditProfile(false);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      await signOut();
    }
    setMenuOpen(false);
  };

  // Continuar divisão em andamento - busca dados completos
  const handleContinue = async (divisao) => {
    setLoadingContinue(divisao.id);
    try {
      // Busca a divisão completa com IDs das pessoas
      const response = await api.get(`/api/divisao/${divisao.id}`);
      setShowHistory(false);
      if (onContinueDivisao) {
        onContinueDivisao(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar divisão:', err);
      alert('Erro ao carregar divisão. Tente novamente.');
    } finally {
      setLoadingContinue(null);
    }
  };

  // Deletar divisão - abre modal de confirmação
  const handleDeleteClick = (divisao) => {
    setDeleteConfirmation({ id: divisao.id, nome: divisao.nome });
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    
    try {
      await api.delete(`/api/divisao/${deleteConfirmation.id}`);
      setHistorico(prev => prev.filter(d => d.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao excluir divisão. Tente novamente.');
    }
  };

  // Compartilhar via WhatsApp
  const shareToWhatsApp = (item) => {
    let msg = `🧾 *Divisão de Conta*\n`;
    if (item.nome) msg += `📍 ${item.nome}\n`;
    msg += `📅 ${formatDate(item.created_at)}\n\n`;
    
    item.pessoas?.forEach(p => {
      msg += `👤 ${p.nome}: ${formatCurrency(p.total)}\n`;
    });
    
    msg += `\n💰 *Total: ${formatCurrency(item.total)}*`;
    msg += `\n\n_Dividido com Compartilha AI_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Helpers
  const getInitial = (name) => name?.charAt(0).toUpperCase() || 'U';
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const userName = profile?.nome || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex flex-col relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
      </div>

      {/* ============ HEADER ============ */}
      <header className="relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-400" />
            <span className="text-xl font-bold text-white">
              Compartilha <span className="text-teal-400">AI</span>
            </span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold border-2 border-teal-400/50">
              {getInitial(userName)}
            </div>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all text-white"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 top-full mt-2 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-teal-400/30 shadow-2xl shadow-teal-500/20 overflow-hidden z-30">
              <div className="p-2">
                <div className="px-4 py-3 border-b border-white/10 mb-2">
                  <p className="text-white font-semibold truncate">{userName}</p>
                  <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => { setShowHistory(true); setMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/10 text-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-teal-400" />
                    <span className="font-medium">Histórico</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
                
                <button
                  onClick={() => { setShowEditProfile(true); setMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/10 text-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-teal-400" />
                    <span className="font-medium">Editar Perfil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-md w-full">
          {/* Saudação */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Olá, <span className="text-teal-400">{userName.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-gray-300 text-base sm:text-lg">
              Simplifique a conta, aproveite o momento
            </p>
          </div>

          {/* Card de Upload */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-400/30 shadow-2xl shadow-teal-500/20 mb-6 hover:border-teal-400/50 transition-all">
            <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-400" />
              Escanear Comanda
            </h2>
            
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-teal-400/60 rounded-2xl p-8 text-center hover:border-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/10 group-hover:to-cyan-500/10 transition-all"></div>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/webp" 
              />
              
              <div className="relative z-10 w-full">
                {preview ? (
                  <div className="space-y-3">
                    <img 
                      src={preview} 
                      alt="Pré-visualização" 
                      className="object-contain h-40 w-full rounded-lg mx-auto shadow-lg" 
                    />
                    <p className="text-teal-400 text-sm font-semibold">✓ Imagem carregada</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-500 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-lg shadow-teal-500/50">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <p className="text-white font-bold text-base sm:text-lg mb-2">
                      Clique para enviar foto
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      PNG, JPG, WEBP (MAX. 10MB)
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-teal-400 text-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>IA extrai os itens automaticamente</span>
                    </div>
                  </>
                )}
              </div>
            </label>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-center text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={!selectedFile || isLoading}
              className="w-full mt-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin w-5 h-5" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Processar com IA
                </>
              )}
            </button>
          </div>

          {/* Divisor */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm font-semibold">OU</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>

          {/* Botão Manual */}
          <button
            onClick={onManualStart}
            className="w-full text-white font-semibold hover:text-teal-400 transition-all flex items-center justify-center gap-2 border-2 border-white/30 px-6 py-4 rounded-xl hover:border-teal-400 hover:bg-teal-400/10 group active:scale-[0.98]"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Iniciar Divisão Manualmente
          </button>
        </div>
      </div>

      {/* ============ MODAL HISTÓRICO ============ */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-teal-400/30 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">Histórico</h2>
              </div>
              <button
                onClick={() => { setShowHistory(false); setSearchTerm(''); setExpandedItem(null); }}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filtros */}
            <div className="p-4 sm:p-6 border-b border-white/10 space-y-4 flex-shrink-0">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-all"
                />
              </div>

              {/* Filtros de Status */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    historyFilter === 'all'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Todas ({historico.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('progress')}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    historyFilter === 'progress'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Em Andamento ({historico.filter(h => h.status === 'em_andamento').length})
                </button>
                <button
                  onClick={() => setHistoryFilter('finished')}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    historyFilter === 'finished'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Finalizadas ({historico.filter(h => h.status === 'finalizada').length})
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderCircle className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
              ) : filteredHistory.length > 0 ? (
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-teal-400/30 transition-all"
                    >
                      {/* Card Header */}
                      <div className="p-4 sm:p-5">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-white font-bold text-lg">
                                {item.nome || `Divisão #${item.id.slice(0, 6)}`}
                              </h3>
                              {item.status === 'em_andamento' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Em andamento
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                                  Finalizada
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-teal-400">{formatCurrency(item.total)}</p>
                            <p className="text-gray-400 text-sm flex items-center justify-end gap-1">
                              <Users className="w-4 h-4" />
                              {item.peopleCount} pessoas
                            </p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            {expandedItem === item.id ? 'Ocultar' : 'Detalhes'}
                          </button>
                          
                          {item.status === 'em_andamento' ? (
                            <button 
                              onClick={() => handleContinue(item)}
                              className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold transition-all text-sm"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Continuar
                            </button>
                          ) : (
                            <button
                              onClick={() => shareToWhatsApp(item)}
                              className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold transition-all text-sm"
                            >
                              <Share2 className="w-4 h-4" />
                              Compartilhar
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-sm"
                            title="Excluir divisão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detalhes Expandidos */}
                      {expandedItem === item.id && (
                        <div className="border-t border-white/10 p-4 sm:p-5 bg-white/5">
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-teal-400" />
                            Divisão por pessoa
                          </h4>
                          <div className="space-y-2">
                            {item.pessoas?.map((pessoa, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                    {getInitial(pessoa.nome)}
                                  </div>
                                  <span className="text-white font-medium">{pessoa.nome}</span>
                                </div>
                                <span className="text-teal-400 font-bold">{formatCurrency(pessoa.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma divisão encontrada</p>
                  <p className="text-gray-500 text-sm mt-1">Comece escaneando uma comanda!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL EDITAR PERFIL ============ */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-teal-400/30 shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
              </div>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-teal-400/50">
                  {getInitial(editNome || userName)}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Nome</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-all"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-gray-500 cursor-not-allowed"
                />
                <p className="text-gray-500 text-xs mt-1">O email não pode ser alterado</p>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Telefone</label>
                <input
                  type="tel"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  placeholder="(00) 0 0000-0000"
                  className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <LoaderCircle className="animate-spin w-5 h-5" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmation && (
        <ModalConfirmacao
          mensagem={`Deseja realmente excluir "${deleteConfirmation.nome || 'esta divisão'}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
}