import { useState } from 'react';
import api from './services/api';
import UploadScreen from './components/UploadScreen';
import PeopleScreen from './components/PeopleScreen'; // Importa a nova tela
import DistributionScreen from './components/DistributionScreen';
import SummaryScreen from './components/SummaryScreen';

function App() {
  // --- ESTADOS GLOBAIS DA APLICAÇÃO ---
  const [screen, setScreen] = useState('upload'); // Controla a tela atual
  const [items, setItems] = useState([]);
  const [divisionData, setDivisionData] = useState(null);
  const [finalTotals, setFinalTotals] = useState(null);

  // --- FUNÇÕES DE CONTROLE DE FLUXO ---

  const handleScanComplete = (scannedItems) => {
    setItems(scannedItems);
    setScreen('people'); // Muda para a tela de pessoas
  };

  const handleManualStart = () => {
    setItems([]); // Inicia com uma lista de itens vazia
    setScreen('people'); // Muda para a tela de pessoas
  };
  
  const handlePeopleDefined = async (nomes) => {
    try {
      const response = await api.post('/api/criar-divisao', {
        itens: items,
        nomes_pessoas: nomes,
      });
      setDivisionData(response.data);
      setScreen('distribution'); // Muda para a tela de distribuição
    } catch (error) {
      console.error("Erro ao criar divisão:", error);
      alert("Não foi possível criar a divisão. Verifique se o backend está rodando.");
      handleReset();
    }
  };

  const handleFinalize = (totais) => {
    setFinalTotals(totais);
    setScreen('summary'); // Muda para a tela de resumo
  };

  const handleDivisionUpdate = (updatedDivisionData) => {
    setDivisionData(updatedDivisionData);
  };

  const handleGoBackToDistribution = () => {
    setFinalTotals(null);
    setScreen('distribution');
  };

  const handleReset = () => {
    setItems([]);
    setDivisionData(null);
    setFinalTotals(null);
    setScreen('upload'); // Volta para a tela inicial
  };


  // --- LÓGICA DE RENDERIZAÇÃO ---

  if (screen === 'summary') {
    return <SummaryScreen 
              totais={finalTotals} 
              divisionData={divisionData}
              onReset={handleReset} 
              onGoBack={handleGoBackToDistribution} 
            />;
  }

  if (screen === 'distribution') {
    return (
      <DistributionScreen
        divisionData={divisionData}
        onDivisionUpdate={handleDivisionUpdate}
        onGoBack={handleReset} // Poderia voltar para a tela de pessoas, mas resetar é mais simples
        onFinalize={handleFinalize}
      />
    );
  }

  if (screen === 'people') {
    return (
      <PeopleScreen
        onBack={handleReset}
        onComplete={handlePeopleDefined}
      />
    );
  }

  // A tela padrão é 'upload'
  return <UploadScreen onScanComplete={handleScanComplete} onManualStart={handleManualStart} />;
}

export default App;
