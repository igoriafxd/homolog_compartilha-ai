import { useState } from 'react';
import { Share2, Edit3, RotateCw, X, Check } from 'lucide-react';

function ShareModal({ onShare, onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Escolha o formato</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onShare('resumo')}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50"
          >
            Compartilhar Resumo
          </button>
          <button
            onClick={() => onShare('detalhado')}
            className="w-full px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            Compartilhar Detalhado
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SummaryScreen({ totais, divisionData, onReset, onGoBack }) {
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const rankedPessoas = [...totais.pessoas].sort((a, b) => b.total - a.total);
  const totalDaConta = totais.pessoas.reduce((sum, p) => sum + p.total, 0);

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
    let text = `=== RESUMO DA CONTA ===\n\n`;
    text += rankedPessoas.map(pessoa => {
      const nome = pessoa.nome;
      const valor = `R$ ${pessoa.total.toFixed(2)}`;
      const padding = '.'.repeat(Math.max(0, 20 - nome.length));
      return `> ${nome} ${padding} ${valor}`;
    }).join('\n');
    text += `\n\n>>> TOTAL: R$ ${totalDaConta.toFixed(2)} <<<`;
    text += `\n\n--- Dividido com Compartilha AI ---`;
    return text;
  };

  const createDetailedShareText = () => {
    if (!divisionData || !divisionData.pessoas || !divisionData.itens) {
      alert("Não foi possível gerar o relatório detalhado pois os dados da divisão estão incompletos.");
      return "Erro: Dados detalhados não disponíveis.";
    }

    let text = `=== DETALHES DA CONTA ===\n\n`;
    const divider = '-'.repeat(25);

    divisionData.pessoas.forEach(pessoa => {
      text += `👤 *${pessoa.nome.toUpperCase()}*\n`;
      
      let itensDaPessoa = 0;
      divisionData.itens.forEach(item => {
        if (item.atribuido_a && item.atribuido_a[pessoa.id]) {
          itensDaPessoa++;
          const quantidadeConsumida = item.atribuido_a[pessoa.id];
          const valorPago = quantidadeConsumida * item.valor_unitario;

          const itemName = `(${toFraction(quantidadeConsumida)}) ${item.nome}`;
          const itemValue = `R$ ${valorPago.toFixed(2)}`;
          const padding = '.'.repeat(Math.max(0, 25 - itemName.length - itemValue.length));
          text += `  • ${itemName} ${padding} ${itemValue}\n`;
        }
      });

      if (itensDaPessoa === 0) {
        text += `  (Nenhum item individual registrado)\n`;
      }

      const pessoaTotal = totais.pessoas.find(p => p.nome === pessoa.nome);
      if (pessoaTotal) {
        const totalPessoaStr = `R$ ${pessoaTotal.total.toFixed(2)}`;
        text += `  *Total ${pessoa.nome}: ${totalPessoaStr}*\n\n`;
      }
    });

    text += `${divider}\n`;
    text += `>>> TOTAL GERAL: R$ ${totalDaConta.toFixed(2)} <<<\n`;
    text += `${divider}\n\n`;
    text += `--- Dividido com Compartilha AI ---`;
    return text;
  };

  const handleShare = (type) => {
    setShareModalOpen(false);
    const shareText = createShareText(type);
    
    const isMobile = /Mobi/i.test(window.navigator.userAgent);

    if (isMobile && navigator.share) {
      navigator.share({
        title: 'Resumo da Conta',
        text: shareText,
      }).catch(console.error);
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const colorSchemes = [
    { name: 'teal', bg: 'bg-teal-500', border: 'border-teal-500/30', text: 'text-teal-400', hover: 'hover:bg-teal-500/20' },
    { name: 'purple', bg: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'hover:bg-purple-500/20' },
    { name: 'pink', bg: 'bg-pink-500', border: 'border-pink-500/30', text: 'text-pink-400', hover: 'hover:bg-pink-500/20' },
    { name: 'sky', bg: 'bg-sky-500', border: 'border-sky-500/30', text: 'text-sky-400', hover: 'hover:bg-sky-500/20' },
    { name: 'amber', bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:bg-amber-500/20' },
    { name: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
  ];

  return (
    <>
      {isShareModalOpen && <ShareModal onShare={handleShare} onClose={() => setShareModalOpen(false)} />}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full">
          <header className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/40">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Conta Finalizada!</h1>
            <p className="text-gray-300 text-lg">Confira o resumo abaixo. Agora é só acertar as contas.</p>
          </header>

          <main className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl mb-6">
            <div className="text-center mb-6 pb-6 border-b border-white/20">
              <p className="text-gray-400 mb-2">Valor Total da Conta</p>
              <p className="text-5xl font-bold text-teal-400">R$ {totalDaConta.toFixed(2)}</p>
            </div>

            <div className="space-y-4 mb-6">
              {rankedPessoas.map((pessoa, index) => {
                const colorScheme = colorSchemes[index % colorSchemes.length];
                const bgColor = colorScheme.name === 'teal' ? 'from-teal-900/20 to-teal-800/10' 
                              : colorScheme.name === 'purple' ? 'from-purple-900/20 to-purple-800/10'
                              : colorScheme.name === 'pink' ? 'from-pink-900/20 to-pink-800/10'
                              : colorScheme.name === 'sky' ? 'from-sky-900/20 to-sky-800/10'
                              : colorScheme.name === 'amber' ? 'from-amber-900/20 to-amber-800/10'
                              : 'from-emerald-900/20 to-emerald-800/10';
                return (
                  <div key={index} className={`bg-gradient-to-br ${bgColor} backdrop-blur rounded-xl border ${colorScheme.border} p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${colorScheme.bg} flex items-center justify-center text-white font-bold text-xl`}>
                        {pessoa.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-lg">{pessoa.nome}</span>
                    </div>
                    <span className={`font-bold text-xl ${colorScheme.text}`}>R$ {pessoa.total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShareModalOpen(true)}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
              <button 
                onClick={onGoBack}
                className="flex-1 bg-white/5 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-all border border-white/20 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-5 h-5" />
                Voltar e Editar
              </button>
            </div>
          </main>

          <footer className="text-center">
            <button 
              onClick={onReset}
              className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCw size={16} /> Iniciar Nova Divisão
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}