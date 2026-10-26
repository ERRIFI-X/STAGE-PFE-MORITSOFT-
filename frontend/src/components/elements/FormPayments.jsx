import { useState } from "react";
import { X, CreditCard, Calendar, FileText, User, FolderOpen, Tag, DollarSign, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import useCrud from "../../api/api";

export const FormPayments = ({ onSubmit, onCancel, initialData, projects: propProjects, clients: propClients }) => {
  const isEdit = !!initialData;
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { data: fetchedProjects } = useCrud("projects");
  const { data: fetchedClients } = useCrud("clients");

  const projects = (propProjects && propProjects.length > 0) 
    ? propProjects 
    : (Array.isArray(fetchedProjects) ? fetchedProjects : []);
  const clients = (propClients && propClients.length > 0) 
    ? propClients 
    : (Array.isArray(fetchedClients) ? fetchedClients : []);

  const [form, setForm] = useState({
    project_id: initialData?.project_id || "",
    amount: initialData?.amount || "",
    payment_date: initialData?.payment_date || new Date().toISOString().split('T')[0],
    payment_method: initialData?.payment_method || "transfer",
    notes: initialData?.notes || "",
  });

  // Automatically find the selected project and its associated client
  const selectedProject = projects.find(p => String(p.id) === String(form.project_id));
  const autoClient = clients.find(c => String(c.id) === String(selectedProject?.client_id));

  const validate = () => {
    const newErrors = {};
    if (!form.project_id) newErrors.project_id = "Veuillez sélectionner un projet";
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = "Le montant doit être supérieur à zero";
    }
    if (!form.payment_date) newErrors.payment_date = "La date est obligatoire";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const resolvedClientId = autoClient?.id || initialData?.client_id;
    if (!validate()) {
      setTouched({
        project_id: true,
        amount: true,
        payment_date: true
      });
      return;
    }
    if (!resolvedClientId) {
      toast.error("Le client associé au projet est introuvable.");
      return;
    }
    
    const submitData = { ...form, client_id: resolvedClientId };
    onSubmit(isEdit ? { ...initialData, ...submitData } : submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* MODAL HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEdit ? "Modifier le Paiement" : "Enregistrer un Nouveau Paiement"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Mettez à jour les détails de la transaction de paiement." : "Saisissez les détails de la transaction ci-dessous."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* FORM BODY */}
      <div className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Project */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <FolderOpen className="w-3.5 h-3.5" />
              Projet
            </label>
            <div className="relative group/field">
            <select
              name="project_id"
              value={form.project_id}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.project_id && touched.project_id ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer`}
            >
              <option value="" disabled className="text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800">
                {projects.length === 0 ? "Aucun projet trouvé — Actualisez ou créez un projet" : "Sélectionner un Projet"}
              </option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 py-1.5">
                  {p.name}
                </option>
              ))}
            </select>
            {errors.project_id && touched.project_id && (
              <div className="absolute right-8 top-2.5 text-red-500 animate-in zoom-in duration-200 pointer-events-none">
                <AlertCircle size={18} />
              </div>
            )}
          </div>
          {errors.project_id && touched.project_id && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.project_id}</p>}
          </div>

          {/* Auto-resolved Client */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              Client Associé
            </label>
            <div className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border ${autoClient ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold' : 'border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400'} text-sm transition-all`}>
              <span>{autoClient ? autoClient.name : "Sélectionnez d'abord un projet"}</span>
              {autoClient && (
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Client Détecté
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" />
              Montant (DH)
            </label>
            <div className="relative group/field">
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.amount && touched.amount ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
              />
              {errors.amount && touched.amount && (
                <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                  <AlertCircle size={18} />
                </div>
              )}
            </div>
            {errors.amount && touched.amount && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Date de Paiement
            </label>
            <div className="relative group/field">
              <input
                name="payment_date"
                type="date"
                value={form.payment_date}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.payment_date && touched.payment_date ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
              />
              {errors.payment_date && touched.payment_date && (
                <div className="absolute right-10 top-2.5 text-red-500 animate-in zoom-in duration-200 pointer-events-none">
                  <AlertCircle size={18} />
                </div>
              )}
            </div>
            {errors.payment_date && touched.payment_date && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.payment_date}</p>}
          </div>
        </div>

        {/* Method */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" />
            Méthode de Paiement
          </label>
          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            <option value="transfer">Virement Bancaire</option>
            <option value="card">Carte Bancaire</option>
            <option value="cash">Espèces</option>
            <option value="check">Chèque</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Numéro de référence, objet..."
            value={form.notes}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      {/* MODAL FOOTER */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-b-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-md hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isEdit ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
};
