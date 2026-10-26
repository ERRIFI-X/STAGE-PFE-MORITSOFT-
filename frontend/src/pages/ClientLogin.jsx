import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Users,
  CheckCircle2,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import BrandLogo from "../components/layout/BrandLogo";

export default function ClientLogin() {
  const { login, isAuthenticated, isClient } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Theme Sync
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isClient) navigate("/user/dashboard");
      else navigate("/admin/dashboard");
    }
  }, [isAuthenticated, isClient, navigate]);

  const validate = (data = form) => {
    const newErrors = {};
    if (!data.username.trim()) {
      newErrors.username = "L'identifiant ou email client est obligatoire";
    }
    if (!data.password) {
      newErrors.password = "Le mot de passe est obligatoire";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = useMemo(() => {
    return form.username.trim() !== "" && form.password.length >= 1;
  }, [form]);

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    validate();
  };

  // Quick Tester Client Auto-fill
  const handleTesterClientFill = () => {
    setForm({ username: "user_tester", password: "tester123" });
    setTouched({});
    setErrors({});
    toast.success("Compte Testeur Client chargé (user_tester / tester123) !", { duration: 3000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!validate()) {
        setTouched({ username: true, password: true });
        setLoading(false);
        return;
      }

      const result = await login(form, "client");
      if (result.success) {
        toast.success("Bienvenue dans votre Espace Client !", {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          style: {
            borderRadius: "16px",
            background: "#0F172A",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "700",
            padding: "16px 24px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          },
        });
        navigate("/user/dashboard");
      } else {
        setError(result.error || "Accès refusé. Vérifiez vos identifiants client.");
        toast.error("Identifiants Invalides");
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Échec de l'authentification. Vérifiez le serveur.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden font-sans">
      
      {/* ATMOSPHERIC BACKGROUND MESH - EMERALD/TEAL CLIENT THEME */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-[140px] transition-all duration-700" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-teal-500/10 dark:bg-teal-600/15 rounded-full blur-[140px] transition-all duration-700" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
        >
          <span>←</span>
          <span>Retour au site Kalyo</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400">Portail Client Sécurisé</span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all hover:scale-105"
            title={isDark ? "Mode Clair" : "Mode Sombre"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN CLIENT CARD */}
      <main className="relative z-10 w-full max-w-md mx-auto my-6">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-emerald-500/5 dark:shadow-black/60 rounded-3xl p-6 sm:p-9 space-y-7">
          
          {/* HEADER & LOGO */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Link to="/" className="inline-block hover:scale-105 transition-transform" title="Kalyo Home">
              <BrandLogo size="lg" />
            </Link>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Portail Partenaire Client</span>
              </span>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
                Espace Client
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Suivez vos livrables en temps réel et validez vos factures en toute transparence.
              </p>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium rounded-2xl border border-red-200 dark:border-red-900/60 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Identifiant ou Email Client
                </label>
                {touched.username && errors.username && (
                  <span className="text-[10px] font-bold text-red-500">{errors.username}</span>
                )}
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="ex: jean.dupont ou client@entreprise.com"
                  value={form.username}
                  onChange={(e) => {
                    const next = { ...form, username: e.target.value };
                    setForm(next);
                    if (touched.username) validate(next);
                  }}
                  onBlur={handleBlur}
                  className={`w-full h-12 bg-slate-50 dark:bg-slate-800/60 border rounded-2xl pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all ${
                    errors.username && touched.username
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500/10"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Mot de Passe
                </label>
                {touched.password && errors.password && (
                  <span className="text-[10px] font-bold text-red-500">{errors.password}</span>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => {
                    const next = { ...form, password: e.target.value };
                    setForm(next);
                    if (touched.password) validate(next);
                  }}
                  onBlur={handleBlur}
                  className={`w-full h-12 bg-slate-50 dark:bg-slate-800/60 border rounded-2xl pl-11 pr-12 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all ${
                    errors.password && touched.password
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-700/80 focus:border-emerald-500 focus:ring-emerald-500/10"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-800"
                />
                <span>Mémoriser ma session</span>
              </label>

              <a
                href="mailto:support@kalyo.ma?subject=Support%20Portail%20Client%20Kalyo"
                className="hover:text-emerald-600 dark:hover:text-cyan-400 font-semibold transition-colors"
              >
                Aide &amp; Support ?
              </a>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full h-12 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 ${
                !isFormValid
                  ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 active:scale-[0.99] hover:shadow-xl"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification des accès...</span>
                </>
              ) : (
                <>
                  <span>Accéder à mon Espace Client</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-CLICK DEMO FILL */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={handleTesterClientFill}
              className="w-full py-2.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex flex-col items-center justify-center gap-0.5 shadow-xs"
              title="Pré-remplir avec le compte Client Testeur (user_tester / tester123)"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>🧪 Testeur : Portail Client (user_tester)</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Compte Client associé à l'Admin Testeur
              </span>
            </button>
          </div>

          {/* DISCRETE LINK TO DIRECTION PORTAL */}
          <div className="pt-1 text-center">
            <Link
              to="/login/admin"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Vous faites partie de la direction ?</span>
              <span className="underline font-bold text-indigo-600 dark:text-indigo-400">Espace Direction →</span>
            </Link>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-md mx-auto w-full text-center py-2 space-y-2">
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            JWT Tokens
          </span>
          <span>•</span>
          <span>Chiffrement Bcrypt</span>
          <span>•</span>
          <span>Kalyo Client Portal</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Kalyo Inc. Portail Partenaire Client.
        </p>
      </footer>

    </div>
  );
}
