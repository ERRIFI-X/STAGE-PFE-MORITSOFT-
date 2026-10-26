import { useState, useMemo } from "react";
import { X, User, Mail, Phone, MapPin, Globe, AlertCircle } from "lucide-react";

export const FormClients = ({ onSubmit, onCancel, initialData }) => {
  const isEdit = !!initialData;
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    name: initialData?.name || "",
    username: initialData?.username || "",
    password: "",
    confirmPassword: "", // New field
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
  });

  // Regex Patterns
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const phoneRegex = /^\d{10}$/;

  const validate = (data = form) => {
    const newErrors = {};
    
    // Name Validation
    if (!data.name.trim()) {
      newErrors.name = "Le nom est obligatoire";
    } else if (!nameRegex.test(data.name.trim())) {
      newErrors.name = "Le nom doit contenir uniquement des lettres (2-50 car.)";
    }

    // Email Validation
    if (!data.email.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!emailRegex.test(data.email.trim())) {
      newErrors.email = "Format d'email invalide (ex: example@gmail.com)";
    }

    // Password Validation (Mandatory for New, Optional but strong for Edit)
    if (!isEdit) {
      if (!data.password) {
        newErrors.password = "Le mot de passe est obligatoire";
      } else if (!passwordRegex.test(data.password)) {
        newErrors.password = "Min. 8 car. (1 Maj, 1 Min, 1 Chiffre)";
      }
    } else if (data.password) {
      if (!passwordRegex.test(data.password)) {
        newErrors.password = "Min. 8 car. (1 Maj, 1 Min, 1 Chiffre)";
      }
    }

    // Confirm Password
    if (data.password && data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    // Username (Mandatory for New)
    if (!isEdit && !data.username.trim()) {
      newErrors.username = "L'identifiant est obligatoire";
    }

    // Phone (Optional, but 10 digits if filled)
    if (data.phone && !phoneRegex.test(data.phone.trim())) {
      newErrors.phone = "Le téléphone doit contenir exactement 10 chiffres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check validity for the submit button
  const isFormValid = useMemo(() => {
    const errs = {};
    if (!form.name.trim() || !nameRegex.test(form.name.trim())) errs.name = true;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) errs.email = true;
    if (!isEdit && (!form.password || !passwordRegex.test(form.password))) errs.password = true;
    if (isEdit && form.password && !passwordRegex.test(form.password)) errs.password = true;
    if (form.password !== form.confirmPassword) errs.confirmPassword = true;
    if (!isEdit && !form.username.trim()) errs.username = true;
    if (form.phone && !phoneRegex.test(form.phone.trim())) errs.phone = true;
    
    return Object.keys(errs).length === 0;
  }, [form, isEdit]);

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validate();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    // Real-time validation for touched fields
    if (touched[name] || name === "confirmPassword") {
      validate(newForm);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setTouched({
        name: true,
        email: true,
        username: true,
        password: true,
        confirmPassword: true,
        phone: true
      });
      return;
    }
    
    // Clean data (trim)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    
    if (form.password) payload.password = form.password;

    onSubmit(isEdit ? { ...initialData, ...payload } : payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* MODAL HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEdit ? "Modifier le Client" : "Ajouter un Nouveau Client"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEdit ? "Mettez à jour les informations et accès du client." : "Saisissez les détails et accès du client ci-dessous."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* FORM BODY */}
      <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <User className="w-3 h-3 text-primary" />
                        Nom Complet
                    </label>
                    <div className="relative group/field">
                        <input
                            name="name"
                            type="text"
                            placeholder="Jean Dupont"
                            value={form.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.name && touched.name ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                        />
                        {errors.name && touched.name && (
                            <div className="absolute right-3 top-2.5.5 text-red-500 animate-in zoom-in duration-200">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </div>
                    {errors.name && touched.name && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Mail className="w-3 h-3 text-primary" />
                        Adresse Email
                    </label>
                    <div className="relative group/field">
                        <input
                            name="email"
                            type="email"
                            placeholder="jean@exemple.fr"
                            value={form.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.email && touched.email ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                        />
                        {errors.email && touched.email && (
                            <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </div>
                    {errors.email && touched.email && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.email}</p>}
                </div>
            </div>
        </div>

        <div className="space-y-4 bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                Accès Portail Client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Identifiant
                    </label>
                    <div className="relative group/field">
                        <input
                            name="username"
                            type="text"
                            placeholder="j.dupont"
                            value={form.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.username && touched.username ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'} bg-white dark:bg-slate-800 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none`}
                        />
                        {errors.username && touched.username && (
                            <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </div>
                    {errors.username && touched.username && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.username}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Mot de passe
                    </label>
                    <div className="relative group/field">
                        <input
                            name="password"
                            type="password"
                            placeholder={isEdit ? "•••••••• (laisser vide pour ne pas changer)" : "••••••••"}
                            value={form.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.password && touched.password ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'} bg-white dark:bg-slate-800 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none`}
                        />
                        {errors.password && touched.password && (
                            <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </div>
                    {errors.password && touched.password && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Confirmer le mot de passe
                    </label>
                    <div className="relative group/field">
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.confirmPassword && (touched.confirmPassword || form.confirmPassword) ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'} bg-white dark:bg-slate-800 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none`}
                        />
                        {errors.confirmPassword && (touched.confirmPassword || form.confirmPassword) && (
                            <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </div>
                    {errors.confirmPassword && (touched.confirmPassword || form.confirmPassword) && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.confirmPassword}</p>}
                </div>
            </div>
        </div>

        <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Phone className="w-3 h-3 text-primary" />
                        Numéro de Téléphone
                    </label>
                    <div className="relative group/field">
                        <input
                            name="phone"
                            type="text"
                            placeholder="0612345678"
                            value={form.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone && touched.phone ? 'border-red-500 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700 focus:border-primary'} bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                        />
                        {errors.phone && touched.phone && (
                            <div className="absolute right-3 top-2.5 text-red-500 animate-in zoom-in duration-200">
                                <AlertCircle size={18} />
                            </div>
                        )}
                    </div>
                    {errors.phone && touched.phone && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 ml-1 animate-slide-down flex items-center gap-1">{errors.phone}</p>}
                </div>

                {/* Address */}
                <div className="space-y-1.5 focus-within:scale-[1.01] transition-transform">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-primary" />
                        Adresse
                    </label>
                    <textarea
                        name="address"
                        rows={1}
                        placeholder="Ville, Pays"
                        value={form.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                </div>
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
          disabled={!isFormValid}
          className={`px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-md transition-all ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-primary/90 hover:scale-[1.02] active:scale-95'}`}
        >
          {isEdit ? "Enregistrer" : "Créer le Client"}
        </button>
      </div>
    </form>
  );
};
