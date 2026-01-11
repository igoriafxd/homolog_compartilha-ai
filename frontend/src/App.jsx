import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api';
import LoginScreen from './components/LoginScreen';
import UploadScreen from './components/UploadScreen';
import PeopleScreen from './components/PeopleScreen';
import DistributionScreen from './components/DistributionScreen';
import SummaryScreen from './components/SummaryScreen';
import { LogOut, Sparkles } from 'lucide-react';

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

  // Continuar uma divisão em andamento (vindo do histórico)
  const handleContinueDivisao = (divisao) => {
    setDivisionData(divisao);
    setScreen('distribution');
  };
  
  const handlePeopleDefined = async (nomes, nomeDivisao = null) => {
    try {
      const response = await api.post('/api/criar-divisao', {
        itens: items,
        nomes_pessoas: nomes,
        nome: nomeDivisao,
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

  // --- HEADER COMPACTO PARA OUTRAS TELAS (não upload) ---
  const CompactHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <span className="text-lg font-bold text-white">
            Compartilha <span className="text-teal-400">AI</span>
          </span>
        </div>

        {/* User Info + Logout */}
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );

  // --- WRAPPER PARA TELAS COM HEADER COMPACTO ---
  const ScreenWithHeader = ({ children }) => (
    <>
      <CompactHeader />
      <div className="pt-16">
        {children}
      </div>
    </>
  );

  // --- LÓGICA DE RENDERIZAÇÃO ---
  
  // Upload Screen - TEM SEU PRÓPRIO HEADER
  if (screen === 'upload') {
    return (
      <UploadScreen 
        onScanComplete={handleScanComplete} 
        onManualStart={handleManualStart}
        onContinueDivisao={handleContinueDivisao}
      />
    );
  }

  // Summary Screen
  if (screen === 'summary') {
    return (
      <ScreenWithHeader>
        <SummaryScreen 
          totais={finalTotals} 
          divisionData={divisionData}
          onGoHome={handleReset}
        />
      </ScreenWithHeader>
    );
  }

  // Distribution Screen
  if (screen === 'distribution') {
    return (
      <ScreenWithHeader>
        <DistributionScreen
          divisionData={divisionData}
          onDivisionUpdate={handleDivisionUpdate}
          onGoBack={handleReset}
          onFinalize={handleFinalize}
        />
      </ScreenWithHeader>
    );
  }

  // People Screen
  if (screen === 'people') {
    return (
      <ScreenWithHeader>
        <PeopleScreen
          onBack={handleReset}
          onComplete={handlePeopleDefined}
        />
      </ScreenWithHeader>
    );
  }

  // Fallback
  return null;
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