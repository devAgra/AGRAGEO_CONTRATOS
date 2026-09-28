import { useState } from 'react';
import { useAuth } from '../AuthContext';
import Logo from '../components/Logo';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle, TreePine } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        if (email !== 'agrageoconsultoria@gmail.com') {
          setError('E-mail não encontrado. Verifique ou recupere sua conta.');
        } else {
          setError('Senha incorreta. Tente novamente ou recupere sua senha.');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryEmail === 'agrageoconsultoria@gmail.com') {
      setRecoverySent(true);
    } else {
      setError('E-mail não encontrado em nosso sistema.');
    }
  };

  if (showRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D3B13 0%, #1B5E20 50%, #2E7D32 100%)' }}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-green-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => { setShowRecovery(false); setError(''); setRecoverySent(false); }}
              className="flex items-center gap-2 text-gray-500 hover:text-green-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </button>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size="md" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recuperar Acesso</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Informe seu e-mail cadastrado para receber as instruções de recuperação
              </p>
            </div>

            {!recoverySent ? (
              <form onSubmit={handleRecovery} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                      placeholder="seu@email.com"
                      value={recoveryEmail}
                      onChange={e => { setRecoveryEmail(e.target.value); setError(''); }}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-medium text-white transition-all shadow-sm hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
                >
                  Enviar instruções de recuperação
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">E-mail enviado!</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Enviamos as instruções de recuperação para <strong>{recoveryEmail}</strong>. 
                  Verifique sua caixa de entrada e spam.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">Credenciais de demonstração:</p>
                  <p className="text-xs">E-mail: agrageoconsultoria@gmail.com</p>
                  <p className="text-xs">Senha: Alex36861976#</p>
                </div>
                <button
                  onClick={() => { setShowRecovery(false); setRecoverySent(false); setError(''); }}
                  className="mt-4 text-green-700 hover:underline text-sm font-medium"
                >
                  Voltar ao login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D3B13 0%, #1B5E20 50%, #2E7D32 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-green-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <p className="text-gray-500 text-sm">Sistema de Gestão de Contratos e Propostas</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot password link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowRecovery(true); setError(''); }}
                className="text-sm text-green-700 hover:text-green-800 hover:underline font-medium transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-medium text-white transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800 font-medium text-center mb-1">
                🔐 Acesso autorizado
              </p>
              <p className="text-xs text-green-700 text-center">
                Utilize as credenciais fornecidas pela administração
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-green-100/80 text-xs">
            © 2024 AGRAGEO CONSULTORIA. Todos os direitos reservados.
          </p>
          <p className="text-green-100/60 text-xs mt-1 flex items-center justify-center gap-1">
            <TreePine className="w-3 h-3" />
            Soluções em Consultoria Ambiental e Geotécnica
          </p>
        </div>
      </div>
    </div>
  );
}
