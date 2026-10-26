import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.group('🔴 Application Crash Detail');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
              <div className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
                <div className="h-20 w-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} />
                </div>
                
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                  Oups! Quelque chose s'est mal passé.
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                  Une erreur inattendue est survenue. L'application a été interrompue pour protéger vos données.
                </p>

                {this.state.error && (
                  <div className="p-3 mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-left">
                    <p className="text-[11px] font-mono text-red-700 dark:text-red-300 break-words">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-3 w-full bg-slate-900 dark:bg-white dark:text-slate-950 text-white px-6 py-3 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                  >
                    <RefreshCw size={18} />
                    Actualiser la page
                  </button>
                  
                  <button
                    onClick={() => {
                        this.setState({ hasError: false });
                        window.location.href = '/';
                    }}
                    className="flex items-center justify-center gap-3 w-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <Home size={18} />
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">
              Système de Protection Critique v1.0
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
