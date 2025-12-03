import { AlertTriangle, Check, X } from 'lucide-react';

export default function ModalConfirmacao({ mensagem, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-amber-500/50 relative">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-amber-500/20 mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Confirmar Ação</h2>
          <p className="text-gray-300 mb-6">{mensagem}</p>
        </div>

        <div className="flex justify-center space-x-4 mt-4">
          <button 
            onClick={onCancel} 
            className="px-6 py-2 rounded-xl text-gray-300 font-semibold bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <X size={18} /> Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all flex items-center gap-2"
          >
            <Check size={18} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
