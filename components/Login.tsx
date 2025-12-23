import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: () => void;
    initialError?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, initialError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);

    // Update error if initialError changes
    React.useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.session) {
                // Fetch user profile to check role
                const { data: profile, error: profileError } = await supabase
                    .from('perfil_de_usuario')
                    .select('cargo')
                    .eq('id', data.session.user.id)
                    .single();

                const allowedRoles = ['ADM', 'Sócios', 'Gestores'];
                if (profileError || !profile || !allowedRoles.includes(profile.cargo)) {
                    await supabase.auth.signOut();
                    throw new Error('Você não tem permissão administrativa suficiente');
                }

                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark p-4 font-sans transition-colors duration-200">
            <div className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl shadow-2xl overflow-hidden p-8 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                {/* Logo Topstack */}
                <div className="mb-8">
                    <img
                        src="/assets/visual-identity/topstack-logo-3x1.png"
                        alt="Topstack Logo"
                        className="h-10 object-contain dark:invert dark:brightness-200"
                    />
                </div>

                <div className="text-center w-full mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Bem-vindo de volta
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Entre na sua conta para continuar
                    </p>

                    {/* Sun Motors Branding - as per image */}
                    <div className="mb-4">
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600 drop-shadow-lg tracking-tight"
                            style={{
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                WebkitTextStroke: '1px rgba(255,255,255,0.1)'
                            }}>
                            Sun Motors
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="Seu e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Entrar <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center space-y-3">
                    <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline transition-all"
                    >
                        Esqueci minha senha
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 pt-4">
                        &copy; 2025 TOPSTACK Analytics. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
