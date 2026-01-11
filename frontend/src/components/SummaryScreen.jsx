import { useState } from 'react';
import { Share2, Home, X, Check, Receipt, Users } from 'lucide-react';

function ShareModal({ onShare, onClose, isSharing }) {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Compartilhar</h3>
          <button onClick={onClose} disabled={isSharing} className="text-gray-400 hover:text-white disabled:opacity-50">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-6">Escolha o formato do resumo</p>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onShare('resumo')}
            disabled={isSharing}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 disabled:opacity-50"
          >
            📝 Resumo Simples
          </button>
          <button
            onClick={() => onShare('detalhado')}
            disabled={isSharing}
            className="w-full px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50"
          >
            📋 Resumo Detalhado
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SummaryScreen({ totais, divisionData, onGoHome }) {
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const rankedPessoas = [...totais.pessoas].sort((a, b) => b.total - a.total);
  const totalDaConta = totais.pessoas.reduce((sum, p) => sum + p.total, 0);
  const subtotalGeral = totais.pessoas.reduce((sum, p) => sum + p.subtotal, 0);
  const taxaTotal = totais.pessoas.reduce((sum, p) => sum + p.taxa, 0);
  const descontoTotal = totais.pessoas.reduce((sum, p) => sum + p.desconto, 0);

  // Nome da divisão
  const nomeDivisao = divisionData?.nome || 'Divisão finalizada';
  
  // Data formatada
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  function toFraction(decimal, tolerance = 0.01) {
    if (Math.abs(decimal - Math.round(decimal)) < tolerance) {
      return Math.round(decimal).toString();
    }
    const fractions = [
      { dec: 1/2, str: '½' }, { dec: 1/3, str: '⅓' }, { dec: 2/3, str: '⅔' },
      { dec: 1/4, str: '¼' }, { dec: 3/4, str: '¾' }, { dec: 1/5, str: '⅕' },
      { dec: 2/5, str: '⅖' }, { dec: 3/5, str: '⅗' }, { dec: 4/5, str: '⅘' },
    ];
    for (const f of fractions) {
      if (Math.abs(decimal - f.dec) < tolerance) {
        return f.str;
      }
    }
    return decimal.toFixed(2);
  }

  const createShareText = (type = 'resumo') => {
    if (type === 'detalhado') {
      return createDetailedShareText();
    }
    return createSimpleShareText();
  };

  const createSimpleShareText = () => {
    let text = `*${nomeDivisao}*\n\n`;
    text += rankedPessoas.map(pessoa => {
      return `> ${pessoa.nome}: R$ ${pessoa.total.toFixed(2)}`;
    }).join('\n');
    text += `\n\n*Total: R$ ${totalDaConta.toFixed(2)}*`;
    text += `\n\n_Dividido com Compartilha AI_`;
    return text;
  };

  const createDetailedShareText = () => {
    if (!divisionData || !divisionData.pessoas || !divisionData.itens) {
      return createSimpleShareText();
    }

    let text = `*${nomeDivisao}*\n`;
    text += `--------------------\n\n`;

    divisionData.pessoas.forEach(pessoa => {
      text += `*${pessoa.nome.toUpperCase()}*\n`;
      
      let itensDaPessoa = 0;
      divisionData.itens.forEach(item => {
        if (item.atribuido_a && item.atribuido_a[pessoa.id]) {
          itensDaPessoa++;
          const quantidadeConsumida = item.atribuido_a[pessoa.id];
          const valorPago = quantidadeConsumida * item.valor_unitario;
          text += `  - (${toFraction(quantidadeConsumida)}) ${item.nome}: R$ ${valorPago.toFixed(2)}\n`;
        }
      });

      if (itensDaPessoa === 0) {
        text += `  (Nenhum item)\n`;
      }

      const pessoaTotal = totais.pessoas.find(p => p.nome === pessoa.nome);
      if (pessoaTotal) {
        text += `  *Total: R$ ${pessoaTotal.total.toFixed(2)}*\n\n`;
      }
    });

    text += `--------------------\n`;
    text += `*TOTAL GERAL: R$ ${totalDaConta.toFixed(2)}*\n\n`;
    text += `_Dividido com Compartilha AI_`;
    return text;
  };

  const handleShare = async (type) => {
    setIsSharing(true);
    
    try {
      const shareText = createShareText(type);
      const isMobile = /Mobi/i.test(window.navigator.userAgent);

      if (isMobile && navigator.share) {
        await navigator.share({
          title: nomeDivisao,
          text: shareText,
        });
      } else {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
      }
    } finally {
      setIsSharing(false);
      setShareModalOpen(false);
    }
  };

  const colorSchemes = [
    { name: 'teal', bg: 'bg-teal-500', border: 'border-teal-500/30', text: 'text-teal-400' },
    { name: 'purple', bg: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400' },
    { name: 'pink', bg: 'bg-pink-500', border: 'border-pink-500/30', text: 'text-pink-400' },
    { name: 'sky', bg: 'bg-sky-500', border: 'border-sky-500/30', text: 'text-sky-400' },
    { name: 'amber', bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400' },
    { name: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  ];

  const getBgGradient = (colorName) => {
    const gradients = {
      teal: 'from-teal-900/20 to-teal-800/10',
      purple: 'from-purple-900/20 to-purple-800/10',
      pink: 'from-pink-900/20 to-pink-800/10',
      sky: 'from-sky-900/20 to-sky-800/10',
      amber: 'from-amber-900/20 to-amber-800/10',
      emerald: 'from-emerald-900/20 to-emerald-800/10',
    };
    return gradients[colorName] || gradients.teal;
  };

  return (
    <>
      {isShareModalOpen && (
        <ShareModal 
          onShare={handleShare} 
          onClose={() => setShareModalOpen(false)} 
          isSharing={isSharing}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/40">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Conta Finalizada!</h1>
            <p className="text-teal-300 font-medium text-lg">{nomeDivisao}</p>
          </header>

          {/* Card Principal */}
          <main className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl mb-6">
            {/* Total */}
            <div className="text-center mb-6 pb-6 border-b border-white/20">
              <p className="text-gray-400 mb-2 flex items-center justify-center gap-2">
                <Receipt className="w-4 h-4" />
                Valor Total da Conta
              </p>
              <p className="text-5xl font-bold text-teal-400">
                R$ {totalDaConta.toFixed(2)}
              </p>
              
              {/* Detalhes do valor */}
              {(taxaTotal > 0 || descontoTotal > 0) && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span>R$ {subtotalGeral.toFixed(2)}</span>
                  </div>
                  {descontoTotal > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Desconto:</span>
                      <span>- R$ {descontoTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {taxaTotal > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Taxa de serviço:</span>
                      <span>+ R$ {taxaTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de Pessoas */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {rankedPessoas.length} {rankedPessoas.length === 1 ? 'pessoa' : 'pessoas'}
              </p>
              <div className="space-y-3">
                {rankedPessoas.map((pessoa, index) => {
                  const colorScheme = colorSchemes[index % colorSchemes.length];
                  return (
                    <div 
                      key={pessoa.nome} 
                      className={`bg-gradient-to-br ${getBgGradient(colorScheme.name)} backdrop-blur rounded-xl border ${colorScheme.border} p-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full ${colorScheme.bg} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                          {pessoa.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-white font-semibold">{pessoa.nome}</span>
                          {pessoa.itens && pessoa.itens.length > 0 && (
                            <p className="text-gray-400 text-xs">
                              {pessoa.itens.length} {pessoa.itens.length === 1 ? 'item' : 'itens'}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold text-xl ${colorScheme.text}`}>
                        R$ {pessoa.total.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShareModalOpen(true)}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
              <button 
                onClick={onGoHome}
                className="flex-1 bg-white/5 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-all border border-white/20 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Início
              </button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}