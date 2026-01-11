import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';
import LoginScreen from './components/LoginScreen';
import UploadScreen from './components/UploadScreen';
import PeopleScreen from './components/PeopleScreen';
import DistributionScreen from './components/DistributionScreen';
import SummaryScreen from './components/SummaryScreen';
import { LogOut } from 'lucide-react';

// Componente interno que usa o contexto de autenticação
function AppContent() {
  const { user, profile, isAuthenticated, loading, signOut } = useAuth();
  
  // --- ESTADOS GLOBAIS DA APLICAÇÃO ---
  const [screen, setScreen] = useState('upload');
  const [items, setItems] = useState([]);
  const [divisionData, setDivisionData] = useState(null);
  const [finalTotals, setFinalTotals] = useState(null);

  // --- FUNÇÕES DE CONTROLE DE FLUXO ---
  const handleScanComplete = (scannedItems) => {
    setItems(scannedItems);
    setScreen('people');
  };

  const handleManualStart = () => {
    setItems([]);
    setScreen('people');
  };
  
  const handlePeopleDefined = async (nomes) => {
    try {
      const response = await api.post('/api/criar-divisao', {
        itens: items,
        nomes_pessoas: nomes,
      });
      setDivisionData(response.data);
      setScreen('distribution');
    } catch (error) {
      console.error("Erro ao criar divisão:", error);
      alert("Não foi possível criar a divisão. Verifique se o backend está rodando.");
      handleReset();
    }
  };

  const handleFinalize = (totais) => {
    setFinalTotals(totais);
    setScreen('summary');
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
    setScreen('upload');
  };

  const handleLogout = async () => {
    await signOut();
    handleReset();
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  // --- SE NÃO ESTÁ LOGADO, MOSTRA TELA DE LOGIN ---
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // --- HEADER COM USUÁRIO LOGADO ---
  const UserHeader = () => (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
          {profile?.nome?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-white text-sm font-medium hidden sm:block max-w-[120px] truncate">
          {profile?.nome || user?.email?.split('@')[0] || 'Usuário'}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-red-400"
        title="Sair"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  // --- LÓGICA DE RENDERIZAÇÃO ---
  if (screen === 'summary') {
    return (
      <>
        <UserHeader />
        <SummaryScreen 
          totais={finalTotals} 
          divisionData={divisionData}
          onReset={handleReset} 
          onGoBack={handleGoBackToDistribution} 
        />
      </>
    );
  }

  if (screen === 'distribution') {
    return (
      <>
        <UserHeader />
        <DistributionScreen
          divisionData={divisionData}
          onDivisionUpdate={handleDivisionUpdate}
          onGoBack={handleReset}
          onFinalize={handleFinalize}
        />
      </>
    );
  }

  if (screen === 'people') {
    return (
      <>
        <UserHeader />
        <PeopleScreen
          onBack={handleReset}
          onComplete={handlePeopleDefined}
        />
      </>
    );
  }

  // Tela padrão é 'upload'
  return (
    <>
      <UserHeader />
      <UploadScreen onScanComplete={handleScanComplete} onManualStart={handleManualStart} />
    </>
  );
}

// Componente principal que envolve tudo com o AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;