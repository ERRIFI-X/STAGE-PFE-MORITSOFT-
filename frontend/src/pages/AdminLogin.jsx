import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Building2,
  CheckCircle2,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import BrandLogo from "../components/layout/BrandLogo";

export default function AdminLogin() {
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
      newErrors.username = "L'identifiant administrateur est obligatoire";
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

  // Quick Demo Auto-fill for jury: Tester Admin (1 client, 3 projects max, clean)
  const handleDemoFill = () => {
    setForm({ username: "admin_tester", password: "tester123" });
    setTouched({});
    setErrors({});
    toast.success("Compte Testeur Direction chargé (admin_tester / tester123) — 1 Client, 3 Projets max !", { duration: 3500 });
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

      const result = await login(form, "admin");
      if (result.success) {
        toast.success("Connexion Direction réussie !", {
          icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
          style: {
            borderRadius: "16px",
            background: "#0F172A",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "700",
            padding: "16px 24px",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          },
        });
        navigate("/admin/dashboard");
      } else {
        setError(result.error || "Accès refusé. Vérifiez vos identifiants d'administration.");
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
      
      {/* ATMOSPHERIC BACKGROUND MESH - INDIGO/CYAN EXECUTIVE THEME */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px] transition-all duration-700" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-cyan-500/10 dark:bg-cyan-600/15 rounded-full blur-[140px] transition-all duration-700" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
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
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400">Portail Direction Sécurisé</span>
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

      {/* MAIN ADMIN CARD */}
      <main className="relative z-10 w-full max-w-md mx-auto my-6">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-indigo-500/5 dark:shadow-black/60 rounded-3xl p-6 sm:p-9 space-y-7">
          
          {/* HEADER & LOGO */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Link to="/" className="inline-block hover:scale-105 transition-transform" title="Kalyo Home">
              <BrandLogo size="lg" />
            </Link>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Espace Direction &amp; Management</span>
              </span>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
                Connexion Direction
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Supervisez vos équipes, contrôlez la rentabilité et validez les jalons de projet.
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
            {/* Username */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Identifiant Administrateur
                </label>
                {touched.username && errors.username && (
                  <span className="text-[10px] font-bold text-red-500">{errors.username}</span>
                )}
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="ex: admin"
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
                      : "border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/10"
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
                      : "border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/10"
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
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                />
                <span>Mémoriser ma session</span>
              </label>

              <a
                href="mailto:support@kalyo.ma?subject=Support%20Direction%20Kalyo"
                className="hover:text-indigo-600 dark:hover:text-cyan-400 font-semibold transition-colors"
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
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 active:scale-[0.99] hover:shadow-xl"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification des accès...</span>
                </>
              ) : (
                <>
                  <span>Accéder à l'Espace Direction</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-CLICK DEMO FILL */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex flex-col items-center justify-center gap-0.5 shadow-xs"
              title="Pré-remplir avec le compte Testeur Direction (admin_tester / Limité 3 projets)"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>🧪 Testeur : Espace Direction (admin_tester)</span>
              </div>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                1 Client unique (@user_tester) • 3 Projets max • Compte neuf
              </span>
            </button>
          </div>

          {/* DISCRETE LINK TO CLIENT PORTAL */}
          <div className="pt-1 text-center">
            <Link
              to="/login/client"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Vous êtes un client partenaire ?</span>
              <span className="underline font-bold text-emerald-600 dark:text-emerald-400">Portail Client →</span>
            </Link>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-md mx-auto w-full text-center py-2 space-y-2">
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-500" />
            JWT Tokens
          </span>
          <span>•</span>
          <span>Chiffrement Bcrypt</span>
          <span>•</span>
          <span>Kalyo Direction OS</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Kalyo Inc. Plateforme Marocaine de Pilotage de Projets.
        </p>
      </footer>

    </div>
  );
}
