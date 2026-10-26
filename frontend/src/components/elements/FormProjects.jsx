import { useState, useEffect } from "react";
import { X, FolderOpen, FileText, Tag, User, AlertCircle } from "lucide-react";
import useCrud from "../../api/api";

export const FormProjects = ({ onSubmit, onCancel, initialData }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const isEdit = !!initialData;
  const { getAll: getClients } = useCrud("clients");
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    status: initialData?.status || "pending",
    client_id: initialData?.client_id || "",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data || []);
      } catch (err) {
        console.error("Échec de la récupération des clients", err);
      }
    };
    fetchClients();
  }, [getClients]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Le nom du projet est requis";
    if (!form.client_id) newErrors.client_id = "Veuillez sélectionner un client";
    
    if (form.start_date && form.end_date) {
      if (new Date(form.start_date) > new Date(form.end_date)) {
        newErrors.end_date = "La date de fin doit être après la date de début";
      }
    }

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
    if (!validate()) {
      setTouched({
        name: true,
        client_id: true,
        end_date: true
      });
      return;
    }
    onSubmit(isEdit ? { ...initialData, ...form } : form);
  };

  const statuses = [
    { value: "pending", label: "En attente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { value: "in_progress", label: "En cours", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
    { value: "completed", label: "Terminé", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { value: "cancelled", label: "Annulé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {/* MODAL HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEdit ? "Modifier le Projet" : "Créer un Nouveau Projet"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Mettez à jour les détails du projet ci-dessous." : "Remplissez les détails pour commencer."}
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

        {/* Client Selection */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <User className="w-3.5 h-3.5" />
            Client
          </label>
          <div className="relative group/field">
            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.client_id && touched.client_id ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer`}
            >
              <option value="">Sélectionner un Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.client_id && touched.client_id && (
              <div className="absolute right-8 top-2.5 text-red-500 animate-in zoom-in duration-200 pointer-events-none">
                <AlertCircle size={18} />
              </div>
            )}
          </div>
          {errors.client_id && touched.client_id && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.client_id}</p>}
        </div>

        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <FolderOpen className="w-3.5 h-3.5" />
            Nom du Projet
          </label>
          <div className="relative group/field">
            <input
              name="name"
              type="text"
              placeholder="ex: Refonte du site web"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.name && touched.name ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
            />
            {errors.name && touched.name && (
              <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                <AlertCircle size={18} />
              </div>
            )}
          </div>
          {errors.name && touched.name && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Décrivez brièvement les objectifs du projet..."
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Dates row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Date de début
            </label>
            <input
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Date de fin
            </label>
            <div className="relative group/field">
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.end_date && touched.end_date ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
              />
              {errors.end_date && touched.end_date && (
                <div className="absolute right-10 top-2.5 text-red-500 animate-in zoom-in duration-200 pointer-events-none">
                  <AlertCircle size={18} />
                </div>
              )}
            </div>
            {errors.end_date && touched.end_date && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.end_date}</p>}
          </div>
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
          className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isEdit ? "Enregistrer" : "Créer le Projet"}
        </button>
      </div>
    </form>
  );
};
