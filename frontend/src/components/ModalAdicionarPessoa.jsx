import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

export default function ModalAdicionarPessoa({ onConfirm, onCancel }) {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome não pode estar em branco.');
      return;
    }
    onConfirm({ nome });
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-white mb-6">
            Adicionar Nova Pessoa
          </h2>
          
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Pessoa
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setError('');
              }}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
              placeholder="Ex: João"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-all border border-white/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2"
            >
              <UserPlus size={18} /> Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
