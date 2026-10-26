import { useState } from "react";
import { X, FolderOpen, FileText, User, Calendar, AlertCircle } from "lucide-react";

export const FormTask = ({ onSubmit, onCancel, initialData }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    title: initialData?.title || "",
    status: initialData?.status || "pending",
    priority: initialData?.priority || "medium",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
    description: initialData?.description || "",
  });

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Le titre de la tâche est obligatoire";
    
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
        title: true,
        end_date: true
      });
      return;
    }
    onSubmit(isEdit ? { ...initialData, ...form } : form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* MODAL HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEdit ? "Modifier la Tâche" : "Créer une Nouvelle Tâche"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Mettez à jour les détails de la tâche ci-dessous." : "Remplissez les détails pour ajouter une nouvelle tâche."}
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

        {/* Task Title */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <FolderOpen className="w-3.5 h-3.5" />
            Titre de la Tâche
          </label>
          <div className="relative group/field">
            <input
              name="title"
              type="text"
              placeholder="ex: Designer le logo"
              value={form.title}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.title && touched.title ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
            />
            {errors.title && touched.title && (
              <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                <AlertCircle size={18} />
              </div>
            )}
          </div>
          {errors.title && touched.title && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                Priorité
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>

            {/* Status (Only show when editing) */}
            {isEdit && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  Statut
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
            )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
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
              <Calendar className="w-3.5 h-3.5" />
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

        {/* Description */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Décrivez brièvement les objectifs de la tâche..."
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
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
          className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isEdit ? "Enregistrer" : "Créer la Tâche"}
        </button>
      </div>
    </form>
  );
};
