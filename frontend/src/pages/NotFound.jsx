import { useNavigate } from "react-router-dom";
import { Search, Home, ArrowLeft, Ghost } from "lucide-react";

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
            <div className="max-w-xl w-full text-center space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                {/* 404 Illustration */}
                <div className="relative inline-block group">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                    
                    {/* Main Graphic */}
                    <div className="relative">
                        <div className="flex items-center justify-center gap-1 mb-2">
                            <span className="text-[120px] font-black leading-none text-slate-800 dark:text-white tracking-tighter opacity-10">4</span>
                            <div className="h-24 w-24 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                <Ghost className="w-12 h-12 text-indigo-500 animate-bounce" />
                            </div>
                            <span className="text-[120px] font-black leading-none text-slate-800 dark:text-white tracking-tighter opacity-10">4</span>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        Page Introuvable
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                        Désolé, la page que vous recherchez semble avoir disparu dans le néant numérique ou n'a jamais existé.
                    </p>
                </div>

                {/* Search Bar (Simulated) */}
                <div className="max-w-md mx-auto relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        readOnly
                        value="Rechercher une autre page..."
                        className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 text-sm text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-not-allowed shadow-sm"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                        Retour
                    </button>
                    
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                        <Home size={20} />
                        Aller à l'accueil
                    </button>
                </div>

                {/* Status Footer */}
                <div className="flex items-center justify-center gap-8 pt-8">
                    <div className="text-center">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                        <div className="flex items-center gap-1.5 justify-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live</span>
                        </div>
                    </div>
                    <div className="text-center border-l border-slate-200 dark:border-slate-800 pl-8">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Système</div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">CORTEX 2.0</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
