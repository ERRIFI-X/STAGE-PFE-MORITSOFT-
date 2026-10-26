import { useState, useEffect, useMemo } from "react";
import { 
  X, FolderOpen, FileText, User, Server, 
  Calendar, ChevronRight, ChevronLeft, 
  CheckCircle, List, Info, Eye, Loader2, Star, Send,
  Tag, DollarSign, Clock, AlignLeft, Trash2
} from "lucide-react";
import useCrud from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_FORM_DATA = {
  name: "",
  description: "",
  client_id: "",
  start_date: "",
  end_date: "", // Keeping it in state but not in the UI
  selectedServices: [],
};

export const ProjectWizard = ({ onSubmit, onCancel }) => {
  const { user, isTester } = useAuth();
  const isSuperAdmin = user?.username === "admin" && !isTester;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showCreateService, setShowCreateService] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration_days: "" });
  const [isCreatingService, setIsCreatingService] = useState(false);
  
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const { data: clients } = useCrud("clients");
  const { data: catalogServices } = useCrud("services");
  const { data: allProjectsData } = useCrud("projects");

  // Pre-select the default client for Tester Admin (only 1 test client available)
  useEffect(() => {
    if (Array.isArray(clients) && clients.length > 0 && !formData.client_id) {
      if (isTester || clients.length === 1) {
        setFormData(prev => ({ ...prev, client_id: String(clients[0].id) }));
      }
    }
  }, [isTester, clients, formData.client_id]);

  const clientProjectsCount = useMemo(() => {
    if (!Array.isArray(allProjectsData)) return 0;
    if (isTester) return allProjectsData.length;
    if (!formData.client_id) return 0;
    return allProjectsData.filter(p => String(p.client_id) === String(formData.client_id)).length;
  }, [isTester, formData.client_id, allProjectsData]);

  // Quota is ONLY enforced if tester!
  const isClientQuotaReached = isTester && clientProjectsCount >= 3;

  useEffect(() => {
    const saved = localStorage.getItem("project_wizard_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({
          ...DEFAULT_FORM_DATA,
          ...(parsed.formData || {}),
          selectedServices: Array.isArray(parsed.formData?.selectedServices) 
            ? parsed.formData.selectedServices 
            : []
        }));
        setStep(parsed.step || 1);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("project_wizard_draft", JSON.stringify({ formData, step }));
  }, [formData, step]);

  const clearDraft = () => {
    localStorage.removeItem("project_wizard_draft");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.client_id) {
        setError("Veuillez remplir le nom et le client.");
        return;
      }
      if (isClientQuotaReached) {
        setError(`Limite de test atteinte : Le compte testeur est limité à 3 projets maximum (${clientProjectsCount}/3). Réinitialisez l'espace test pour créer de nouveaux projets.`);
        return;
      }
    }
    setError("");
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setError("");
    setStep(s => Math.max(s - 1, 1));
  };

  const toggleService = (service) => {
    const exists = formData.selectedServices.find(s => s.id === service.id);
    if (exists) {
      setFormData(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.filter(s => s.id !== service.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, service]
      }));
    }
  };

  const totalPrice = useMemo(() => {
    return (formData.selectedServices || []).reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
  }, [formData.selectedServices]);

  const totalDuration = useMemo(() => {
    return (formData.selectedServices || []).reduce((sum, s) => sum + parseInt(s.duration_days || 0), 0);
  }, [formData.selectedServices]);

  const estimatedEndDate = useMemo(() => {
    if (!formData.start_date || totalDuration === 0) return null;
    const date = new Date(formData.start_date);
    date.setDate(date.getDate() + totalDuration);
    return date.toISOString().split('T')[0];
  }, [formData.start_date, totalDuration]);

  const handleCreateService = async () => {
    if (!newService.name.trim() || !newService.price) {
      setError("Le nom et le prix du service sont requis.");
      return;
    }
    
    // Create an ad-hoc service locally (no API call needed anymore)
    const adHocService = {
       id: `adhoc_${Date.now()}`, // Temporary ID for selection logic
       name: newService.name,
       description: newService.description,
       price: parseFloat(newService.price),
       duration_days: parseInt(newService.duration_days || 0),
       is_adhoc: true
    };

    setFormData(prev => ({
      ...prev,
      selectedServices: [...(prev.selectedServices || []), adHocService]
    }));

    setNewService({ name: "", description: "", price: "", duration_days: "" });
    setShowCreateService(false);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Logic: Send the whole service object since the backend will insert them for this project_id.
      const servicePayload = (formData.selectedServices || []).map((s) => ({
         name: s.name,
         price: s.price,
         duration_days: s.duration_days,
         description: s.description
      }));

      await onSubmit({
        ...formData,
        total_price: totalPrice,
        total_cost: totalPrice,
        services: servicePayload
      });
      clearDraft();
    } catch (err) {
      setError("Erreur lors de la création du projet.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: "Informations" },
    { id: 2, label: "Services" },
    { id: 3, label: "Récapitulatif" },
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
      {/* HEADER & PROGRESS */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                Nouveau Projet
            </h2>
            <button onClick={onCancel} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex items-center justify-between pb-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${step >= s.id ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > s.id ? "bg-primary" : "bg-slate-100 dark:bg-slate-800"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <Info className="w-4 h-4" /> {error}
          </div>
        )}

        {/* STEP 1: PROJECT DETAILS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="grid gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Client</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <select
                    name="client_id"
                    required
                    value={formData.client_id}
                    onChange={handleChange}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner un Client (Obligatoire)</option>
                    {Array.isArray(clients) && clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {!formData.client_id ? (
                   <p className="text-[10px] text-amber-600 font-bold mt-1 animate-pulse">
                      * Le choix du client est obligatoire pour passer à l'étape suivante.
                   </p>
                ) : (
                  isSuperAdmin ? (
                    <div className="mt-2 p-2.5 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Compte Administrateur Principal : <strong>Création de projets illimitée</strong></span>
                      </span>
                      <span className="text-[10px] uppercase font-black bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full text-emerald-800 dark:text-emerald-200">
                        Illimité
                      </span>
                    </div>
                  ) : (
                    <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                      isClientQuotaReached 
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300' 
                        : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Compte Testeur Direction : <strong>{clientProjectsCount}/3 projets</strong></span>
                      </span>
                      {isClientQuotaReached ? (
                        <span className="text-[10px] uppercase font-black bg-rose-200/60 dark:bg-rose-900/60 px-2 py-0.5 rounded-full text-rose-800 dark:text-rose-200">
                          Quota Testeur Atteint (3/3)
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-black bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full text-emerald-800 dark:text-emerald-200">
                          {3 - clientProjectsCount} restant(s)
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Nom du Projet</label>
                <div className="relative group">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="ex: Application Web E-commerce"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Objectifs et périmètre du projet..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Date de début</label>
                <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary transition-all outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICE SELECTION */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Catalogue des Services</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowCreateService(!showCreateService)}
                  className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all"
                >
                  {showCreateService ? "Annuler le nouveau" : "+ Nouveau Service Ad-hoc"}
                </button>
              </div>
            </div>

            {/* CATALOG SERVICES */}
            {!showCreateService && Array.isArray(catalogServices) && catalogServices.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {catalogServices.map(cs => {
                   const isSelected = formData.selectedServices.some(s => s.name === cs.name);
                   return (
                     <div 
                        key={cs.id}
                        onClick={() => toggleService(cs)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm'}`}
                     >
                       <div className="flex items-start justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                             <Server className="w-3.5 h-3.5" />
                           </div>
                           <h5 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{cs.name}</h5>
                         </div>
                       </div>
                       <div className="flex items-center justify-between mt-3 text-xs">
                          <span className="font-black text-primary">{parseFloat(cs.price || 0).toLocaleString()} DH</span>
                          <span className="text-slate-500">{cs.duration_days || 0} Jours</span>
                       </div>
                     </div>
                   )
                })}
              </div>
            )}

            <div className="flex items-center justify-between mb-2 pt-4 border-t border-slate-100 dark:border-slate-800">
               <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <List className="w-4 h-4" /> Services sélectionnés ({formData.selectedServices.length})
               </label>
            </div>

            {showCreateService && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-6 animate-in slide-in-from-top-2 shadow-inner">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Détails du nouveau service</h4>
                <div className="grid gap-4 sm:grid-cols-6 items-end">
                  <div className="sm:col-span-3 space-y-1.5 font-sans">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nom du service</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="ex: Design UI/UX" 
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Prix (DH)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={newService.price}
                        onChange={(e) => setNewService({...newService, price: e.target.value})}
                        className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Durée (Jours)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="number" 
                        placeholder="7" 
                        value={newService.duration_days}
                        onChange={(e) => setNewService({...newService, duration_days: e.target.value})}
                        className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Description</label>
                    <div className="relative">
                      <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Brève description..." 
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-6 flex justify-end pt-2">
                    <button 
                      onClick={handleCreateService}
                      className="text-xs font-black bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      Ajouter ce service
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {Array.isArray(formData.selectedServices) && formData.selectedServices.map(s => {
                return (
                  <div
                    key={s.id}
                    className="group flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary text-white">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{s.name}</h4>
                        <div className="flex gap-2">
                           <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{parseFloat(s.price || 0).toLocaleString()} DH</p>
                           <p className="text-[11px] text-slate-400 dark:text-slate-500">• {s.duration_days || 0} Jour(s)</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleService(s)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                      title="Supprimer"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {(!formData.selectedServices || formData.selectedServices.length === 0) && (
                 <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Server className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Aucun service ajouté. Cliquez sur "Ajouter un Service".</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: OFFER SUMMARY */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-10">
                  <Star className="w-32 h-32" />
               </div>
               <div className="relative z-10">
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total du Projet</p>
                  <h3 className="text-4xl font-black mb-4 flex items-baseline gap-2">
                    {(totalPrice || 0).toLocaleString()} 
                    <span className="text-lg opacity-80 uppercase">DH</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                     <span className="flex items-center gap-1.5"><List className="w-3.5 h-3.5" /> {Array.isArray(formData?.selectedServices) ? formData.selectedServices.length : 0} Services</span>
                     <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {totalDuration} Jours (Estimé)</span>
                  </div>
               </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                <Eye className="w-4 h-4" /> Résumé pour le client
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-slate-500">Projet</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white text-right">{formData.name}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-slate-500">Client</span>
                  <span className="text-sm font-bold text-primary text-right">
                    {Array.isArray(clients) ? (clients.find(c => String(c.id) === String(formData.client_id))?.name || "N/A") : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-slate-500">Début</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white text-right">{formData.start_date || "Non défini"}</span>
                </div>
                {estimatedEndDate && (
                  <div className="flex justify-between items-start gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-500 italic">Fin Estimée</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 text-right">{estimatedEndDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Added Services List in Recap */}
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prestations incluses</h4>
                  <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{formData.selectedServices?.length || 0}</span>
               </div>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.selectedServices?.map((s, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-2" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                              <Tag className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">{s.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{s.duration_days || 0} jours</p>
                           </div>
                        </div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                           {parseFloat(s.price || 0).toLocaleString()} <span className="text-[10px] opacity-60">DH</span>
                        </span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between sticky bottom-0 z-10">
        <button
          onClick={handleBack}
          disabled={step === 1 || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <div className="flex items-center gap-3">
           <button
             onClick={onCancel}
             className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
           >
             Annuler
           </button>
           
           {step < 3 ? (
             <button
               onClick={handleNext}
               disabled={loading || (step === 1 && !formData.client_id)}
               className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.05] active:scale-95 group disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100"
             >
               Suivant
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </button>
           ) : (
             <button
               onClick={handleFinalSubmit}
               disabled={loading}
               className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-green-600 text-white text-sm font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-50"
             >
               {loading ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Envoi en cours...
                 </>
               ) : (
                 <>
                   <Send className="w-4 h-4" />
                   Envoyer au client
                 </>
               )}
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
