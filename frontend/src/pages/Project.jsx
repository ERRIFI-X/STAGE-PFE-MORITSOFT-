import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Clock, 
  Calendar, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Archive, 
  BarChart2, 
  XCircle, 
  Eye, 
  User, 
  Download,
  LayoutGrid,
  List,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Filter,
  ArrowRight,
  TrendingUp,
  FolderKanban,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import useCrud from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/layout/Modal";
import { ProjectWizard } from "../components/elements/ProjectWizard";
import { FormProjects } from "../components/elements/FormProjects";
import { sendOfferEmail } from "../api/emailService";
import { ConfirmModal } from "../components/elements/ConfirmModal";
import { toast } from "react-hot-toast";

export const Project = () => {
  const navigate = useNavigate();
  const { isTester, resetTesterSandbox } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "all";
  const initialSearch = searchParams.get("q") || "";
  const initialNew = searchParams.get("new") === "1";

  const { data, loading, error, create, remove, update } = useCrud("projects");
  const projects = Array.isArray(data) ? data : [];
  const { getAll: getClients } = useCrud("clients");
  
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedClientFilter, setSelectedClientFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [showForm, setShowForm] = useState(initialNew);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
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
    const saved = localStorage.getItem("project_wizard_draft");
    if (saved) setHasDraft(true);
  }, [showForm]);

  useEffect(() => {
    const fetchClients = async () => {
      const c = await getClients();
      setClients(c || []);
    };
    fetchClients();
  }, []);

  // Update query params on status change
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
    }
  }, [searchParams]);

  const matchesStatus = (project, filter) => {
    if (filter === "all") return true;
    if (filter === "overdue") {
      return project.status === "overdue" || (project.end_date && new Date(project.end_date) < new Date() && project.status !== "completed");
    }
    return project.status === filter;
  };

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(p => {
      const matchesSearch = 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatusFilter = matchesStatus(p, statusFilter);
      const matchesClient = selectedClientFilter === "all" || String(p.client_id) === String(selectedClientFilter);

      return matchesSearch && matchesStatusFilter && matchesClient;
    });
  }, [data, search, statusFilter, selectedClientFilter]);

  // Aggregate stats of current data
  const summary = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const totalCost = list.reduce((acc, p) => acc + (Number(p.total_cost) || 0), 0);
    const totalRemaining = list.reduce((acc, p) => acc + (Number(p.remaining_amount) || 0), 0);
    const totalPaid = Math.max(0, totalCost - totalRemaining);
    const overdueCount = list.filter(p => p.status === "overdue" || (p.end_date && new Date(p.end_date) < new Date() && p.status !== "completed")).length;

    return {
      total: list.length,
      pending: list.filter(p => p.status === "pending").length,
      in_progress: list.filter(p => p.status === "in_progress").length,
      completed: list.filter(p => p.status === "completed").length,
      overdue: overdueCount,
      totalCost,
      totalPaid,
      totalRemaining
    };
  }, [data]);

  const handleExportCSV = () => {
    if (!filteredProjects.length) {
      toast.error("Aucun projet à exporter");
      return;
    }
    const headers = ["ID", "Nom du Projet", "Client", "Statut", "Budget Total (MAD)", "Reste Dû (MAD)", "Date Début", "Date Échéance"];
    const rows = filteredProjects.map(p => [
      p.id,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.client_name || "").replace(/"/g, '""')}"`,
      `"${p.status || ""}"`,
      p.total_cost || 0,
      p.remaining_amount || 0,
      `"${p.start_date || ""}"`,
      `"${p.end_date || ""}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `projets_kalyo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportation des projets terminée !");
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    
    toast.promise(
      remove(projectToDelete.id).then(() => {
        setProjectToDelete(null);
        setIsDeleting(false);
      }),
      {
        loading: "Suppression du projet en cours...",
        success: "Projet supprimé définitivement !",
        error: (err) => {
          setIsDeleting(false);
          return err.message || "Impossible de supprimer ce projet.";
        }
      }
    );
  };

  const handleAdd = async (newProject) => {
    const action = create(newProject);
    
    toast.promise(
      action.then((result) => {
        setShowForm(false);
        // Clean URL parameter if exists
        searchParams.delete("new");
        setSearchParams(searchParams);

        // Send Offer Email if configured
        const client = clients.find(c => String(c.id) === String(newProject.client_id));
        if (client && client.email) {
          sendOfferEmail(newProject, client).catch(err => console.error("Email notification error:", err));
        }

        if (result && result.id) {
          navigate(`/admin/projects/${result.id}`);
        }
      }),
      {
        loading: "Création du projet...",
        success: "Projet et services enregistrés avec succès !",
        error: (err) => err.message || "Échec de la création du projet."
      }
    );
  };

  const handleSaveEdit = async (projectData) => {
    toast.promise(
      update(projectData.id, projectData).then(() => {
        setEditProject(null);
      }),
      {
        loading: "Mise à jour du projet...",
        success: "Projet mis à jour avec succès !",
        error: (err) => err.message || "Échec de la mise à jour."
      }
    );
  };

  const statusConfig = {
    pending: { label: "En attente", classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40" },
    in_progress: { label: "En cours", classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40" },
    completed: { label: "Terminé", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40" },
    cancelled: { label: "Annulé", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" },
    overdue: { label: "En retard", classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40" }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Portefeuille d'Affaires
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {filteredProjects.length} affiché{filteredProjects.length > 1 ? "s" : ""}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestion des Projets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Orchestration, tarification MAD et suivi d'avancement de vos contrats.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white dark:bg-slate-900 text-primary shadow-2xs" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-white dark:bg-slate-900 text-primary shadow-2xs" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              title="Vue Tableau Dense"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all hover:scale-[1.01] active:scale-95"
            title="Exporter la liste actuelle en CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>

          {isTester && (
            <button
              onClick={handleResetTester}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/40 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-2xs hover:scale-[1.01] active:scale-95"
              title="Remettre les projets et factures de test à zéro"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser (0/3)</span>
            </button>
          )}

          {isTester && projects.length >= 3 ? (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-black cursor-not-allowed opacity-80"
              title="Limite de test atteinte (3/3 projets). Réinitialisez l'espace pour recommencer."
            >
              <Plus className="w-4 h-4" />
              <span>Quota Atteint (3/3)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Projet</span>
            </button>
          )}
        </div>
      </div>

      {/* TESTER NOTICE BANNER */}
      {isTester && (
        <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-[11px] uppercase tracking-wide">
              🧪 Règle Testeur
            </span>
            <span className="font-medium">
              Espace de test Direction démarré à neuf. Vos projets sont affectés à votre client unique <strong>@user_tester</strong> (Max 3 projets autorisés).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
              projects.length >= 3 
                ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                : 'bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
            }`}>
              {projects.length} / 3 Projets créés
            </span>
          </div>
        </div>
      )}

      {/* 2. SUMMARY FINANCIAL CHIPS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Engagé</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {summary.totalCost.toLocaleString("fr-FR")} <span className="text-[10px] font-bold text-slate-400">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Encaissé</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {summary.totalPaid.toLocaleString("fr-FR")} <span className="text-[10px] font-bold text-slate-400">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reste Dû</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {summary.totalRemaining.toLocaleString("fr-FR")} <span className="text-[10px] font-bold text-slate-400">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Projets en Retard</p>
          <p className={`text-xl font-black mt-1 tabular-nums ${summary.overdue > 0 ? "text-rose-600" : "text-slate-400"}`}>
            {summary.overdue} <span className="text-[10px] font-bold">alerte{summary.overdue > 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Tous", count: summary.total },
            { id: "in_progress", label: "En cours", count: summary.in_progress },
            { id: "pending", label: "En attente", count: summary.pending },
            { id: "completed", label: "Terminés", count: summary.completed },
            { id: "overdue", label: "En retard", count: summary.overdue, isAlert: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : tab.isAlert && tab.count > 0
                    ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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

        {/* Search & Client Filter */}
        <div className="flex items-center gap-3 flex-1 lg:max-w-md">
          {/* Client Filter Dropdown */}
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary transition-all max-w-[140px] truncate"
          >
            <option value="all">Tous les clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer projets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. CONTENT VIEW: GRID OR TABLE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-xs font-bold">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">
            Aucun projet ne correspond à vos critères
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Vérifiez l'orthographe ou réinitialisez les filtres de statut et de client.
          </p>
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setSelectedClientFilter("all"); }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === "grid" ? (
        
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const isOverdue = project.status === "overdue" || (project.end_date && new Date(project.end_date) < new Date() && project.status !== "completed");
            const statusKey = isOverdue ? "overdue" : project.status;
            const status = statusConfig[statusKey] || statusConfig.pending;
            const client = clients.find(c => String(c.id) === String(project.client_id));

            const budget = Number(project.total_cost || 0);
            const remaining = Number(project.remaining_amount || 0);
            const paid = Math.max(0, budget - remaining);
            const payProgress = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0;

            return (
              <div 
                key={project.id} 
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                {/* Top Row: Client & Status Badge & Menu */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.classes}`}>
                      {status.label}
                    </span>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === project.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-200/80 dark:border-slate-800 z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                            <Link 
                              to={`/admin/projects/${project.id}`} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>Fiche Complète</span>
                            </Link>
                            <button 
                              onClick={() => { setEditProject(project); setOpenMenuId(null); }} 
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                              <span>Modifier Titre/Dates</span>
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                            <button 
                              onClick={() => { setProjectToDelete(project); setOpenMenuId(null); }} 
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Title */}
                  <Link 
                    to={`/admin/projects/${project.id}`}
                    className="font-black text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {project.name}
                  </Link>

                  {/* Client Tag */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{client?.name || project.client_name || "Client assigné"}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 min-h-[32px]">
                    {project.description || "Aucune description détaillée enregistrée pour ce projet."}
                  </p>
                </div>

                {/* Bottom Section: Financial Progress Bar & Dates */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  
                  {/* Financial Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Recouvrement</span>
                      <span className="text-slate-900 dark:text-white tabular-nums">
                        {payProgress}% ({paid.toLocaleString("fr-FR")} DH)
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${payProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Date & Detail Link */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.end_date || "Sans date"}
                    </span>
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                    >
                      <span>Ouvrir</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* HIGH-DENSITY TABLE VIEW */
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/60 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <th className="px-5 py-3.5">Projet</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Budget MAD</th>
                  <th className="px-5 py-3.5 text-right">Reste Dû</th>
                  <th className="px-5 py-3.5">Échéance</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredProjects.map(project => {
                  const isOverdue = project.status === "overdue" || (project.end_date && new Date(project.end_date) < new Date() && project.status !== "completed");
                  const statusKey = isOverdue ? "overdue" : project.status;
                  const status = statusConfig[statusKey] || statusConfig.pending;
                  const client = clients.find(c => String(c.id) === String(project.client_id));

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-5 py-4">
                        <Link 
                          to={`/admin/projects/${project.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors block"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {client?.name || project.client_name || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-900 dark:text-white tabular-nums">
                        {Number(project.total_cost || 0).toLocaleString("fr-FR")} DH
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {Number(project.remaining_amount || 0).toLocaleString("fr-FR")} DH
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-semibold">
                        {project.end_date || "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/projects/${project.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Voir la fiche"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setEditProject(project)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProjectToDelete(project)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <Modal isVisible={showForm} onClose={() => setShowForm(false)} maxWidth="max-w-2xl">
        <ProjectWizard 
          onSubmit={handleAdd} 
          onCancel={() => setShowForm(false)} 
        />
      </Modal>

      <Modal isVisible={editProject !== null} onClose={() => setEditProject(null)}>
        <FormProjects
          initialData={editProject}
          onSubmit={handleSaveEdit}
          onCancel={() => setEditProject(null)}
        />
      </Modal>

      <ConfirmModal
        isVisible={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={projectToDelete?.name}
        message="Voulez-vous vraiment supprimer définitivement ce projet et ses services associés ?"
        loading={isDeleting}
      />
    </div>
  );
};
