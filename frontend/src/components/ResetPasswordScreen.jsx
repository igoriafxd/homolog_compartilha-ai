import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Sparkles, Lock, Eye, EyeOff, CheckCircle, AlertCircle, LoaderCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordScreen({ onBackToLogin }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Verifica se há erro no link (expirado, inválido, etc)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');

      if (errorCode === 'otp_expired') {
        setLinkError('O link expirou. Por favor, solicite um novo link de redefinição de senha.');
      } else if (errorDescription) {
        setLinkError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
      } else {
        setLinkError('Link inválido. Por favor, solicite um novo link de redefinição de senha.');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);

      // Redireciona para login após 3 segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-4 rounded-2xl shadow-lg shadow-teal-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Compartilha <span className="text-teal-400">AI</span>
          </h1>
          <p className="text-gray-400">Redefinir senha</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-400/30 shadow-2xl shadow-teal-500/20">

          {/* Erro no link */}
          {linkError ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Link Inválido</h2>
              <p className="text-gray-400 mb-6">{linkError}</p>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar para Login
              </button>
            </div>
          ) : success ? (
            /* Sucesso */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Senha Redefinida!</h2>
              <p className="text-gray-400 mb-4">Sua senha foi alterada com sucesso.</p>
              <p className="text-teal-400 text-sm">Redirecionando para o login...</p>
            </div>
          ) : (
            /* Formulário */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-teal-500/20">
                  <Lock className="w-7 h-7 text-teal-400" />
                </div>
                <p className="text-gray-400 text-sm">Digite sua nova senha</p>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente"
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Botão Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </button>

              {/* Voltar */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
