import { useState, useEffect, useMemo } from "react";
import { api } from "../../api/api";
import { 
  Receipt, 
  Search, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  FileText,
  Printer,
  Building,
  CreditCard,
  Info,
  DollarSign
} from "lucide-react";
import { Modal } from "../../components/layout/Modal";

export default function UserInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/invoices");
      const list = Array.isArray(res.data?.data) 
        ? res.data.data 
        : (Array.isArray(res.data) ? res.data : []);
      setInvoices(list);
    } catch (error) {
      console.error("Failed to fetch client invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paidInvoices = invoices.filter(i => i.status === "paid");
    const paidAmount = paidInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - paidAmount);

    return {
      total: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: invoices.filter(i => i.status !== "paid").length,
      totalAmount,
      paidAmount,
      pendingAmount
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const lower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm.trim() ||
        inv.project_name?.toLowerCase().includes(lower) ||
        String(inv.id).includes(lower);

      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "paid" ? inv.status === "paid" :
        statusFilter === "pending" ? inv.status !== "paid" : true;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const statusConfig = {
    paid: { label: "Acquittée", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40" },
    sent: { label: "À Régler", classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40" },
    draft: { label: "Brouillon", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" },
    overdue: { label: "En Retard", classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40" }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Chargement de votre relevé de factures...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Comptabilité &amp; Facturation MAD
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {filteredInvoices.length} factures</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Mes Factures &amp; Règlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Téléchargez vos factures certifiées et consultez vos états de compte.
          </p>
        </div>

        {/* Coordonnées Bancaires / RIB Modal trigger */}
        <button
          onClick={() => setShowPaymentInfo(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider shadow-2xs transition-all hover:scale-[1.01] active:scale-95"
        >
          <CreditCard className="w-4 h-4" />
          <span>Instructions de Paiement (RIB)</span>
        </button>
      </div>

      {/* 2. SUMMARY FINANCIAL CHIPS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Facturé</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {summary.totalAmount.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Déjà Réglé</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {summary.paidAmount.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Solde Restant à Régler</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {summary.pendingAmount.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Toutes les Factures" },
            { id: "pending", label: "À Régler (En Attente)" },
            { id: "paid", label: "Acquittées (Payées)" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="N° Facture ou Projet..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>
      </div>

      {/* 4. INVOICES TABLE */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-6 py-4">N° Facture</th>
                <th className="px-6 py-4">Projet Associé</th>
                <th className="px-6 py-4">Date d'Émission</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Montant Net (MAD)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredInvoices.map((invoice) => {
                const status = statusConfig[invoice.status] || statusConfig.sent;
                const isPaid = invoice.status === "paid";

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    
                    {/* Invoice ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          FAC-{String(invoice.id).padStart(5, '0')}
                        </span>
                      </div>
                    </td>

                    {/* Project Name */}
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {invoice.project_name || "Projet associé"}
                    </td>

                    {/* Issued / Due Date */}
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{invoice.due_date ? `Échéance : ${invoice.due_date}` : (invoice.issued_date || "—")}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.classes}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white tabular-nums text-sm">
                      {Number(invoice.amount || 0).toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400 font-bold">DH</span>
                    </td>

                    {/* Direct Print / PDF Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/user/invoices/print/${invoice.id}`, '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF / Imprimer</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Aucune facture trouvée pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. PAYMENT INSTRUCTIONS MODAL */}
      <Modal isVisible={showPaymentInfo} onClose={() => setShowPaymentInfo(false)}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Coordonnées de Règlement &amp; RIB Kalyo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informations bancaires pour vos virements professionnels.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Bénéficiaire</span>
              <span className="font-bold text-slate-900 dark:text-white">KALYO SARL AU</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Banque Partenaire</span>
              <span className="font-bold text-slate-900 dark:text-white">Attijariwafa Bank - Casablanca</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Relevé d'Identité Bancaire (RIB 24 Caractères)</span>
              <span className="font-bold text-primary text-sm select-all">007 780 0001234567890123 45</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Référence de Virement Obligatoire</span>
              <span className="text-slate-600 dark:text-slate-300">Indiquez votre N° de Facture (ex: FAC-00001) dans l'objet du virement.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Votre facture sera automatiquement acquittée dès réception du justificatif par notre service comptabilité.</span>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowPaymentInfo(false)}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
