import { useState } from 'react';
import { Users, ArrowRight, UserPlus, Trash2 } from 'lucide-react';

export default function PeopleScreen({ onBack, onComplete }) {
  const [peopleList, setPeopleList] = useState(['', '']);
  const [error, setError] = useState('');

  // Esquema de cores idêntico ao da DistributionScreen para consistência
  const colorSchemes = [
    { name: 'teal', bg: 'bg-teal-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'pink', bg: 'bg-pink-500' },
    { name: 'sky', bg: 'bg-sky-500' },
    { name: 'amber', bg: 'bg-amber-500' },
    { name: 'emerald', bg: 'bg-emerald-500' },
  ];

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
    onComplete(finalPeople);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Compartilha <span className="text-teal-400">AI</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">
            Divida contas de forma inteligente.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-400/30 shadow-2xl shadow-teal-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-400" />
            Quem vai dividir a conta?
          </h2>

          <div className="space-y-3 mb-6">
            {peopleList.map((person, index) => {
              const color = colorSchemes[index % colorSchemes.length];
              return (
                <div key={index} className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Pessoa ${index + 1}`}
                      value={person}
                      onChange={(e) => {
                        const newList = [...peopleList];
                        newList[index] = e.target.value;
                        setPeopleList(newList);
                        if (error) setError('');
                      }}
                      className="w-full bg-white/5 border-2 border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                    />
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white font-bold text-sm`}>
                      {person ? person.trim()[0]?.toUpperCase() : index + 1}
                    </div>
                  </div>
                  {peopleList.length > 2 && (
                    <button
                      onClick={() => setPeopleList(peopleList.filter((_, i) => i !== index))}
                      className="w-12 h-12 bg-white/5 hover:bg-red-500/20 border border-white/20 hover:border-red-400/30 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all active:scale-95"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {peopleList.length < 10 && (
            <button
              onClick={() => setPeopleList([...peopleList, ''])}
              className="w-full text-teal-400 font-semibold py-3 mb-6 hover:text-teal-300 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-teal-400/30 rounded-xl hover:border-teal-400 hover:bg-teal-400/5 active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              Adicionar outra pessoa
            </button>
          )}
          
          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBack}
              className="flex-1 bg-white/5 text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-all border-2 border-white/20 hover:border-white/40 active:scale-95"
            >
              Voltar
            </button>
            <button
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/60 flex items-center justify-center gap-2 group active:scale-95"
              onClick={handleContinue}
            >
              Confirmar e Iniciar
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
