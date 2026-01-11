// DistributionScreen V2 - Com nome editável, loading states e visual melhorado
import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, Check, DollarSign, Users, Settings, Pencil, Save, X, LoaderCircle } from 'lucide-react';
import api from '../services/api';
import ItemCard from './ItemCard';
import PersonCard from './PersonCard';
import ModalDistribuir from './ModalDistribuir';
import ModalGerenciarItem from './ModalGerenciarItem';
import ModalAdicionarPessoa from './ModalAdicionarPessoa';
import ModalConfirmacao from './ModalConfirmacao';

export default function DistributionScreen({ divisionData: initialDivisionData, onDivisionUpdate, onGoBack, onFinalize }) {
  const [divisionData, setDivisionData] = useState(initialDivisionData);
  const [totais, setTotais] = useState(null);
  const [isLoadingTotals, setIsLoadingTotals] = useState(true);
  const [itemParaDistribuir, setItemParaDistribuir] = useState(null);
  const [taxaServico, setTaxaServico] = useState(initialDivisionData.taxa_servico_percentual);
  const [desconto, setDesconto] = useState(initialDivisionData.desconto_valor);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);
  const [isPessoaModalOpen, setIsPessoaModalOpen] = useState(false);
  const [expandedPersonId, setExpandedPersonId] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  
  // Estados para nome editável
  const [isEditingName, setIsEditingName] = useState(false);
  const [nomeDivisao, setNomeDivisao] = useState(initialDivisionData.nome || 'Divisão sem nome');
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Estados de loading para ações
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(''); // 'distribuir', 'item', 'pessoa', 'config', 'finalizar'

  const handleToggleExpand = (personId) => {
    setExpandedPersonId(prevId => (prevId === personId ? null : personId));
  };

  const colorSchemes = [
    { name: 'teal', bg: 'bg-teal-500', border: 'border-teal-500/30', text: 'text-teal-400', hover: 'hover:bg-teal-500/20' },
    { name: 'purple', bg: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'hover:bg-purple-500/20' },
    { name: 'pink', bg: 'bg-pink-500', border: 'border-pink-500/30', text: 'text-pink-400', hover: 'hover:bg-pink-500/20' },
    { name: 'sky', bg: 'bg-sky-500', border: 'border-sky-500/30', text: 'text-sky-400', hover: 'hover:bg-sky-500/20' },
    { name: 'amber', bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:bg-amber-500/20' },
    { name: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
  ];

  const fetchTotals = useCallback(async (silent = false) => {
    // Se não é silencioso, mostra loading (carregamento inicial)
    if (!silent) {
      setIsLoadingTotals(true);
    }
    try {
      const response = await api.get(`/api/calcular-totais/${divisionData.id}`);
      setTotais(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) {
        setIsLoadingTotals(false);
      }
    }
  }, [divisionData.id]);

  // Busca totais apenas quando o ID da divisão muda (carregamento inicial)
  useEffect(() => {
    fetchTotals(false); // Não é silencioso no carregamento inicial
  }, [divisionData.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce para salvar configurações
  useEffect(() => {
    const handler = setTimeout(async () => {
      const taxaAtual = parseFloat(taxaServico) || 0;
      const descontoAtual = parseFloat(desconto) || 0;
      if (taxaAtual !== divisionData.taxa_servico_percentual || descontoAtual !== divisionData.desconto_valor) {
        try {
          setProcessingAction('config');
          const response = await api.put(`/api/divisao/${divisionData.id}/config`, {
            taxa_servico_percentual: taxaAtual,
            desconto_valor: descontoAtual,
          });
          setDivisionData(response.data);
          onDivisionUpdate(response.data);
        } catch (error) {
          console.error(error);
        } finally {
          setProcessingAction('');
        }
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [taxaServico, desconto, divisionData.id, divisionData.taxa_servico_percentual, divisionData.desconto_valor, onDivisionUpdate]);

  // Handler genérico para chamadas API com loading
  const handleApiCall = async (apiPromise, actionType = '') => {
    setIsProcessing(true);
    setProcessingAction(actionType);
    try {
      const response = await apiPromise;
      onDivisionUpdate(response.data);
      setDivisionData(response.data);
      // Atualiza totais silenciosamente (sem zerar os valores na tela)
      await fetchTotals(true);
      return response.data;
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || 'Ocorreu um erro.');
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  // Salvar nome da divisão
  const handleSaveName = async () => {
    if (!nomeDivisao.trim()) return;
    
    setIsSavingName(true);
    try {
      const response = await api.put(`/api/divisao/${divisionData.id}/nome`, {
        nome: nomeDivisao.trim()
      });
      setDivisionData(response.data);
      onDivisionUpdate(response.data);
      setIsEditingName(false);
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
      alert('Erro ao salvar nome da divisão.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Cancelar edição do nome
  const handleCancelEditName = () => {
    setNomeDivisao(divisionData.nome || 'Divisão sem nome');
    setIsEditingName(false);
  };

  // Confirmar distribuição de item
  const handleConfirmDistribuicao = async (itemId, distribuicao) => {
    const updatedDivision = await handleApiCall(
      api.post(`/api/distribuir-item/${divisionData.id}`, { item_id: itemId, distribuicao }),
      'distribuir'
    );
    if (updatedDivision) {
      setItemParaDistribuir(null);
    }
  };

  // Deletar item
  const handleDeleteItem = async (itemId) => {
    setConfirmacao({
      mensagem: "Tem certeza que deseja excluir este item?",
      onConfirm: async () => {
        await handleApiCall(
          api.delete(`/api/divisao/${divisionData.id}/item/${itemId}`),
          'item'
        );
        setConfirmacao(null);
      }
    });
  };

  // Gerenciar item (adicionar/editar)
  const handleConfirmGerenciarItem = async (itemData) => {
    const isEditing = !!itemParaEditar;
    const promise = isEditing
      ? api.put(`/api/divisao/${divisionData.id}/item/${itemParaEditar.id}`, itemData)
      : api.post(`/api/divisao/${divisionData.id}/item`, itemData);
    
    const updatedDivision = await handleApiCall(promise, 'item');
    if (updatedDivision) {
      setIsItemModalOpen(false);
      setItemParaEditar(null);
    }
  };

  // Adicionar pessoa
  const handleAddPessoa = async (pessoaData) => {
    const updatedDivision = await handleApiCall(
      api.post(`/api/divisao/${divisionData.id}/pessoa`, { nome: pessoaData.nome }),
      'pessoa'
    );
    if (updatedDivision) {
      setIsPessoaModalOpen(false);
    }
  };

  // Deletar pessoa
  const handleDeletePessoa = async (pessoaId) => {
    setConfirmacao({
      mensagem: "Tem certeza que deseja excluir esta pessoa? A ação removerá ela de todos os itens.",
      onConfirm: async () => {
        await handleApiCall(
          api.delete(`/api/divisao/${divisionData.id}/pessoa/${pessoaId}`),
          'pessoa'
        );
        setConfirmacao(null);
      }
    });
  };

  // Finalizar divisão
  const handleFinalize = async () => {
    setIsProcessing(true);
    setProcessingAction('finalizar');
    try {
      // Atualiza status para finalizada
      await api.put(`/api/divisao/${divisionData.id}/finalizar`);
      // Chama callback com os totais
      onFinalize(totais);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      alert('Erro ao finalizar divisão.');
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  // Cálculos
  const subtotalGeral = divisionData.itens.reduce((sum, item) => sum + (item.valor_unitario * item.quantidade), 0);
  const valorAposDesconto = subtotalGeral - (parseFloat(desconto) || 0);
  const taxaTotal = valorAposDesconto * ((parseFloat(taxaServico) || 0) / 100);
  const totalGeral = valorAposDesconto + taxaTotal;
  const itensRestantes = totais?.progresso.itens_restantes || 0;
  const percentualDistribuido = totais?.progresso.percentual_distribuido || 0;

  return (
    <>
      {/* Loading Overlay Global */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-slate-800/90 rounded-2xl p-6 flex items-center gap-4 border border-teal-500/30">
            <LoaderCircle className="w-8 h-8 text-teal-400 animate-spin" />
            <span className="text-white font-medium">
              {processingAction === 'distribuir' && 'Salvando distribuição...'}
              {processingAction === 'item' && 'Processando item...'}
              {processingAction === 'pessoa' && 'Processando pessoa...'}
              {processingAction === 'finalizar' && 'Finalizando divisão...'}
              {!processingAction && 'Processando...'}
            </span>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 font-sans relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
        </div>

        {/* Sub-header com nome e progresso */}
        <div className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            {/* Linha 1: Nome e botão voltar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={nomeDivisao}
                      onChange={(e) => setNomeDivisao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEditName();
                      }}
                      className="flex-1 bg-white/10 border-2 border-teal-400 rounded-xl py-2 px-4 text-white placeholder-gray-400 focus:outline-none transition-all max-w-md"
                      placeholder="Nome da divisão"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-2 bg-teal-500/20 border border-teal-400/30 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-all disabled:opacity-50"
                    >
                      {isSavingName ? (
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      className="p-2 bg-white/5 border border-white/20 text-gray-400 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                      {divisionData.nome || 'Divisão sem nome'}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-2 text-gray-400 hover:text-teal-400 transition-all rounded-lg hover:bg-white/10 flex-shrink-0"
                      title="Editar nome"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={onGoBack} 
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-xl hover:border-teal-400 flex-shrink-0"
              >
                <ArrowLeft size={16} />
                Início
              </button>
            </div>

            {/* Linha 2: Progresso */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-teal-500/20 text-teal-300 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-teal-400/30">
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  <span className="font-bold">{percentualDistribuido.toFixed(0)}%</span> distribuído
                </div>
                {itensRestantes > 0 && (
                  <div className="bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-orange-400/30">
                    <span className="font-bold">{itensRestantes}</span> {itensRestantes === 1 ? 'item restante' : 'itens restantes'}
                  </div>
                )}
                {itensRestantes === 0 && percentualDistribuido === 100 && (
                  <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-green-400/30">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Tudo distribuído!</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentualDistribuido}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 lg:items-stretch gap-6">
            {/* Coluna da Esquerda: Itens e Configurações */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-col h-auto lg:h-[calc(100vh-280px)] min-h-[500px]">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-teal-400" />
                  Itens da Conta
                  <span className="text-sm text-gray-400 font-normal">({divisionData.itens.length})</span>
                </h2>
                <button 
                  onClick={() => { setItemParaEditar(null); setIsItemModalOpen(true); }} 
                  className="flex items-center gap-1 text-sm text-teal-300 font-semibold px-3 py-2 rounded-lg hover:bg-teal-500/10 transition-colors"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              
              {/* Lista de itens com scroll */}
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2 mb-4">
                <div className="space-y-3">
                  {divisionData.itens.length > 0 ? (
                    divisionData.itens.map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        onDistributeClick={setItemParaDistribuir} 
                        onEditClick={(itemToEdit) => { setItemParaEditar(itemToEdit); setIsItemModalOpen(true); }} 
                        onDeleteClick={handleDeleteItem} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum item adicionado</p>
                      <p className="text-sm">Clique em "Adicionar" para começar</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Totais e Configurações - fixo no bottom */}
              <div className="flex-shrink-0 border-t border-white/20 pt-4">
                {/* Resumo de valores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-300 text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {subtotalGeral.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-400 text-sm">
                    <span>Desconto:</span>
                    <span>- R$ {(parseFloat(desconto) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300 text-sm">
                    <span>Taxa ({taxaServico}%):</span>
                    <span className="flex items-center gap-2">
                      + R$ {taxaTotal.toFixed(2)}
                      {processingAction === 'config' && (
                        <LoaderCircle className="w-3 h-3 animate-spin text-teal-400" />
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-white text-2xl font-bold pt-2 border-t border-white/10">
                    <span>Total:</span>
                    <span className="text-teal-400">R$ {totalGeral.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Configurações */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-400" />
                    Configurações
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Taxa de Serviço (%)</label>
                      <input 
                        type="number" 
                        value={taxaServico} 
                        onChange={(e) => setTaxaServico(e.target.value)} 
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Desconto (R$)</label>
                      <input 
                        type="number" 
                        value={desconto} 
                        onChange={(e) => setDesconto(e.target.value)} 
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Pessoas */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-col h-auto lg:h-[calc(100vh-280px)] min-h-[500px]">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-teal-400" />
                  Pessoas
                  <span className="text-sm text-gray-400 font-normal">({divisionData.pessoas.length})</span>
                </h2>
                <button 
                  onClick={() => setIsPessoaModalOpen(true)} 
                  className="flex items-center gap-1 text-sm text-teal-300 font-semibold px-3 py-2 rounded-lg hover:bg-teal-500/10 transition-colors"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              
              {/* Lista de pessoas com scroll */}
              <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2 mb-4">
                <div className="space-y-4">
                  {divisionData.pessoas.length > 0 ? (
                    divisionData.pessoas.map((pessoa, index) => (
                      <PersonCard 
                        key={pessoa.id} 
                        pessoa={pessoa} 
                        totais={totais} 
                        onDeleteClick={handleDeletePessoa}
                        colorScheme={colorSchemes[index % colorSchemes.length]}
                        isExpanded={expandedPersonId === pessoa.id}
                        onToggleExpand={() => handleToggleExpand(pessoa.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma pessoa adicionada</p>
                      <p className="text-sm">Clique em "Adicionar" para começar</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botão Finalizar */}
              <div className="flex-shrink-0 pt-4 border-t border-white/10">
                <button 
                  onClick={handleFinalize} 
                  disabled={!totais || itensRestantes > 0 || isProcessing} 
                  className="w-full px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg rounded-xl hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {processingAction === 'finalizar' ? (
                    <>
                      <LoaderCircle className="w-6 h-6 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <Check className="w-6 h-6" />
                      Finalizar
                    </>
                  )}
                </button>
                {itensRestantes > 0 && (
                  <p className="text-center text-orange-400 text-sm mt-2">
                    Distribua todos os itens para finalizar
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modais */}
      {itemParaDistribuir && (
        <ModalDistribuir 
          item={itemParaDistribuir} 
          pessoas={divisionData.pessoas} 
          onConfirm={handleConfirmDistribuicao} 
          onCancel={() => setItemParaDistribuir(null)} 
        />
      )}
      {isItemModalOpen && (
        <ModalGerenciarItem 
          item={itemParaEditar} 
          onConfirm={handleConfirmGerenciarItem} 
          onCancel={() => setIsItemModalOpen(false)} 
        />
      )}
      {isPessoaModalOpen && (
        <ModalAdicionarPessoa 
          onConfirm={handleAddPessoa} 
          onCancel={() => setIsPessoaModalOpen(false)} 
        />
      )}
      {confirmacao && (
        <ModalConfirmacao 
          mensagem={confirmacao.mensagem} 
          onConfirm={confirmacao.onConfirm} 
          onCancel={() => setConfirmacao(null)} 
        />
      )}
    </>
  );
}