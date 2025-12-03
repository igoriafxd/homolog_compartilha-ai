import { Edit, Trash2, Share2 } from 'lucide-react';

export default function ItemCard({ item, onDistributeClick, onEditClick, onDeleteClick }) {
  const totalAtribuido = Object.values(item.atribuido_a || {}).reduce((sum, qty) => sum + qty, 0);
  const restante = item.quantidade - totalAtribuido;
  const isCompleto = restante <= 1e-9; // Usa uma tolerância para comparação de floats

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEditClick(item);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteClick(item.id);
  };

  const cardClasses = `group p-4 rounded-xl transition-all duration-300 cursor-pointer ${
    isCompleto
      ? 'bg-green-500/10 border border-green-500/20 hover:border-green-400/50'
      : 'bg-white/5 border border-white/20 hover:border-teal-400 hover:shadow-md'
  }`;

  return (
    <div
      className={cardClasses}
      onClick={() => onDistributeClick(item)}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onDistributeClick(item); }}
    >
      <div className="flex justify-between items-start flex-nowrap gap-2">
        <div className="truncate">
          <p className="font-semibold text-white truncate">{item.nome}</p>
          <p className="text-sm text-gray-400">
            {item.quantidade} un. x R$ {item.valor_unitario.toFixed(2)}
          </p>
        </div>
        <p className="font-semibold text-lg text-white flex-shrink-0">
          R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
        </p>
      </div>
      <div className="mt-3 flex justify-between items-center">
        <div className="text-xs font-medium">
          {isCompleto ? (
            <span className="text-teal-400 font-medium bg-teal-500/20 px-2 py-1 rounded">Distribuído!</span>
          ) : (
            <span className="text-orange-400">Restante: {restante.toLocaleString('pt-BR')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleEditClick} title="Editar item" className="text-gray-400 hover:text-yellow-400 transition-colors">
            <Edit size={18} />
          </button>
          <button onClick={handleDeleteClick} title="Excluir item" className="text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
          <Share2 size={18} className="text-gray-500 transition-colors group-hover:text-teal-400" />
        </div>
      </div>
    </div>
  );
}