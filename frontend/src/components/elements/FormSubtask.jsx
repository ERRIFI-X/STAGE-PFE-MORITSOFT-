import { useState } from "react";
import { X, FileText, Tag, AlignLeft, AlertCircle } from "lucide-react";

export const FormSubtask = ({ onSubmit, onCancel, initialData }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    status: initialData?.status || "pending",
  });

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Le nom de la sous-tâche est obligatoire";
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
        name: true
      });
      return;
    }
    onSubmit(isEdit ? { ...initialData, ...form } : form);
  };

  const statuses = [
    { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {/* MODAL HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEdit ? "Edit Subtask" : "Create New Subtask"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Update the subtask details below." : "Fill in the details to add a new subtask."}
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

        {/* Subtask Name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <AlignLeft className="w-3.5 h-3.5" />
            Subtask Name
          </label>
          <div className="relative group/field">
            <input
              name="name"
              type="text"
              placeholder="ex: Créer le bouton d'appel"
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

        {/* Status */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" />
            Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm({ ...form, status: s.value })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1 ${
                  form.status === s.value
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${s.color.split(' ')[0]}`} />
                <span className={`text-[10px] font-bold uppercase tracking-tight ${form.status === s.value ? "text-primary" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </button>
            ))}
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
            rows={3}
            placeholder="Briefly describe the subtask goals..."
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
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isEdit ? "Save Changes" : "Create Subtask"}
        </button>
      </div>
    </form>
  );
};
