import React from 'react';
import { ShieldAlert, LogOut, Home } from 'lucide-react';

interface AccessDeniedProps {
    onSignOut: () => void;
    userEmail?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ onSignOut, userEmail }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl shadow-2xl overflow-hidden p-8 border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Acesso Negado
                </h1>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                    {userEmail ? (
                        <>Você está conectado como <span className="font-semibold text-gray-700 dark:text-gray-300">{userEmail}</span>, mas não tem permissão administrativa para acessar este painel.</>
                    ) : (
                        "Você não tem permissão administrativa suficiente para acessar este painel."
                    )}
                </p>

                <div className="w-full space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-semibold transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                        <Home className="w-5 h-5" />
                        Tentar Novamente
                    </button>

                    <button
                        onClick={onSignOut}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold transition-all active:scale-[0.98]"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair da Conta
                    </button>
                </div>

                <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
                    Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
                </p>
            </div>
        </div>
    );
};

export default AccessDenied;
