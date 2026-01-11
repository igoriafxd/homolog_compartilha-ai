// PeopleScreen - Tela para adicionar participantes e nome da divisão
import { useState } from 'react';
import { Users, ArrowRight, UserPlus, Trash2, FileText, Sparkles } from 'lucide-react';

export default function PeopleScreen({ onBack, onComplete }) {
  const [nomeDivisao, setNomeDivisao] = useState('');
  const [peopleList, setPeopleList] = useState(['', '']);
  const [error, setError] = useState('');

  // Esquema de cores para os avatares
  const colorSchemes = [
    { name: 'teal', bg: 'bg-teal-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'pink', bg: 'bg-pink-500' },
    { name: 'sky', bg: 'bg-sky-500' },
    { name: 'amber', bg: 'bg-amber-500' },
    { name: 'emerald', bg: 'bg-emerald-500' },
    { name: 'rose', bg: 'bg-rose-500' },
    { name: 'indigo', bg: 'bg-indigo-500' },
    { name: 'orange', bg: 'bg-orange-500' },
    { name: 'cyan', bg: 'bg-cyan-500' },
  ];

  const handleAddPerson = () => {
    if (peopleList.length < 10) {
      setPeopleList([...peopleList, '']);
    }
  };

  const handleRemovePerson = (index) => {
    if (peopleList.length > 2) {
      setPeopleList(peopleList.filter((_, i) => i !== index));
    }
  };

  const handlePersonChange = (index, value) => {
    const newList = [...peopleList];
    newList[index] = value;
    setPeopleList(newList);
    if (error) setError('');
  };

  const handleContinue = () => {
    const finalPeople = peopleList
      .map(p => p.trim())
      .filter(p => p !== '');

    if (finalPeople.length < 2) {
      setError('Você precisa de pelo menos duas pessoas para dividir a conta.');
      return;
    }
    
    const uniqueNames = new Set(finalPeople.map(p => p.toLowerCase()));
    if (uniqueNames.size !== finalPeople.length) {
      setError('Por favor, use nomes diferentes para cada pessoa.');
      return;
    }

    setError('');
    
    // Passa o nome da divisão junto com as pessoas
    onComplete(finalPeople, nomeDivisao.trim() || null);
  };

  // Gera sugestões de nome baseado na data/hora
  const gerarSugestaoNome = () => {
    const agora = new Date();
    const hora = agora.getHours();
    let periodo = 'Refeição';
    
    if (hora >= 6 && hora < 11) periodo = 'Café da manhã';
    else if (hora >= 11 && hora < 14) periodo = 'Almoço';
    else if (hora >= 14 && hora < 18) periodo = 'Lanche';
    else if (hora >= 18 && hora < 22) periodo = 'Jantar';
    else periodo = 'Lanche noturno';
    
    const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${periodo} - ${data}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full mx-auto py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-teal-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Compartilha <span className="text-teal-400">AI</span>
            </h1>
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-gray-300 text-base sm:text-lg">
            Configure os participantes da divisão
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-400/30 shadow-2xl shadow-teal-500/20">
          
          {/* Seção: Nome da Divisão */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Nome da divisão
              <span className="text-gray-400 text-sm font-normal">(opcional)</span>
            </h2>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Jantar no Bella Vista"
                value={nomeDivisao}
                onChange={(e) => setNomeDivisao(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
              />
              
              {/* Botão de sugestão */}
              {!nomeDivisao && (
                <button
                  onClick={() => setNomeDivisao(gerarSugestaoNome())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs font-medium rounded-lg transition-all"
                >
                  Sugerir
                </button>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Um nome ajuda a identificar a divisão no histórico
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-6"></div>

          {/* Seção: Participantes */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              Quem vai dividir?
            </h2>

            <div className="space-y-3 mb-4">
              {peopleList.map((person, index) => {
                const color = colorSchemes[index % colorSchemes.length];
                return (
                  <div key={index} className="flex gap-3 group">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder={`Nome da pessoa ${index + 1}`}
                        value={person}
                        onChange={(e) => handlePersonChange(index, e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/20 rounded-xl px-4 py-3 pl-14 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                      />
                      <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {person.trim() ? person.trim()[0].toUpperCase() : index + 1}
                      </div>
                    </div>
                    
                    {/* Botão remover - só aparece se tiver mais de 2 pessoas */}
                    {peopleList.length > 2 && (
                      <button
                        onClick={() => handleRemovePerson(index)}
                        className="w-12 h-12 bg-white/5 hover:bg-red-500/20 border-2 border-white/20 hover:border-red-400/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all active:scale-95"
                        title="Remover pessoa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botão adicionar pessoa */}
            {peopleList.length < 10 && (
              <button
                onClick={handleAddPerson}
                className="w-full text-teal-400 font-semibold py-3 mb-2 hover:text-teal-300 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-teal-400/30 rounded-xl hover:border-teal-400 hover:bg-teal-400/5 active:scale-[0.98]"
              >
                <UserPlus className="w-5 h-5" />
                Adicionar pessoa ({peopleList.length}/10)
              </button>
            )}
            
            {peopleList.length >= 10 && (
              <p className="text-amber-400 text-sm text-center mb-2">
                Limite máximo de 10 pessoas atingido
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onBack}
              className="flex-1 bg-white/5 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-all border-2 border-white/20 hover:border-white/40 active:scale-[0.98]"
            >
              Voltar
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Confirmar e Iniciar
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Info */}
          <p className="text-gray-400 text-xs text-center mt-4">
            Você poderá adicionar ou remover pessoas depois
          </p>
        </div>
      </div>
    </div>
  );
}