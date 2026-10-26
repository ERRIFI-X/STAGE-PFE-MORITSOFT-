import { NavLink, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Receipt, 
  CreditCard, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Activity
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "./BrandLogo";

export default function Sidebar({ isOpen, onClose, onOpenNewProject }) {
  const { isAdmin, isClient } = useAuth();

  const adminNavGroups = [
    {
      title: "Pilotage & Activité",
      items: [
        { name: "Tableau de bord", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Projets & Livrables", path: "/admin/projects", icon: FolderKanban },
        { name: "Répertoire Clients", path: "/admin/clients", icon: Users },
      ]
    },
    {
      title: "Gestion Financière MAD",
      items: [
        { name: "Factures & Devis", path: "/admin/invoices", icon: Receipt },
        { name: "Encaissements", path: "/admin/payments", icon: CreditCard },
      ]
    }
  ];

  const clientNavGroups = [
    {
      title: "Espace Client Sécurisé",
      items: [
        { name: "Vue d'ensemble", path: "/user/dashboard", icon: LayoutDashboard },
        { name: "Mes Projets en Cours", path: "/user/projects", icon: FolderKanban },
        { name: "Mes Factures & Règlements", path: "/user/invoices", icon: Receipt },
      ]
    }
  ];

  const navGroups = isAdmin ? adminNavGroups : clientNavGroups;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand & System Status */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <BrandLogo size="md" />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Quick Action Button for Admin */}
        {isAdmin && (
          <div className="p-4 pb-2">
            <button
              onClick={() => {
                if (onOpenNewProject) onOpenNewProject();
                else navigate("/admin/projects?new=1");
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-slate-900/10 dark:shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 group"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                <span>Nouveau Projet</span>
              </span>
              <span className="text-[10px] font-mono opacity-60 bg-white/10 px-1.5 py-0.5 rounded">
                WIZARD
              </span>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 scrollbar-thin">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-sm shadow-primary/30"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
                            <span>{item.name}</span>
                          </div>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
