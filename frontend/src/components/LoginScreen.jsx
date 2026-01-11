import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, ArrowLeft, LoaderCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

export default function LoginScreen() {
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      // Formato: 85 9 0000-0000
      if (value.length <= 2) {
        // Apenas DDD
      } else if (value.length <= 3) {
        value = `${value.slice(0, 2)} ${value.slice(2)}`;
      } else if (value.length <= 7) {
        value = `${value.slice(0, 2)} ${value.slice(2, 3)} ${value.slice(3)}`;
      } else {
        value = `${value.slice(0, 2)} ${value.slice(2, 3)} ${value.slice(3, 7)}-${value.slice(7, 11)}`;
      }
      
      setFormData({ ...formData, phone: value });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (mode === 'register') {
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
      if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
      if (formData.phone.replace(/\D/g, '').length !== 11) {
        newErrors.phone = 'Telefone inválido';
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (mode === 'login' || mode === 'register') {
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
      }
    }
    
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'As senhas não coincidem';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ general: 'Email ou senha incorretos' });
          } else if (error.message.includes('Email not confirmed')) {
            setErrors({ general: 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.' });
          } else {
            setErrors({ general: error.message });
          }
        }
        // Se não houver erro, o AuthContext vai atualizar e o App.jsx vai mudar de tela
        
      } else if (mode === 'register') {
        const { error } = await signUp(formData.email, formData.password, {
          nome: formData.name,
          telefone: formData.phone.replace(/\D/g, ''),
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ general: 'Este email já está cadastrado' });
          } else {
            setErrors({ general: error.message });
          }
        } else {
          setSuccessMessage('Conta criada! Verifique seu email para confirmar o cadastro.');
          setMode('login');
          resetForm();
        }
        
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(formData.email);
        if (error) {
          setErrors({ general: error.message });
        } else {
          setSuccessMessage('Link de recuperação enviado para seu email!');
          setMode('login');
          resetForm();
        }
      }
    } catch (error) {
      setErrors({ general: 'Ocorreu um erro. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrors({ general: 'Erro ao conectar com Google' });
      setIsLoading(false);
    }
    // Se der certo, o usuário será redirecionado para o Google
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
    setSuccessMessage('');
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Compartilha <span className="text-teal-400">AI</span>
            </h1>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
          </div>
          <p className="text-gray-300 text-base sm:text-lg">
            Simplifique a conta, aproveite o momento
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-teal-400/30 shadow-2xl shadow-teal-500/20">
          {/* Título do formulário */}
          <div className="mb-6">
            {mode !== 'login' && (
              <button
                onClick={() => switchMode('login')}
                className="flex items-center gap-2 text-gray-300 hover:text-teal-400 transition-colors mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Criar Conta'}
              {mode === 'forgot' && 'Recuperar Senha'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'login' && 'Acesse sua conta para continuar'}
              {mode === 'register' && 'Preencha seus dados para começar'}
              {mode === 'forgot' && 'Enviaremos um link para seu email'}
            </p>
          </div>

          {/* Mensagem de sucesso */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">
              {successMessage}
            </div>
          )}

          {/* Erro geral */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome - apenas no registro */}
            {mode === 'register' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
                    placeholder="Seu nome"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                {mode === 'forgot' ? 'Email para recuperação' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Telefone - apenas no registro */}
            {mode === 'register' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
                    placeholder="85 9 0000-0000"
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
            )}

            {/* Senha */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-11 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
            )}

            {/* Confirmar Senha - apenas no registro */}
            {mode === 'register' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-11 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Esqueci a senha - apenas no login */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-teal-400 text-sm hover:text-teal-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Criar Conta'}
                  {mode === 'forgot' && 'Enviar Link'}
                </>
              )}
            </button>
          </form>

          {/* Divisor OU - apenas login e registro */}
          {mode !== 'forgot' && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-white/20"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm font-semibold">OU</span>
                <div className="flex-grow border-t border-white/20"></div>
              </div>

              {/* Login com Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white/5 border-2 border-white/20 text-white font-semibold py-4 rounded-xl hover:bg-white/10 hover:border-white/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <GoogleIcon />
                Continuar com Google
              </button>
            </>
          )}

          {/* Link para trocar entre login/registro */}
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  Criar conta
                </button>
              </p>
            ) : mode === 'register' ? (
              <p className="text-gray-400 text-sm">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  Entrar
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}