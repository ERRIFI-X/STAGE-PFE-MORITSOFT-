import { useState, useEffect, useMemo } from "react";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { 
  Package, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Modal } from "../../components/layout/Modal";

export default function UserProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmingId, setConfirmingId] = useState(null);
  const [rejectingProject, setRejectingProject] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch client projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (projectId) => {
    setConfirmingId(projectId);
    try {
      await api.put(`/projects?id=${projectId}&confirm=true`);
      toast.success("Proposition acceptée ! Le projet démarre dès maintenant. ✅");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la validation.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingProject) return;
    setIsRejecting(true);
    try {
      await api.put(`/projects?id=${rejectingProject.id}&reject=true`, { 
        note: rejectionNote || "Aucune note fournie." 
      });
      toast.success("Projet refusé. L'équipe Kalyo a été informée.");
      setRejectingProject(null);
      setRejectionNote("");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Erreur lors du refus.");
    } finally {
      setIsRejecting(false);
    }
  };

  // Status counts for tab chips
  const counts = useMemo(() => {
    return {
      all: projects.length,
      pending: projects.filter(p => p.status === "pending").length,
      in_progress: projects.filter(p => p.status === "in_progress").length,
      completed: projects.filter(p => p.status === "completed").length
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const lower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm.trim() ||
        p.name.toLowerCase().includes(lower) ||
        (p.description && p.description.toLowerCase().includes(lower));

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const statusConfig = {
    pending: { label: "Offre à Valider", classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40" },
    in_progress: { label: "En Développement", classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40" },
    completed: { label: "Livré & Clôturé", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40" },
    cancelled: { label: "Offre Déclinée", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" },
    overdue: { label: "En Retard", classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40" }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Chargement de votre portefeuille de projets...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Espace Client
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {filteredProjects.length} projet{filteredProjects.length > 1 ? "s" : ""}</span>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 rounded-full">
              Quota Démo : {projects.length}/3 Projets
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Mes Projets &amp; Livrables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi en temps réel de vos développements et validation des propositions d'offres.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher dans mes projets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* 2. STATUS TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "Tous les Projets", count: counts.all },
          { id: "pending", label: "À Valider (Offres)", count: counts.pending, isAlert: true },
          { id: "in_progress", label: "En Développement", count: counts.in_progress },
          { id: "completed", label: "Terminés", count: counts.completed },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                : tab.isAlert && tab.count > 0
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              statusFilter === tab.id
                ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. PROJECTS LIST */}
      <div className="space-y-4 sm:space-y-6">
        {filteredProjects.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              Aucun projet trouvé pour cette vue
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm 
                ? "Aucun résultat ne correspond à votre recherche." 
                : "Vous n'avez pas de projets dans cette catégorie pour le moment."}
            </p>
          </div>
        ) : (
          filteredProjects.map(project => {
            const isPending = project.status === "pending";
            const isCompleted = project.status === "completed";
            const status = statusConfig[project.status] || statusConfig.pending;

            const budget = Number(project.total_cost || 0);
            const remaining = Number(project.remaining_amount || 0);
            const paid = Math.max(0, budget - remaining);
            const payProgress = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0;

            return (
              <div 
                key={project.id} 
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 space-y-6"
              >
                {/* Header Row: Title, Status, Price */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link 
                        to={`/user/projects/${project.id}`}
                        className="font-black text-lg text-slate-900 dark:text-white hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 max-w-3xl">
                      {project.description || "Offre technique et livrables supervisés par l'équipe Kalyo."}
                    </p>
                  </div>

                  {/* Financial Tag */}
                  <div className="md:text-right shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Budget Devis</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                      {budget.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
                    </p>
                  </div>
                </div>

                {/* Rejection Note If Project was Cancelled/Rejected */}
                {project.status === "cancelled" && project.rejection_note && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
                    <span className="font-bold">Motif du refus notifié :</span> {project.rejection_note}
                  </div>
                )}

                {/* Progress & Milestone Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 items-center">
                  
                  {/* Start Date */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Date de Début</span>
                      <span>{project.start_date || "Dès validation"}</span>
                    </div>
                  </div>

                  {/* Target Delivery Date */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-black uppercase block">Échéance Contractuelle</span>
                      <span className={project.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>
                        {project.end_date || "En cours de cadrage"}
                      </span>
                    </div>
                  </div>

                  {/* Payment / Recovery Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Règlement Effectué</span>
                      <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                        {payProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${payProgress}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  
                  {/* If Pending: Validation buttons */}
                  {isPending ? (
                    <div className="flex items-center gap-2.5 flex-1">
                      <button
                        onClick={() => handleConfirm(project.id)}
                        disabled={confirmingId === project.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-60"
                      >
                        {confirmingId === project.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3.5 h-3.5" />
                        )}
                        <span>Valider &amp; Lancer le Projet</span>
                      </button>

                      <button
                        onClick={() => setRejectingProject(project)}
                        disabled={confirmingId === project.id}
                        className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 text-xs font-bold transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span className="ml-1.5 hidden sm:inline">Refuser l'offre</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{isCompleted ? "Projet validé et clôturé avec succès" : "Développement en cours par l'équipe Kalyo"}</span>
                    </div>
                  )}

                  <Link 
                    to={`/user/projects/${project.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider shadow-2xs transition-all hover:scale-[1.01] active:scale-95 shrink-0"
                  >
                    <span>Fiche &amp; Livrables</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 4. REJECTION MODAL */}
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
                Précisez pourquoi vous ne souhaitez pas continuer afin que l'équipe Kalyo réajuste l'offre.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Motif du Refus (Optionnel)
            </label>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Ex : Le budget dépasse nos prévisions, ou la date de livraison souhaitée est plus proche..."
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
              onClick={handleReject}
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
