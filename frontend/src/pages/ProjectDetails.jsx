import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Code, 
  Pencil, 
  Trash2, 
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Trophy,
  BarChart3,
  TrendingUp,
  XCircle,
  Wallet,
  User,
  Server,
  Plus,
  Tag,
  DollarSign,
  AlignLeft,
  X,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
import useCrud, { api } from "../api/api";
import { Modal } from "../components/layout/Modal";
import toast from "react-hot-toast";
import { FormProjects } from "../components/elements/FormProjects";
import { TaskList } from "../components/features/TaskList";
import { sendCompletionEmail, sendOfferEmail } from "../api/emailService";

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isClient } = useAuth();
  const { getById, loading, error, remove, update } = useCrud("projects");
  const { data: allServices, create: createService } = useCrud("services");
  
  const [project, setProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [showServiceCreation, setShowServiceCreation] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: "", price: "", duration_days: "", description: "" });
  const [isAddingToProject, setIsAddingToProject] = useState(false);

  const fetchProjectAndClient = async () => {
    try {
      const projectData = await getById(id);
      setProject(projectData);
    } catch (err) {
      console.error("Échec de la récupération des données", err);
    }
  };

  const handleAddExistingService = async (serviceId) => {
    setIsAddingToProject(true);
    try {
      const currentServiceIds = project.services?.map(s => s.id) || [];
      await update(id, { services_ids: [...currentServiceIds, serviceId] });
      await fetchProjectAndClient();
      setIsAddingService(false);
      toast.success("Service ajouté avec succès !");
    } catch (err) {
      console.error("Failed to add service", err);
      toast.error("Erreur lors de l'ajout: " + (err.message || ""));
    } finally {
      setIsAddingToProject(false);
    }
  };

  const handleAddCreatedService = async () => {
    if (!newServiceData.name || !newServiceData.price) {
      toast.error("Le nom et le prix sont obligatoires.");
      return;
    }
    setIsAddingToProject(true);
    try {
      // Create it in services (with project_id already linked)
      await createService({
         project_id: id,
         name: newServiceData.name,
         price: parseFloat(newServiceData.price),
         duration_days: parseInt(newServiceData.duration_days || 0),
         description: newServiceData.description
      });

      await fetchProjectAndClient();
      
      setNewServiceData({ name: "", price: "", duration_days: "", description: "" });
      setShowServiceCreation(false);
      setIsAddingService(false);
      toast.success("Service créé et ajouté avec succès !");
    } catch (err) {
      console.error("Failed to create and add service", err);
      toast.error("Erreur lors de la création: " + (err.message || ""));
    } finally {
      setIsAddingToProject(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectAndClient();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      toast.promise(
        remove(id).then(() => navigate(isClient ? "/user/projects" : "/admin/projects")),
        {
          loading: "Suppression du projet...",
          success: "Projet supprimé avec succès !",
          error: (err) => err.message || "Échec de la suppression."
        }
      );
    }
  };


  const handleUpdate = async (updatedData) => {
    const oldStatus = project.status;
    
    // Ensure client_id is passed as our backend now enforces it
    toast.promise(
      update(id, { 
        ...updatedData, 
        client_id: updatedData.client_id || project.client_id 
      }).then(() => {
        // Send Completion Email if status changed to completed
        if (updatedData.status === 'completed' && oldStatus !== 'completed') {
          sendCompletionEmail({...project, ...updatedData}).catch(err => console.error("Completion email failed:", err));
        }

        setIsEditing(false);
        fetchProjectAndClient();
      }),
      {
        loading: "Mise à jour du projet...",
        success: "Projet mis à jour !",
        error: (err) => err.message || "Échec de la mise à jour."
      }
    );
  };

  const handleResendOffer = async () => {
    if (!window.confirm("Voulez-vous vraiment renvoyer cette offre au client ?")) return;
    
    try {
      await api.put(`/projects?id=${id}&resend=true`);
      
      // Send Email to client
      await sendOfferEmail(project, { name: project.client_name, email: project.client_email });
      
      toast.success("L'offre a été renvoyée avec succès !");
      fetchProjectAndClient();
    } catch(err) {
      console.error(err);
      toast.error("Erreur lors du renvoi de l'offre.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 animate-pulse font-medium">Synchronisation des données du projet...</p>
      </div>
    );
  }

  if (error || (!project && !loading)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Projet inaccessible</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Nous n'avons pas pu récupérer les détails de ce projet. Il a peut-être été archivé ou les autorisations ont changé.
        </p>
        <button 
          onClick={() => navigate(isClient ? "/user/projects" : "/admin/projects")}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux Projets
        </button>

      </div>
    );
  }

  const statusConfig = {
    pending: { label: "En attente", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    in_progress: { label: "En cours", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: TrendingUp },
    completed: { label: "Terminé", classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Trophy },
    cancelled: { label: "Annulé", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  };

  const status = statusConfig[project?.status] || statusConfig.pending;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER NAVIGATION */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 group text-slate-500 hover:text-primary transition-colors font-medium border-none p-0 bg-transparent"
        >
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:border-primary/30 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">Retour à la liste</span>
        </button>

        {!isClient && (
          <div className="flex items-center gap-3">
            {project?.status === 'cancelled' && (
              <button 
                  onClick={handleResendOffer}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-500 border border-indigo-600 rounded-lg shadow-sm hover:bg-indigo-600 transition-all font-bold"
              >
                  <RefreshCw className="w-4 h-4" />
                  Renvoyer l'offre
              </button>
            )}

            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:bg-slate-50 transition-all font-bold"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg shadow-sm hover:bg-red-100 transition-all font-bold"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Code className="w-8 h-8" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${status.classes}`}>
                <status.icon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>

            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              {project?.name}
            </h1>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-6">
                <User className="w-4 h-4" />
                Client : <span className="text-primary font-bold">{project?.client_name || 'Chargement du client...'}</span>
            </div>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              {project?.description || "Aucune description disponible pour ce projet."}
            </p>

            {project?.status === 'cancelled' && project?.rejection_note && (
                <div className="mt-6 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl p-4 flex gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Motif de refus (Par le client)</h4>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{project.rejection_note}</p>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8">

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Aperçu du budget</h4>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">
                    {Number(project?.total_cost || 0).toLocaleString()} DH Total
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  Santé Financière
                </h2>
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Reste à percevoir</p>
                    <p className="text-3xl font-black text-primary">{Number(project?.remaining_amount || 0).toLocaleString()} DH</p>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-4 relative mb-4">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-indigo-500 to-indigo-400 rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, 100 - ((project?.remaining_amount || 0) / (project?.total_cost || 1)) * 100))}%` }}
                />
              </div>
              <p className="text-indigo-200 text-sm italic">
                {project?.remaining_amount === 0 
                  ? "Le projet est entièrement payé ! Règlement confirmé." 
                  : `Progression du paiement : ${Math.round(100 - ((project?.remaining_amount || 0) / (project?.total_cost || 1)) * 100)}% collectés.`}
              </p>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-8">
          {/* CLIENT QUICK INFO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Détails du Client
            </h3>
            
            <div className="space-y-5">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nom Complet</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">{project?.client_name || '...'}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Téléphone de Contact</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">{project?.client_phone || 'N/A'}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adresse Email</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-bold truncate transition-all overflow-hidden" title={project?.client_email}>{project?.client_email || 'N/A'}</p>
              </div>
              
              {!isClient && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link 
                    to="/admin/clients"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-all"
                  >
                    Voir tous les clients
                  </Link>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES & TASK LIST SECTION */}
      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Server className="w-6 h-6 text-primary" />
                Services du Projet
            </h2>
            {!isClient && (
              <button 
                  onClick={() => setIsAddingService(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                  <Plus className="w-4 h-4" /> Ajouter un Service
              </button>
            )}
        </div>

        {project.services?.map(service => (
          <div key={service.id} className="mb-12 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-8 pb-4">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                       <Code className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">{service.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                           <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {service.duration_days || 0} Jours
                           </span>
                           <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              {parseFloat(service.price || 0).toLocaleString()} DH
                           </span>
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              service.status === 'completed' ? 'bg-green-100 text-green-700' :
                              service.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-500'
                           }`}>
                              {service.status || 'pending'}
                           </span>
                        </div>
                    </div>
                  </div>
               </div>
            </div>
            <div className="px-8 pb-8">
               <TaskList 
                 tasks={service.tasks || []} 
                 serviceId={service.id}
                 projectId={project.id}
                 onRefresh={fetchProjectAndClient}
               />
            </div>
          </div>
        ))}
      </div>

      {/* EDIT PROJECT MODAL */}
      <Modal isVisible={isEditing} onClose={() => setIsEditing(false)}>
        <FormProjects 
          initialData={project} 
          onSubmit={handleUpdate} 
          onCancel={() => setIsEditing(false)} 
        />
      </Modal>

      {/* ADD SERVICE MODAL */}
      <Modal isVisible={isAddingService} onClose={() => { setIsAddingService(false); setShowServiceCreation(false); }}>
         <div className="p-6">
            {showServiceCreation ? (
               <div className="space-y-5 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nouveau Service</h3>
                        <p className="text-xs text-slate-500">Ajoutez une prestation personnalisée à ce projet</p>
                     </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                     <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du service</label>
                        <div className="relative">
                           <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              value={newServiceData.name} 
                              onChange={e => setNewServiceData({...newServiceData, name: e.target.value})} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                              placeholder="ex: Design UI/UX"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix (DH)</label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="number" 
                              value={newServiceData.price} 
                              onChange={e => setNewServiceData({...newServiceData, price: e.target.value})} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                              placeholder="0.00"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durée (Jours)</label>
                        <div className="relative">
                           <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="number" 
                              value={newServiceData.duration_days} 
                              onChange={e => setNewServiceData({...newServiceData, duration_days: e.target.value})} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                              placeholder="ex: 7"
                           />
                        </div>
                     </div>
                     <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                        <div className="relative">
                           <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                           <textarea 
                              value={newServiceData.description} 
                              onChange={e => setNewServiceData({...newServiceData, description: e.target.value})} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-none"
                              rows={3}
                              placeholder="Description détaillée du service..."
                           />
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <button 
                        onClick={() => setShowServiceCreation(false)} 
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                     >
                        Annuler
                     </button>
                     <button 
                        onClick={handleAddCreatedService} 
                        disabled={isAddingToProject}
                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-black text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                     >
                        {isAddingToProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isAddingToProject ? "Création..." : "Ajouter au Projet"}
                     </button>
                  </div>
               </div>
            ) : (
               <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                     <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                        Personalisez votre projet en ajoutant des services sur mesure adaptés aux besoins de votre client.
                     </p>
                     
                     <button 
                        onClick={() => setShowServiceCreation(true)}
                        className="group flex flex-col items-center gap-3 p-8 rounded-3xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all w-full max-w-sm"
                     >
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                           <Plus className="w-8 h-8 font-black" />
                        </div>
                        <div className="text-center">
                           <h4 className="font-black text-slate-800 dark:text-white mb-1">Démarrer la création</h4>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans">Définir un nouveau service</p>
                        </div>
                     </button>
                  </div>

                  <div className="flex items-center justify-center py-2 px-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                     <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 text-center uppercase tracking-widest">
                        Pas de templates disponibles ? Créez vos services ad-hoc ci-dessus.
                     </p>
                  </div>
               </div>
            )}
         </div>
      </Modal>
    </div>
  );
};
