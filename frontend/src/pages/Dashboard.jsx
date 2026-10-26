import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Briefcase,
  AlertCircle,
  Plus,
  Receipt,
  CreditCard,
  Activity,
  ShieldAlert,
  ArrowRight,
  Zap,
  Sparkles,
  Layers,
  FileText,
  RotateCcw
} from "lucide-react";
import useCrud, { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isTester, resetTesterSandbox } = useAuth();
  const { data: projectsData, loading: projectsLoading } = useCrud("projects");
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetTester = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser vos projets et factures de test à zéro ?")) {
      return;
    }
    setIsResetting(true);
    const toastId = toast.loading("Réinitialisation de l'espace test...");
    try {
      const res = await resetTesterSandbox();
      if (res?.success) {
        toast.success("Espace testeur remis à zéro (0/3 projets) !", { id: toastId });
        window.location.reload();
      } else {
        toast.error(res?.error || "Échec de la réinitialisation", { id: toastId });
      }
    } catch (err) {
      toast.error("Erreur de connexion", { id: toastId });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        setLoadingDashboard(true);
        const res = await api.get("/dashboard");
        if (res.data?.success) {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.error("Dashboard summary fetch failed", err);
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboardSummary();
  }, []);

  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Computed Financials & Stats
  const stats = useMemo(() => {
    const totalProjects = dashboardData?.total_projects ?? projects.length;
    const totalClients = dashboardData?.total_clients ?? 0;
    const totalInvoices = dashboardData?.total_invoices ?? 0;
    const totalRevenue = dashboardData?.total_revenue ?? 0;

    // Fallbacks from projects array if dashboard summary not available
    const totalBudget = dashboardData?.total_budget ?? projects.reduce((acc, p) => acc + (Number(p.total_cost) || 0), 0);
    const totalRemaining = dashboardData?.total_remaining ?? projects.reduce((acc, p) => acc + (Number(p.remaining_amount) || 0), 0);
    const collectionRate = totalBudget > 0 ? Math.min(100, Math.round(((totalBudget - totalRemaining) / totalBudget) * 100)) : 0;
    const overdueCount = dashboardData?.overdue_count ?? projects.filter(p => p.status === "overdue" || (p.end_date && new Date(p.end_date) < new Date() && p.status !== "completed")).length;

    const statusCounts = dashboardData?.project_status || {
      pending: projects.filter(p => p.status === "pending").length,
      in_progress: projects.filter(p => p.status === "in_progress").length,
      completed: projects.filter(p => p.status === "completed").length,
      overdue: overdueCount,
    };

    return {
      totalProjects,
      totalClients,
      totalInvoices,
      totalRevenue,
      totalBudget,
      totalRemaining,
      collectionRate,
      overdueCount,
      statusCounts
    };
  }, [dashboardData, projects]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
      .slice(0, 5);
  }, [projects]);

  const statusConfig = {
    pending: { label: "En attente", classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40" },
    in_progress: { label: "En cours", classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40" },
    completed: { label: "Terminé", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40" },
    cancelled: { label: "Annulé", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" },
    overdue: { label: "En retard", classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40" }
  };

  if (projectsLoading && loadingDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Synchronisation de Kalyo OS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER & DATE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Kalyo Pilotage OS
            </span>
            <span className="text-xs text-slate-400">• Direction Générale</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tableau de Bord Exécutif
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Surveillance en direct de votre portefeuille d'affaires, trésorerie et livrables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {isTester && (
            <button
              onClick={handleResetTester}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/40 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-all shadow-2xs hover:scale-[1.01] active:scale-95"
              title="Remettre les projets et factures de test à zéro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser (0/3)</span>
            </button>
          )}

          <button
            onClick={() => navigate("/admin/projects?new=1")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* TESTER NOTICE BANNER */}
      {isTester && (
        <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide text-indigo-950 dark:text-white">
                Environnement Testeur Direction Actif
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                Vous pilotez le compte <strong>@admin_tester</strong> avec 1 client unique (<strong>@user_tester</strong>) et 3 projets max. Données isolées et indépendantes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
              {stats.totalProjects} / 3 Projets créés
            </span>
            <Link
              to="/login/client"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Portail Client</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. OVERDUE ALERT BANNER (IF ANY) */}
      {stats.overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide">
                Attention : {stats.overdueCount} projet{stats.overdueCount > 1 ? "s dépassent" : " dépasse"} leur date d'échéance contractuelle !
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Consultez les détails pour replanifier les services ou relancer l'équipe.
              </p>
            </div>
          </div>
          <Link
            to="/admin/projects?status=overdue"
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 text-center transition-colors shadow-xs"
          >
            Voir les retards
          </Link>
        </div>
      )}

      {/* 3. EXECUTIVE KPI CARDS (DOUBLE-BEZEL ARCHITECTURE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Trésorerie Encaissée */}
        <div className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5">
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Trésorerie Encaissée
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.totalRevenue.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Recouvrement Global</span>
              <span className="text-emerald-600 dark:text-emerald-400">{stats.collectionRate}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Portefeuille Actif */}
        <Link 
          to="/admin/projects"
          className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5 block group"
        >
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                Total Projets
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.totalProjects} <span className="text-xs text-slate-400 font-bold">projets</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>En cours de dev</span>
              <span className="text-primary">{stats.statusCounts.in_progress || 0} actifs</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Reste à Percevoir */}
        <div className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5">
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Créances Reste Dû
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {stats.totalRemaining.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Budget Global</span>
              <span className="text-slate-700 dark:text-slate-300">{stats.totalBudget.toLocaleString("fr-FR")} DH</span>
            </div>
          </div>
        </div>

        {/* Card 4: Clients Partenaires */}
        <Link 
          to="/admin/clients"
          className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5 block group"
        >
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                Comptes Clients
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {stats.totalClients} <span className="text-xs text-slate-400 font-bold">entreprises</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Factures Émises</span>
              <span className="text-slate-700 dark:text-slate-300">{stats.totalInvoices} factures</span>
            </div>
          </div>
        </Link>

      </div>

      {/* 4. MAIN BENTO GRID: RECENT PROJECTS & FINANCIAL HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Recent Projects List (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Derniers Projets Déployés
              </h2>
            </div>
            <Link 
              to="/admin/projects" 
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              <span>Voir tout le catalogue</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentProjects.map((project) => {
                const status = statusConfig[project.status] || statusConfig.pending;
                const budget = Number(project.total_cost || 0);
                const remaining = Number(project.remaining_amount || 0);
                const paid = Math.max(0, budget - remaining);
                const payProgress = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0;

                return (
                  <div 
                    key={project.id} 
                    className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Project Name & Client */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link 
                            to={`/admin/projects/${project.id}`}
                            className="font-black text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate"
                          >
                            {project.name}
                          </Link>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1">
                          {project.description || "Aucun descriptif technique fourni."}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {project.client_name || "Client assigné"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {project.end_date ? `Livraison: ${project.end_date}` : "Date indéfinie"}
                          </span>
                        </div>
                      </div>

                      {/* Financial Progress & Amount */}
                      <div className="sm:text-right shrink-0 space-y-1.5">
                        <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                          {budget.toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400 font-bold">DH</span>
                        </p>

                        <div className="w-32 sm:w-28 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden sm:ml-auto">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${payProgress}%` }}
                          />
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold">
                          {payProgress}% payé • Reste {remaining.toLocaleString("fr-FR")} DH
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}

              {recentProjects.length === 0 && (
                <div className="p-12 text-center space-y-3">
                  <FolderKanban className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    Aucun projet en cours. Créez votre première opportunité !
                  </p>
                  <button
                    onClick={() => navigate("/admin/projects?new=1")}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lancer un projet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Health & Quick Actions (Span 1) */}
        <div className="space-y-6">
          
          {/* Financial Velocity Box */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Santé & Trésorerie</span>
            </h2>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* Recovery Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
                  <span>Taux de Recouvrement</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    {stats.collectionRate}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.collectionRate}%` }}
                  />
                </div>
              </div>

              {/* Budget vs Remaining Split */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Encaissé</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                    {stats.totalRevenue.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reste Dû</p>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                    {stats.totalRemaining.toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>

              <Link
                to="/admin/invoices"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.01] active:scale-95"
              >
                <span>Accéder aux Factures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Actions Fréquentes
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate("/admin/projects?new=1")}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary text-left transition-all hover:shadow-xs group"
              >
                <FolderKanban className="w-4 h-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-800 dark:text-white">Créer Projet</p>
                <p className="text-[10px] text-slate-400">Avec wizard devis</p>
              </button>

              <button
                onClick={() => navigate("/admin/clients")}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition-all hover:shadow-xs group"
              >
                <Users className="w-4 h-4 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-800 dark:text-white">Ajouter Client</p>
                <p className="text-[10px] text-slate-400">Coordonnées & accès</p>
              </button>

              <button
                onClick={() => navigate("/admin/invoices")}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 text-left transition-all hover:shadow-xs group"
              >
                <Receipt className="w-4 h-4 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-800 dark:text-white">Nouvelle Facture</p>
                <p className="text-[10px] text-slate-400">Format officiel MAD</p>
              </button>

              <button
                onClick={() => navigate("/admin/payments")}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 text-left transition-all hover:shadow-xs group"
              >
                <CreditCard className="w-4 h-4 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-800 dark:text-white">Saisir Paiement</p>
                <p className="text-[10px] text-slate-400">Virement ou chèque</p>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 5. SYSTEM PIPELINE & RECENT ACTIVITY AUDIT STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
        
        {/* Pipeline Distribution Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Pipeline des Projets</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Répartition
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: "En Cours", count: stats.statusCounts.in_progress || 0, color: "bg-indigo-500", link: "/admin/projects?status=in_progress" },
              { label: "En Attente", count: stats.statusCounts.pending || 0, color: "bg-amber-500", link: "/admin/projects?status=pending" },
              { label: "Terminés", count: stats.statusCounts.completed || 0, color: "bg-emerald-500", link: "/admin/projects?status=completed" },
              { label: "En Retard", count: stats.overdueCount, color: "bg-rose-500", link: "/admin/projects?status=overdue" },
            ].map((item, idx) => (
              <Link 
                key={idx}
                to={item.link}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md tabular-nums">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Activity Audit Stream (Span 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Journal d'Activité &amp; Audit Traçabilité</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Stream
            </span>
          </div>

          <div className="space-y-2">
            {dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
              dashboardData.recent_activities.map((act) => (
                <div 
                  key={act.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {act.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {act.entity_type} #{act.entity_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold">
                    <span>{act.user_name || "Admin"}</span>
                    <span>•</span>
                    <span>{new Date(act.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucune activité récente enregistrée. Les interactions futures apparaîtront ici.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
