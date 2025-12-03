import { useState, useEffect } from 'react';
import { Users, Boxes, Check, X } from 'lucide-react';

export default function ModalDistribuir({ item, pessoas, onConfirm, onCancel }) {
  const [modo, setModo] = useState('quantidade');
  const [distribuicao, setDistribuicao] = useState({});
  const [selecionados, setSelecionados] = useState([]);

  // Verifica se a distribuição atual do item foi feita por valor (se tem casas decimais)
  const isDistribuicaoPorValor = Object.values(item.atribuido_a || {}).some(qtd => qtd % 1 !== 0);

  useEffect(() => {
    const atribuicoesAtuais = item.atribuido_a || {};
    // Se a distribuição atual for por valor, o modal já abre nessa aba
    setModo(isDistribuicaoPorValor ? 'valor' : 'quantidade');

    // Preenche o estado da aba "Quantidade"
    const inicialQtde = pessoas.reduce((acc, p) => ({ ...acc, [p.id]: atribuicoesAtuais[p.id] || 0 }), {});
    setDistribuicao(inicialQtde);

    // Preenche o estado da aba "Valor"
    const inicialValor = Object.keys(atribuicoesAtuais).filter(id => atribuicoesAtuais[id] > 0);
    setSelecionados(inicialValor);
  }, [item, pessoas, isDistribuicaoPorValor]);

  const handleQuantidadeChange = (pessoaId, delta) => {
    setDistribuicao(prev => {
      const atual = prev[pessoaId] || 0;
      const novo = Math.max(0, atual + delta);
      const totalDistribuido = Object.values(prev).reduce((sum, val) => sum + val, 0) - atual + novo;
      // Impede que a soma ultrapasse a quantidade total do item
      return totalDistribuido > item.quantidade ? prev : { ...prev, [pessoaId]: novo };
    });
  };

  const handleSelecionadoChange = (pessoaId) => {
    setSelecionados(prev => prev.includes(pessoaId) ? prev.filter(id => id !== pessoaId) : [...prev, pessoaId]);
  };

  const totalAtual = modo === 'quantidade'
    ? Object.values(distribuicao).reduce((sum, val) => sum + val, 0)
    : selecionados.length > 0 ? item.quantidade : 0;
  const restante = item.quantidade - totalAtual;

  const handleSubmit = () => {
    let distribuicaoFinal = [];
    if (modo === 'quantidade') {
      distribuicaoFinal = Object.entries(distribuicao)
        .filter(([, q]) => q > 0)
        .map(([pessoa_id, quantidade]) => ({ pessoa_id, quantidade: Number(quantidade) }));
    } else {
      const qtdPorPessoa = selecionados.length > 0 ? item.quantidade / selecionados.length : 0;
      distribuicaoFinal = selecionados.map(pessoa_id => ({ pessoa_id, quantidade: qtdPorPessoa }));
    }
    onConfirm(item.id, distribuicaoFinal);
  };

  const formatarQuantidade = (qtd) => Number(qtd || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-teal-500/50 relative">
        <h2 className="text-2xl font-bold text-white truncate">{item.nome}</h2>
        <p className="text-gray-300 mb-4">
          Valor Total: R$ {(item.valor_unitario * item.quantidade).toFixed(2)}
        </p>

        <div className="flex bg-slate-900 rounded-xl p-1 mb-4">
          <button onClick={() => setModo('quantidade')} className={`w-1/2 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${modo === 'quantidade' ? 'bg-slate-700 shadow-sm text-teal-300' : 'text-gray-400 hover:bg-slate-800'}`}>
            <Boxes size={16} /> Por Quantidade
          </button>
          <button onClick={() => setModo('valor')} className={`w-1/2 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${modo === 'valor' ? 'bg-slate-700 shadow-sm text-teal-300' : 'text-gray-400 hover:bg-slate-800'}`}>
            <Users size={16} /> Por Valor
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {modo === 'quantidade' ? (
            <>
              <p className="text-gray-400 text-center text-sm">
                Restante: <span className={restante > 1e-9 ? 'text-yellow-400' : 'text-green-400'}>{formatarQuantidade(restante)}</span> de {item.quantidade}
              </p>
              {isDistribuicaoPorValor && (
                <p className="text-center text-yellow-500 text-xs p-2 bg-yellow-500/10 rounded-md">
                  Este item foi dividido por valor. Para editar, use a aba "Por Valor".
                </p>
              )}
              {pessoas.map(pessoa => (
                <div key={pessoa.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                  <span className="text-white">{pessoa.nome}</span>
                  <div className="flex items-center space-x-3">
                    <button disabled={isDistribuicaoPorValor} onClick={() => handleQuantidadeChange(pessoa.id, -1)} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50">-</button>
                    <span className="w-10 text-center font-semibold text-white">{formatarQuantidade(distribuicao[pessoa.id])}</span>
                    <button disabled={isDistribuicaoPorValor} onClick={() => handleQuantidadeChange(pessoa.id, 1)} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50">+</button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-teal-500/10 text-teal-300 text-xs p-3 rounded-lg">
                <p>Selecione as pessoas para ratear o valor total do item igualmente entre elas.</p>
              </div>
              {pessoas.map(pessoa => (
                <label key={pessoa.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selecionados.includes(pessoa.id) ? 'bg-teal-500/20 border-teal-400' : 'bg-white/5 border-transparent'}`} htmlFor={`check-${pessoa.id}`}>
                  <span className="text-white font-medium">{pessoa.nome}</span>
                  <input id={`check-${pessoa.id}`} type="checkbox" checked={selecionados.includes(pessoa.id)} onChange={() => handleSelecionadoChange(pessoa.id)} className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500/50" />
                </label>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl text-gray-300 font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
            <X size={18} /> Cancelar
          </button>
          <button onClick={handleSubmit} disabled={modo === 'quantidade' && restante < -1e-9} className="px-6 py-2 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center gap-2">
            <Check size={18} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}