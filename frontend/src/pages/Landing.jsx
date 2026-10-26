import { ShieldCheck, UserCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-12 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center space-y-4">
           <div className="flex justify-center items-center gap-3">
             <div className="h-16 w-16 rounded-[20px] bg-primary flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/30 transform hover:scale-105 transition-transform duration-500">
               G
             </div>
             <h2 className="text-4xl font-black text-black tracking-tight">GestionPro</h2>
           </div>
           <p className="text-slate-500 font-medium">Veuillez choisir votre espace de connexion</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* CLIENT CARD */}
          <button 
            onClick={() => navigate('/user/login')}
            className="group text-left bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
              <UserCircle className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors duration-500">
                <UserCircle className="w-8 h-8 text-black group-hover:text-indigo-600 transition-colors duration-500" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Espace Client</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Consultez vos projets, suivez vos factures et interagissez avec notre équipe de manière sécurisée.
                </p>
              </div>

              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-wide group-hover:tracking-widest transition-all duration-500">
                <span className="uppercase">Se connecter</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
              </div>
            </div>
          </button>

          {/* ADMIN CARD */}
          <button 
            onClick={() => navigate('/admin/login')}
            className="group text-left bg-black p-8 rounded-[32px] border border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
              <ShieldCheck className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-500">
                <ShieldCheck className="w-8 h-8 text-white group-hover:text-primary transition-colors duration-500" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-2 text-white">Espace Admin</h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Gérez les projets, les factures, les clients et supervisez l'intégralité de vos opérations.
                </p>
              </div>

              <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide group-hover:tracking-widest transition-all duration-500">
                <span className="uppercase text-white group-hover:text-primary transition-colors">Se connecter</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500 text-white group-hover:text-primary" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
