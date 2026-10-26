import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/api";
import { 
  Package, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  FileText,
  ShieldCheck,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ExternalLink,
  DollarSign,
  Printer,
  Sparkles,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Modal } from "../../components/layout/Modal";

export default function UserDashboard() {
  const { user, isTester } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [rejectingProject, setRejectingProject] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, invoicesRes] = await Promise.all([
        api.get("/projects"),
        api.get("/invoices")
      ]);

      const projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const invoicesList = Array.isArray(invoicesRes.data?.data) 
        ? invoicesRes.data.data 
        : (Array.isArray(invoicesRes.data) ? invoicesRes.data : []);

      setProjects(projectsList);
      setInvoices(invoicesList);
    } catch (error) {
      console.error("Failed to fetch client dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Client Financials & Counts
  const metrics = useMemo(() => {
    const inProgressProjects = projects.filter(p => p.status === "in_progress");
    const pendingOffers = projects.filter(p => p.status === "pending");
    const completedProjects = projects.filter(p => p.status === "completed");

    const totalInvoiced = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paidInvoices = invoices.filter(i => i.status === "paid");
    const totalPaid = paidInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const pendingBalance = Math.max(0, totalInvoiced - totalPaid);

    return {
      inProgressCount: inProgressProjects.length,
      pendingOffersCount: pendingOffers.length,
      completedCount: completedProjects.length,
      totalInvoiced,
      totalPaid,
      pendingBalance,
      pendingOffers
    };
  }, [projects, invoices]);

  // Handle Client Confirming an Offer
  const handleConfirmProject = async (projectId) => {
    setConfirmingId(projectId);
    try {
      await api.put(`/projects?id=${projectId}&confirm=true`);
      toast.success("Proposition validée ! Le projet est officiellement lancé. 🎉");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la confirmation.");
    } finally {
      setConfirmingId(null);
    }
  };

  // Handle Client Rejecting an Offer
  const handleRejectProject = async () => {
    if (!rejectingProject) return;
    setIsRejecting(true);
    try {
      await api.put(`/projects?id=${rejectingProject.id}&reject=true`, { 
        note: rejectionNote || "Aucune note fournie." 
      });
      toast.success("Proposition refusée. L'équipe Kalyo en a été notifiée.");
      setRejectingProject(null);
      setRejectionNote("");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Erreur lors du refus.");
    } finally {
      setIsRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Chargement de votre Espace Partenaire...
        </p>
      </div>
    );
  }

  const recentProjects = projects.slice(0, 4);
  const recentInvoices = invoices.slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. WELCOME HERO CARD (DOUBLE-BEZEL) */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/25 rounded-full blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-wider border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portail Client Collaboratif Sécurisé</span>
              </div>
              {isTester ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>🧪 Compte Testeur : {projects.length}/3 Projets</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Client Partenaire Certifié</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Bonjour, {user?.name || "Client Partenaire"}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Retrouvez l'avancement en temps réel de vos développements, validez les propositions d'offres et accédez à vos factures certifiées en MAD.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <Link
              to="/user/projects"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-md"
            >
              <span>Suivre mes projets</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              to="/user/invoices"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>Mes Factures</span>
            </Link>
          </div>
        </div>
      </div>

      {/* TESTER NOTICE BANNER */}
      {isTester && (
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-black text-[11px] uppercase tracking-wide">
              🧪 Portail Testeur
            </span>
            <span className="font-medium">
              Connecté en tant que <strong>@user_tester</strong>. Cet espace affiche les propositions de projets créées depuis l'Espace Direction pour test et validation.
            </span>
          </div>
          <Link
            to="/login/admin"
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Espace Direction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 2. PENDING OFFERS ALERT: ACTION NEEDED */}
      {metrics.pendingOffersCount > 0 && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-900/50 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Action Requise : {metrics.pendingOffersCount} Proposition{metrics.pendingOffersCount > 1 ? "s" : ""} en attente de votre accord
              </h2>
            </div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              Validez l'offre pour démarrer les travaux
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.pendingOffers.map((offer) => (
              <div 
                key={offer.id} 
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {offer.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {offer.description || "Offre technique préparée par Kalyo."}
                    </p>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums shrink-0">
                    {Number(offer.total_cost || 0).toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400">DH</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleConfirmProject(offer.id)}
                    disabled={confirmingId === offer.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-xs disabled:opacity-60"
                  >
                    {confirmingId === offer.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-3.5 h-3.5" />
                    )}
                    <span>Valider l'offre</span>
                  </button>

                  <button
                    onClick={() => setRejectingProject(offer)}
                    disabled={confirmingId === offer.id}
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 text-xs font-bold transition-all"
                    title="Motiver un refus"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Refuser</span>
                  </button>

                  <Link
                    to={`/user/projects/${offer.id}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Voir les détails"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. KEY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1: Projets en cours */}
        <Link 
          to="/user/projects"
          className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5 block group"
        >
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                En Développement
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {metrics.inProgressCount} <span className="text-xs text-slate-400 font-bold">projets</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Cadence Sprint</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Actif</span>
            </div>
          </div>
        </Link>

        {/* Metric 2: Projets Terminés */}
        <div className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5">
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Projets Livrés
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {metrics.completedCount} <span className="text-xs text-slate-400 font-bold">déployés</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Satisfaction</span>
              <span className="text-emerald-600 dark:text-emerald-400">100%</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Reste à Régler */}
        <div className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5">
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Solde Restant Dû
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {metrics.pendingBalance.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Facturation MAD</span>
              <span className="text-slate-700 dark:text-slate-300">À échéance</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Règlements Effectués */}
        <div className="p-1.5 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-0.5">
          <div className="p-5 rounded-[1.3rem] bg-white dark:bg-slate-900 shadow-inset space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Paiements Réglés
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {metrics.totalPaid.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
            </p>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Total Contrats</span>
              <span className="text-slate-700 dark:text-slate-300">{metrics.totalInvoiced.toLocaleString("fr-FR")} DH</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. MAIN BENTO SECTION: LIVE PROJECTS & INVOICES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Left: Recent Projects & Avancement */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Avancement de vos Projets
              </h2>
            </div>
            <Link 
              to="/user/projects"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              <span>Tous mes projets</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentProjects.map(project => {
                const isCompleted = project.status === "completed";
                const isPending = project.status === "pending";

                return (
                  <div key={project.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/user/projects/${project.id}`}
                            className="font-black text-sm text-slate-900 dark:text-white hover:text-primary transition-colors truncate"
                          >
                            {project.name}
                          </Link>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            isPending ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                          }`}>
                            {isCompleted ? "Terminé" : isPending ? "En attente" : "En cours"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1">
                          {project.description || "Projet contracté avec Kalyo."}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {project.end_date ? `Livraison : ${project.end_date}` : "Date en cours"}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <Link 
                          to={`/user/projects/${project.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <span>Consulter</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                    </div>
                  </div>
                );
              })}

              {recentProjects.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Aucun projet associé à votre compte actuellement.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Recent Invoices & Direct Print */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Dernières Factures & Justificatifs
              </h2>
            </div>
            <Link 
              to="/user/invoices"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              <span>Toutes mes factures</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentInvoices.map(invoice => {
                const isPaid = invoice.status === "paid";

                return (
                  <div key={invoice.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono font-black text-xs text-slate-900 dark:text-white">
                            FAC-{String(invoice.id).padStart(5, '0')}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {invoice.project_name || "Projet"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                            {Number(invoice.amount || 0).toLocaleString("fr-FR")} DH
                          </p>
                          <span className={`inline-block text-[9px] px-2 py-0.2 rounded-full font-black uppercase tracking-wider ${
                            isPaid 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {isPaid ? "Acquittée" : "En attente"}
                          </span>
                        </div>

                        <button
                          onClick={() => window.open(`/user/invoices/print/${invoice.id}`, '_blank')}
                          className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Télécharger / Imprimer la facture"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}

              {recentInvoices.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Aucune facture émise pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 5. REJECTION REASON MODAL */}
      <Modal isVisible={!!rejectingProject} onClose={() => setRejectingProject(null)}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Refuser la Proposition : {rejectingProject?.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transmettez votre remarque à l'équipe Kalyo afin d'adapter le devis ou les délais.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Motif du Refus ou Ajustements Souhaités
            </label>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Ex : Nous souhaitons ajuster le délai de livraison ou rediscuter du périmètre des services..."
              className="w-full h-28 p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 resize-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setRejectingProject(null)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={handleRejectProject}
              disabled={isRejecting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
              <span>Confirmer le Refus</span>
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
