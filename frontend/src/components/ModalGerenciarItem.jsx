import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function ModalGerenciarItem({ item, onConfirm, onCancel }) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState('');

  useEffect(() => {
    if (item) {
      setNome(item.nome);
      setQuantidade(item.quantidade);
      setValorUnitario(item.valor_unitario);
    } else {
      setNome('');
      setQuantidade(1);
      setValorUnitario('');
    }
  }, [item]);

  const handleSubmit = () => {
    if (!nome || !quantidade || !valorUnitario) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    const itemData = {
      nome,
      quantidade: parseInt(quantidade, 10),
      valor_unitario: parseFloat(valorUnitario),
    };
    onConfirm(itemData);
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {item ? 'Editar Item' : 'Adicionar Novo Item'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Item
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
              placeholder="Ex: Couvert Artístico"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="quantidade" className="block text-sm font-medium text-gray-300 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                id="quantidade"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                min="1"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="valor" className="block text-sm font-medium text-gray-300 mb-2">
                Valor Unitário (R$)
              </label>
              <input
                type="number"
                id="valor"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                placeholder="Ex: 15.00"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onCancel}
            className="flex-1 bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-all border border-white/20"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2"
          >
            <Check size={18} /> {item ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
