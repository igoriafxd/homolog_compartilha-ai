import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// Função auxiliar para converter decimais em frações comuns
function toFraction(decimal, tolerance = 0.01) {
  if (Math.abs(decimal - Math.round(decimal)) < tolerance) {
    return Math.round(decimal).toString();
  }
  const fractions = [
    { dec: 1/2, str: '½' }, { dec: 1/3, str: '⅓' }, { dec: 2/3, str: '⅔' },
    { dec: 1/4, str: '¼' }, { dec: 3/4, str: '¾' }, { dec: 1/5, str: '⅕' },
    { dec: 2/5, str: '⅖' }, { dec: 3/5, str: '⅗' }, { dec: 4/5, str: '⅘' },
    { dec: 1/6, str: '⅙' }, { dec: 5/6, str: '⅚' }, { dec: 1/8, str: '⅛' },
    { dec: 3/8, str: '⅜' }, { dec: 5/8, str: '⅝' }, { dec: 7/8, str: '⅞' },
  ];
  for (const f of fractions) {
    if (Math.abs(decimal - f.dec) < tolerance) {
      return f.str;
    }
  }
  return decimal.toFixed(2);
}

export default function PersonCard({ 
  pessoa, 
  totais, 
  onDeleteClick, 
  colorScheme, 
  isExpanded, 
  onToggleExpand 
}) {
  const detalhesPessoa = totais?.pessoas.find(p => p.nome === pessoa.nome);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteClick(pessoa.id);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    onToggleExpand();
  }

  const bgColor = colorScheme.name === 'teal' ? 'from-teal-900/20 to-teal-800/10' 
                : colorScheme.name === 'purple' ? 'from-purple-900/20 to-purple-800/10'
                : colorScheme.name === 'pink' ? 'from-pink-900/20 to-pink-800/10'
                : colorScheme.name === 'sky' ? 'from-sky-900/20 to-sky-800/10'
                : colorScheme.name === 'amber' ? 'from-amber-900/20 to-amber-800/10'
                : 'from-emerald-900/20 to-emerald-800/10';

  return (
    <div className={`bg-gradient-to-br ${bgColor} backdrop-blur rounded-xl border ${colorScheme.border} overflow-hidden transition-all duration-300`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${colorScheme.bg} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
              {pessoa.nome[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{pessoa.nome}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandClick}
              className={`p-2 ${colorScheme.hover} rounded-lg transition ${colorScheme.text}`}
              title={isExpanded ? "Recolher itens" : "Expandir itens"}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 hover:bg-red-500/20 rounded-lg transition text-gray-400 hover:text-red-400"
              title="Remover pessoa"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-gray-300">R$ {detalhesPessoa?.subtotal.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Taxa</span>
            <span className="text-gray-300">+ R$ {detalhesPessoa?.taxa.toFixed(2) || '0.00'}</span>
          </div>
           {detalhesPessoa?.desconto > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Desconto</span>
              <span>- R$ {detalhesPessoa?.desconto.toFixed(2)}</span>
            </div>
          )}
          <div className={`flex justify-between font-semibold text-lg pt-2 border-t ${colorScheme.border}`}>
            <span className="text-white">TOTAL</span>
            <span className={colorScheme.text}>R$ {detalhesPessoa?.total.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`border-t ${colorScheme.border} bg-slate-900/30 p-4`}>
          <p className="text-gray-400 text-sm font-medium mb-3">Itens atribuídos:</p>
          <div className="space-y-2">
            {detalhesPessoa?.itens && detalhesPessoa.itens.length > 0 ? (
              detalhesPessoa.itens.map((item, index) => (
                <div key={index} className="flex justify-between text-sm flex-nowrap gap-2">
                  <span className="text-gray-300 truncate">({toFraction(item.quantidade)}) {item.nome}</span>
                  <span className="text-gray-300 flex-shrink-0">R$ {item.valor.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center text-sm py-2">Nenhum item distribuído.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
