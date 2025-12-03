import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, Check, DollarSign, Users, Settings } from 'lucide-react';
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
  const [confirmacao, setConfirmacao] = useState(null); // { mensagem, onConfirm }

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

  const fetchTotals = useCallback(async () => {
    setIsLoadingTotals(true);
    try {
      const response = await api.get(`/api/calcular-totais/${divisionData.id}`);
      setTotais(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTotals(false);
    }
  }, [divisionData.id]);

  useEffect(() => {
    fetchTotals();
  }, [divisionData, fetchTotals]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      const taxaAtual = parseFloat(taxaServico) || 0;
      const descontoAtual = parseFloat(desconto) || 0;
      if (taxaAtual !== divisionData.taxa_servico_percentual || descontoAtual !== divisionData.desconto_valor) {
        try {
          const response = await api.put(`/api/divisao/${divisionData.id}/config`, {
            taxa_servico_percentual: taxaAtual,
            desconto_valor: descontoAtual,
          });
          // Atualiza o estado local para evitar chamadas desnecessárias
          setDivisionData(response.data);
          onDivisionUpdate(response.data);
        } catch (error) {
          console.error(error);
        }
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [taxaServico, desconto, divisionData.id, onDivisionUpdate]);

  const handleApiCall = async (apiPromise) => {
    try {
      const response = await apiPromise;
      onDivisionUpdate(response.data);
      setDivisionData(response.data);
      return response.data; // Retorna os dados em caso de sucesso
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || 'Ocorreu um erro.');
      return null; // Retorna nulo em caso de erro
    }
  };

  const handleConfirmDistribuicao = async (itemId, distribuicao) => {
    const updatedDivision = await handleApiCall(api.post(`/api/distribuir-item/${divisionData.id}`, { item_id: itemId, distribuicao }));
    if (updatedDivision) {
      setItemParaDistribuir(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    setConfirmacao({
      mensagem: "Tem certeza que deseja excluir este item?",
      onConfirm: async () => {
        await handleApiCall(api.delete(`/api/divisao/${divisionData.id}/item/${itemId}`));
        setConfirmacao(null);
      }
    });
  };

  const handleConfirmGerenciarItem = async (itemData) => {
    const isEditing = !!itemParaEditar;
    const promise = isEditing
      ? api.put(`/api/divisao/${divisionData.id}/item/${itemParaEditar.id}`, itemData)
      : api.post(`/api/divisao/${divisionData.id}/item`, itemData);
    
    const updatedDivision = await handleApiCall(promise);
    if (updatedDivision) {
      setIsItemModalOpen(false);
      setItemParaEditar(null);
    }
  };

  const handleAddPessoa = async (pessoaData) => {
    const updatedDivision = await handleApiCall(api.post(`/api/divisao/${divisionData.id}/pessoa`, { nome: pessoaData.nome }));
    if (updatedDivision) {
      setIsPessoaModalOpen(false);
    }
  };

  const handleDeletePessoa = async (pessoaId) => {
    setConfirmacao({
      mensagem: "Tem certeza que deseja excluir esta pessoa? A ação removerá ela de todos os itens.",
      onConfirm: async () => {
        await handleApiCall(api.delete(`/api/divisao/${divisionData.id}/pessoa/${pessoaId}`));
        setConfirmacao(null);
      }
    });
  };

  const subtotalGeral = divisionData.itens.reduce((sum, item) => sum + (item.valor_unitario * item.quantidade), 0);
  const valorAposDesconto = subtotalGeral - (parseFloat(desconto) || 0);
  const taxaTotal = valorAposDesconto * ((parseFloat(taxaServico) || 0) / 100);
  const totalGeral = valorAposDesconto + taxaTotal;
  const itensRestantes = totais?.progresso.itens_restantes || 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 font-sans p-4 sm:p-6 lg:p-8">
        <header className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-3">Divisão da Conta</h1>
              {totais?.progresso && (
                <div className="flex items-center gap-3">
                  <div className="bg-teal-500/20 text-teal-300 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-teal-400/30">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span className="font-bold">{totais.progresso.percentual_distribuido.toFixed(0)}%</span> distribuído
                  </div>
                  {itensRestantes > 0 && (
                    <div className="bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-orange-400/30">
                      <span className="font-bold">{itensRestantes}</span> {itensRestantes === 1 ? 'item restante' : 'itens restantes'}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 w-full sm:w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totais?.progresso.percentual_distribuido || 0}%` }}
                ></div>
              </div>
            </div>
            <button onClick={onGoBack} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-xl hover:border-teal-400">
              <ArrowLeft size={16} />
              Começar de novo
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto grid lg:grid-cols-2 lg:items-stretch gap-8">
          {/* Coluna da Esquerda: Itens e Configurações */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-col h-[48rem]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-teal-400" />
                Itens da Conta
              </h2>
              <button onClick={() => { setItemParaEditar(null); setIsItemModalOpen(true); }} className="flex items-center gap-1 text-sm text-teal-300 font-semibold px-3 py-2 rounded-lg hover:bg-teal-500/10 transition-colors">
                <Plus size={16} /> Adicionar
              </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
              <div className="space-y-3">
                {divisionData.itens.map(item => (
                  <ItemCard key={item.id} item={item} onDistributeClick={setItemParaDistribuir} onEditClick={(itemToEdit) => { setItemParaEditar(itemToEdit); setIsItemModalOpen(true); }} onDeleteClick={handleDeleteItem} />
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex justify-between text-gray-300 mb-2 text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {subtotalGeral.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400 mb-2 text-sm">
                  <span>Desconto:</span>
                  <span>- R$ {(parseFloat(desconto) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300 mb-4 text-sm">
                  <span>Taxa ({taxaServico}%):</span>
                  <span>+ R$ {taxaTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-teal-400">R$ {totalGeral.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-400" />
                  Configurações Gerais
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Taxa de Serviço (%)</label>
                    <input type="number" value={taxaServico} onChange={(e) => setTaxaServico(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">Desconto (R$)</label>
                    <input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-teal-400 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Pessoas */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-col h-[48rem]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-400" />
                Pessoas
              </h2>
              <button onClick={() => setIsPessoaModalOpen(true)} className="flex items-center gap-1 text-sm text-teal-300 font-semibold px-3 py-2 rounded-lg hover:bg-teal-500/10 transition-colors">
                <Plus size={16} /> Adicionar
              </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
              <div className="space-y-4">
                {divisionData.pessoas.map((pessoa, index) => (
                  <PersonCard 
                    key={pessoa.id} 
                    pessoa={pessoa} 
                    totais={totais} 
                    onDeleteClick={handleDeletePessoa}
                    colorScheme={colorSchemes[index % colorSchemes.length]}
                    isExpanded={expandedPersonId === pessoa.id}
                    onToggleExpand={() => handleToggleExpand(pessoa.id)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8 pt-4 flex-shrink-0">
              <button onClick={() => onFinalize(totais)} disabled={!totais || totais.progresso.itens_restantes > 0} className="w-full px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg rounded-xl hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 mx-auto">
                <Check />
                Finalizar e Ver Resumo
              </button>
            </div>
          </div>
        </main>
      </div>

      {itemParaDistribuir && <ModalDistribuir item={itemParaDistribuir} pessoas={divisionData.pessoas} onConfirm={handleConfirmDistribuicao} onCancel={() => setItemParaDistribuir(null)} />}
      {isItemModalOpen && <ModalGerenciarItem item={itemParaEditar} onConfirm={handleConfirmGerenciarItem} onCancel={() => setIsItemModalOpen(false)} />}
      {isPessoaModalOpen && <ModalAdicionarPessoa onConfirm={handleAddPessoa} onCancel={() => setIsPessoaModalOpen(false)} />}
      {confirmacao && <ModalConfirmacao mensagem={confirmacao.mensagem} onConfirm={confirmacao.onConfirm} onCancel={() => setConfirmacao(null)} />}
    </>
  );
}