import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  Users, 
  Receipt, 
  FolderKanban, 
  Clock, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  Eye, 
  FileCheck2, 
  Send,
  Terminal,
  Activity,
  TrendingUp,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/layout/BrandLogo";

/**
 * Animated Number Counter
 * Starts animating smoothly from 0 to target value ONLY when scrolled into viewport
 */
function AnimatedNumber({ value, duration = 1600, suffix = "", prefix = "", decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp = null;
    let frameId;
    const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = ease * numericValue;

      setDisplayValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(numericValue);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, value, duration, decimals]);

  const formattedValue = decimals > 0 
    ? displayValue.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : displayValue.toLocaleString("fr-FR");

  return (
    <span ref={elementRef} className="tabular-nums inline-block">
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

/**
 * ScrollReveal Component
 * Smooth, lightweight entrance animation triggered as soon as the user scrolls to it.
 * Direction can be 'left' (slides from left), 'right' (slides from right),
 * 'top' (slides down from top), or 'up' (slides up from bottom).
 */
function ScrollReveal({ 
  children, 
  direction = "up", 
  delay = 0, 
  duration = 650, 
  className = "" 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    if (isVisible) return "translate-x-0 translate-y-0 opacity-100";
    switch (direction) {
      case "left":
        return "-translate-x-12 translate-y-0 opacity-0";
      case "right":
        return "translate-x-12 translate-y-0 opacity-0";
      case "top":
      case "down":
        return "translate-x-0 -translate-y-8 opacity-0";
      case "up":
      default:
        return "translate-x-0 translate-y-8 opacity-0";
    }
  };

  return (
    <div
      ref={domRef}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      className={`transition-all transform will-change-transform ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();

  // Dark mode state synced with document & localStorage
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

  // Interactive Perspective Tabs (Direction vs Équipe vs Client)
  const [activeTab, setActiveTab] = useState("admin");

  const perspectives = {
    admin: {
      tag: "Direction & Chefs de Projets",
      title: "Pilotage stratégique, rentabilité et vision 360°",
      description: "Supervisez l'ensemble du portefeuille d'affaires, suivez en temps réel la trésorerie engagée vs recouvrée, et anticipez les retards de livraison grâce aux alertes automatiques.",
      kpis: [
        { label: "Taux de Recouvrement", val: 94.2, suffix: "%", decimals: 1 },
        { label: "Marge Opérationnelle", val: 28, prefix: "+", suffix: "%" },
        { label: "Projets Déployés", val: 100, suffix: "%" }
      ],
      features: [
        "Dashboard décisionnel avec ventilation du budget total vs reste à percevoir",
        "Génération de factures et devis normalisés MAD conformes à la législation",
        "Assignation dynamique des services, délais et estimations financières",
        "Journal d'audit et traçabilité inviolable de chaque interaction"
      ]
    },
    team: {
      tag: "Équipes Opérationnelles",
      title: "Exécution fluide, sous-tâches et gestion des priorités",
      description: "Découpez chaque projet en services et chaque service en tâches précises. Mettez à jour vos statuts de réalisation en un clic et maintenez une cadence sans friction.",
      kpis: [
        { label: "Vélocité Sprint", val: 4.8, suffix: "/5", decimals: 1 },
        { label: "Tâches Réalisées", val: 142 },
        { label: "Temps Gagné / Semaine", val: 12, suffix: "h" }
      ],
      features: [
        "Checklist granulaire avec sous-tâches, priorités et échéances",
        "Mise à jour automatique des statuts en retard (overdue) sans saisie manuelle",
        "Attribution claire des responsabilités par module et livrable",
        "Interface épurée et sans distraction adaptée au mode sombre"
      ]
    },
    client: {
      tag: "Portail Client Collaboratif",
      title: "Transparence totale, validation d'offres et historique",
      description: "Offrez à vos clients un espace dédié sécurisé. Ils valident les propositions de projets, consultent l'état d'avancement des développements et téléchargent leurs factures acquittées.",
      kpis: [
        { label: "Satisfaction Client", val: 99, suffix: "%" },
        { label: "Délai de Validation", val: 24, prefix: "< ", suffix: "h" },
        { label: "Accès Sécurisé", text: "24/7" }
      ],
      features: [
        "Validation en direct ou refus motivé des devis avec notifications instantanées",
        "Consultation en temps réel du pourcentage d'avancement de leur projet",
        "Impression et téléchargement des factures au format professionnel",
        "Échanges transparents et zéro litige sur le périmètre contractuel"
      ]
    }
  };

  const current = perspectives[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 selection:bg-primary selection:text-white">
      
      {/* 1. FLOATING NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 pb-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3.5 px-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-85 transition-opacity">
            <BrandLogo size="md" />
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#perspectives" className="hover:text-primary transition-colors">Expérience Métier</a>
            <a href="#architecture" className="hover:text-primary transition-colors">Architecture</a>
            <a href="#stats" className="hover:text-primary transition-colors">Métriques</a>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
              title={isDark ? "Mode Clair" : "Mode Sombre"}
              aria-label="Basculer le thème"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate(isClient ? "/user/dashboard" : "/admin/dashboard")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Mon Espace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login/client")}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Accès dédié aux clients pour consulter livrables et factures"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Portail Client</span>
                </button>
                <button
                  onClick={() => navigate("/login/admin")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                  title="Accès dédié à la direction et gestion de projets"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Connexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (B2B SAAS ASYMMETRIC 2-COLUMN DESIGN) */}
      <section className="relative pt-12 pb-10 md:pt-16 md:pb-14 px-6 bg-[#F8FAFC] dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        {/* Ultra-subtle crisp 1px grid pattern (Stripe / Linear precision) */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 85% 65% at 50% 30%, #000 65%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 65% at 50% 30%, #000 65%, transparent 100%)'
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: Executive Copy & Clean CTAs with smooth slide-in animation */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
              
              {/* Headline - Smooth slide from the left */}
              <ScrollReveal direction="left" delay={50}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                  Pilotez vos projets, de l'offre initiale au règlement final.
                </h1>
              </ScrollReveal>

              {/* Subheadline - Staggered slide from the left */}
              <ScrollReveal direction="left" delay={150}>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-xl">
                  Centralisez vos clients, cadrez vos tâches avec précision, automatisez vos factures en Dirhams (MAD) et offrez à vos clients un portail d'approbation transparent.
                </p>
              </ScrollReveal>

              {/* Action Buttons - Slide from above/top */}
              <ScrollReveal direction="top" delay={250}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate("/login/admin")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Accéder à l'Espace Direction</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate("/login/client")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Espace Portail Client</span>
                  </button>
                </div>

                {/* Direct 1-Click Tester Access */}
                <div className="pt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400">Accès Testeurs :</span>
                  <button
                    onClick={() => navigate("/login/admin")}
                    className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="1 Client unique • 3 Projets max • Compte neuf"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Admin Testeur (@admin_tester)</span>
                  </button>
                  <button
                    onClick={() => navigate("/login/client")}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Client associé pour tester la validation et les factures"
                  >
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span>Client Testeur (@user_tester)</span>
                  </button>
                </div>
              </ScrollReveal>

              {/* Left-Aligned Trust Indicators - Smooth fade and slide up */}
              <ScrollReveal direction="up" delay={350}>
                <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    Fiscalité marocaine (MAD)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    Authentification JWT sécurisée
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    Exports CSV comptables
                  </span>
                </div>
              </ScrollReveal>

            </div>

            {/* RIGHT COLUMN: Interactive Realistic Financial Telemetry Card with slide from right */}
            <ScrollReveal direction="right" delay={150} className="lg:col-span-5 relative w-full max-w-lg lg:max-w-none mx-auto">
              
              {/* Product Card Container */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-6 space-y-5">
                
                {/* Card Header: "Derniers Règlements" */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Derniers Règlements</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Flux de facturation en direct</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Encaissé</span>
                  </div>
                </div>

                {/* KPI & Mini Bar Chart (Cash Flow) */}
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-3 text-left">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Recouvré (Mois)</span>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                        185 000 <span className="text-sm font-normal text-slate-500">MAD</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+12.4%</span>
                    </div>
                  </div>

                  {/* Weekly mini bar chart */}
                  <div className="pt-2">
                    <div className="flex items-end justify-between gap-2 h-14">
                      {[
                        { day: "L", val: 35 },
                        { day: "M", val: 55 },
                        { day: "M", val: 40 },
                        { day: "J", val: 80 },
                        { day: "V", val: 65 },
                        { day: "S", val: 95, active: true },
                        { day: "D", val: 30 }
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <div 
                            className={`w-full rounded-xs transition-all duration-300 ${
                              bar.active 
                                ? "bg-emerald-600 dark:bg-emerald-500" 
                                : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                            }`}
                            style={{ height: `${bar.val}%` }}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2 text-left">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold block">
                    Transactions récentes
                  </span>
                  
                  {/* Invoice Row 1: Facture #2026-08 — Société Alpha — 18,500 MAD (Payée) */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono text-xs font-semibold">
                        #08
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Facture #2026-08</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-slate-600 dark:text-slate-400">Société Alpha</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Virement bancaire validé</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                        18 500 MAD
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        Payée
                      </span>
                    </div>
                  </div>

                  {/* Invoice Row 2: Secondary real-world invoice */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono text-xs font-semibold">
                        #09
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Facture #2026-09</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-slate-600 dark:text-slate-400">Atlas Industrie SA</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Acompte de démarrage</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                        34 200 MAD
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        Payée
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Micro Telemetry */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Rapprochement bancaire actif
                  </span>
                  <span className="font-mono text-slate-500">Devise : MAD (Dirham)</span>
                </div>

              </div>

              {/* Floating Status Chip: Taux de Recouvrement 94.2% */}
              <div className="hidden sm:flex items-center gap-2.5 absolute -bottom-4 -left-4 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg text-xs text-slate-700 dark:text-slate-300">
                <div className="h-6 w-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[11px] leading-tight text-slate-900 dark:text-white">Taux de Recouvrement</p>
                  <p className="text-[10px] text-slate-500">94.2% dans les échéances</p>
                </div>
              </div>

            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* 4. STATS & PROOF BAR (AVEC COMPTEUR ANIMÉ DU 0 AU CHIFFRE CIBLE AU SCROLL) */}
      <section id="stats" className="py-12 border-y border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <ScrollReveal direction="up" delay={50} className="group transition-transform hover:-translate-y-1">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedNumber value={100} suffix="%" />
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Traçabilité &amp; Logs</p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} className="group transition-transform hover:-translate-y-1">
            <p className="text-3xl sm:text-4xl font-black text-primary">
              <AnimatedNumber value={99.9} decimals={1} suffix="%" />
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Disponibilité Système</p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} className="group transition-transform hover:-translate-y-1">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedNumber value={3} suffix="x" />
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Émission Devis / Facture</p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={350} className="group transition-transform hover:-translate-y-1">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
              MAD
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Devise &amp; Fiscalité Locale</p>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. THE GAPLESS BENTO GRID (INTEREST) */}
      <section id="features" className="py-24 px-6 max-w-5xl mx-auto space-y-12">
        <ScrollReveal direction="top" delay={50} className="text-center space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Modules Intégrés</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Une architecture conçue pour la rigueur opérationnelle
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Chaque brique répond à un besoin critique dans le cycle de vie d'un projet d'ingénierie logicielle ou d'agence.
          </p>
        </ScrollReveal>

        {/* Bento Grid: 3 cols, dense packing, mathematically complete */}
        <div className="grid grid-cols-1 md:grid-cols-3 grid-flow-dense gap-6">
          
          {/* Bento Card 1: Large (Col Span 2) - Slides in from left */}
          <ScrollReveal direction="left" delay={100} className="md:col-span-2">
            <div className="h-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    Workflow
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Orchestration des Projets &amp; Wizard Multi-Étapes
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Créez des projets structurés avec sauvegarde automatique des brouillons en cas d'imprévu. Décomposez vos projets en services tarifés et assignez les délais d'exécution avec calcul dynamique du budget.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Auto-détection des retards (`overdue`)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Temps Réel</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Bento Card 2: Normal (Col Span 1) - Slides in from right */}
          <ScrollReveal direction="right" delay={150} className="md:col-span-1 h-full">
            <div className="h-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-6">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Devis &amp; Facturation
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Transformation instantanée des devis en factures d'acompte ou de solde. Impression PDF prête pour la comptabilité.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>Conforme MAD</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </ScrollReveal>

          {/* Bento Card 3: Normal (Col Span 1) - Slides in from left */}
          <ScrollReveal direction="left" delay={150} className="md:col-span-1 h-full">
            <div className="h-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Portail Client Sécurisé
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Chaque client dispose d'un accès dédié pour valider les offres, motiver les refus et suivre l'avancement en toute sérénité.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Zéro litige contractuel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </ScrollReveal>

          {/* Bento Card 4: Large (Col Span 2) - Slides in from right */}
          <ScrollReveal direction="right" delay={200} className="md:col-span-2">
            <div className="h-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-primary/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    Sécurité &amp; Audit
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Sécurité Robuste &amp; Exports Données
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Authentification par jetons cryptographiques JWT avec expiration, protection absolue contre les injections SQL par PDO préparé, et exportation instantanée de vos données (Clients, Factures, Projets) au format standard CSV.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>JWT Bearer</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Activity Logs</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 col-span-2 sm:col-span-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export CSV</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 6. INTERACTIVE EXPERIENCE / PERSPECTIVES (DESIRE) */}
      <section id="perspectives" className="py-24 border-t border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <ScrollReveal direction="top" delay={50} className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-primary">Trois Vues, Une Seule Vérité</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Une expérience sur mesure pour chaque intervenant
            </h2>
          </ScrollReveal>

          {/* Tab Switcher */}
          <ScrollReveal direction="up" delay={100} className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              {[
                { id: "admin", label: "Direction & Admin", icon: Zap },
                { id: "team", label: "Équipes Projet", icon: Layers },
                { id: "client", label: "Espace Client", icon: Users }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : ""}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Perspective Content Card */}
          <ScrollReveal direction="up" delay={150}>
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                
                {/* Left Column: Info & Checklist */}
                <ScrollReveal direction="left" delay={100} className="space-y-6">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                      {current.tag}
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      {current.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                      {current.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {current.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                {/* Right Column: Key KPI Metrics */}
                <ScrollReveal direction="right" delay={200} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Indicateurs Clés de Performance (KPI)
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    {current.kpis.map((kpi, i) => (
                      <div key={`${activeTab}-${i}`} className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xl sm:text-2xl font-black text-primary">
                          {kpi.text ? (
                            kpi.text
                          ) : (
                            <AnimatedNumber 
                              value={kpi.val} 
                              suffix={kpi.suffix || ""} 
                              prefix={kpi.prefix || ""} 
                              decimals={kpi.decimals || 0}
                              duration={1200}
                            />
                          )}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate(activeTab === "client" ? "/login/client" : "/login/admin")}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.01] active:scale-95"
                    >
                      <span>Ouvrir cette interface</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </ScrollReveal>

              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 7. FINAL HIGH-CONTRAST CTA (ACTION) */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <ScrollReveal direction="up" delay={100}>
          <div className="relative rounded-3xl bg-slate-900 text-white p-10 sm:p-16 overflow-hidden shadow-2xl">
            {/* Subtle Radial Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-slate-300 border border-white/10">
                Projet de Fin d'Études (PFE)
              </span>
              <ScrollReveal direction="left" delay={150}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Prêt à découvrir Kalyo en action ?
                </h2>
              </ScrollReveal>
              <ScrollReveal direction="left" delay={200}>
                <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                  Connectez-vous avec vos identifiants ou testez l'espace portail client pour explorer la gestion collaborative des projets.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={250} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => navigate("/login/admin")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Accès Espace Direction</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate("/login/client")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all"
                >
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>Accès Espace Client</span>
                </button>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 8. MINIMALIST FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-12 px-6 text-xs text-slate-400">
        <ScrollReveal direction="up" delay={50} className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="xs" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Système de Gestion de Projet &amp; Finance PFE</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Systèmes Opérationnels
            </span>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/login/client")} className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                Portail Client
              </button>
              <button onClick={() => navigate("/login/admin")} className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                Espace Direction
              </button>
            </div>
          </div>
        </ScrollReveal>
      </footer>

    </div>
  );
}
