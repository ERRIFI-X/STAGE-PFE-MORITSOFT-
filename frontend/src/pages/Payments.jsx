import { Search, Plus, Calendar, Trash2, Edit2, CreditCard, FolderOpen, User, Download, Building, DollarSign, Wallet } from "lucide-react";
import { ConfirmModal } from "../components/elements/ConfirmModal";
import useCrud from "../api/api";
import { useState, useMemo } from "react";
import { Modal } from "../components/layout/Modal";
import { FormPayments } from "../components/elements/FormPayments";
import { toast } from "react-hot-toast";

export const Payments = () => {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: paymentsData, loading, error, create, remove, update, refresh } = useCrud("payments");
  const { data: projectsData } = useCrud("projects");
  const { data: clientsData } = useCrud("clients");

  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];
  const clients = Array.isArray(clientsData) ? clientsData : [];

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const project = projects.find(proj => String(proj.id) === String(p.project_id));
      const client = clients.find(c => String(c.id) === String(p.client_id));
      const projectName = project?.name || "";
      const clientName = client?.name || "";
      const lower = search.toLowerCase();

      const matchesSearch = !search.trim() || 
        projectName.toLowerCase().includes(lower) || 
        clientName.toLowerCase().includes(lower) ||
        String(p.amount).includes(lower) ||
        (p.notes && p.notes.toLowerCase().includes(lower));

      const matchesMethod = methodFilter === "all" || p.payment_method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [payments, projects, clients, search, methodFilter]);

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [payments]);

  const handleSubmit = async (paymentData) => {
    const action = editPayment ? update(editPayment.id, paymentData) : create(paymentData);
    
    toast.promise(
      action.then(() => {
        refresh();
        setShowForm(false);
        setEditPayment(null);
      }),
      {
        loading: editPayment ? "Mise à jour de l'encaissement..." : "Enregistrement du paiement MAD...",
        success: editPayment ? "Paiement mis à jour !" : "Paiement enregistré et déduit du solde restant !",
        error: (err) => err.message || "Une erreur est survenue lors de l'opération."
      }
    );
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    const loadingToast = toast.loading("Suppression du paiement...");
    try {
      await remove(paymentToDelete.id);
      refresh();
      setPaymentToDelete(null);
      toast.success("Paiement supprimé avec succès !", { id: loadingToast });
    } catch (err) {
      toast.error(err.message || "Échec de la suppression.", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      toast.error("Aucune transaction à exporter");
      return;
    }
    const headers = ["ID", "Projet", "Client", "Montant (MAD)", "Methode", "Date Paiement", "Notes"];
    const rows = filteredPayments.map(p => {
      const proj = projects.find(pr => String(pr.id) === String(p.project_id));
      const cl = clients.find(c => String(c.id) === String(p.client_id));
      return [
        p.id,
        `"${(proj?.name || "").replace(/"/g, '""')}"`,
        `"${(cl?.name || "").replace(/"/g, '""')}"`,
        p.amount || 0,
        `"${p.payment_method || ""}"`,
        `"${p.payment_date || p.created_at || ""}"`,
        `"${(p.notes || "").replace(/"/g, '""')}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `paiements_kalyo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportation des paiements terminée !");
  };

  const methodLabels = {
    transfer: "Virement Bancaire",
    check: "Chèque",
    cash: "Espèces",
    card: "Carte Bancaire",
    other: "Autre"
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
              Trésorerie & Encaissements
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {filteredPayments.length} opérations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Journal des Règlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Historique complet des virements, chèques et encaissements enregistrés en MAD.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all hover:scale-[1.01] active:scale-95"
            title="Exporter en CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>

          <button 
            onClick={() => { setEditPayment(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer Paiement</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI CHIP */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Encaissé en Trésorerie</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {totalCollected.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Tous les paiements saisis mettent à jour le reste dû du projet automatiquement via triggers SQL.
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Payment Method Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Toutes méthodes" },
            { id: "transfer", label: "Virements" },
            { id: "check", label: "Chèques" },
            { id: "cash", label: "Espèces" },
            { id: "card", label: "Cartes" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                methodFilter === tab.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par projet, client ou montant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>

      </div>

      {/* 4. PAYMENTS TABLE */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-6 py-4">Règlement</th>
                <th className="px-6 py-4">Projet & Client</th>
                <th className="px-6 py-4">Mode de Paiement</th>
                <th className="px-6 py-4">Date de Valeur</th>
                <th className="px-6 py-4 text-right">Montant Encaissé</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredPayments.map((payment) => {
                const project = projects.find(p => String(p.id) === String(payment.project_id));
                const client = clients.find(c => String(c.id) === String(payment.client_id));

                return (
                  <tr key={payment.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    
                    {/* Payment Ref */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          PAY-{String(payment.id).padStart(5, '0')}
                        </span>
                      </div>
                    </td>

                    {/* Project & Client */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {project?.name || "Projet associé"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {client?.name || "Client"}
                      </p>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {methodLabels[payment.payment_method] || payment.payment_method || "Virement"}
                      </span>
                    </td>

                    {/* Payment Date */}
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{payment.payment_date || payment.created_at ? (payment.payment_date || payment.created_at).slice(0, 10) : "—"}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                      +{Number(payment.amount || 0).toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400 font-bold">DH</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditPayment(payment); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setPaymentToDelete(payment)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Aucun paiement enregistré pour cette sélection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <Modal isVisible={showForm} onClose={() => { setShowForm(false); setEditPayment(null); }}>
        <FormPayments 
          onSubmit={handleSubmit} 
          onCancel={() => { setShowForm(false); setEditPayment(null); }} 
          initialData={editPayment}
          projects={projects}
          clients={clients}
        />
      </Modal>

      <ConfirmModal
        isVisible={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le Paiement"
        message="Voulez-vous vraiment supprimer cet encaissement ? Le montant sera immédiatement réintégré au solde restant dû du projet."
        itemName={paymentToDelete ? `PAY-${String(paymentToDelete.id).padStart(5, '0')}` : ""}
        confirmLabel="Supprimer définitivement"
        loading={isDeleting}
      />
    </div>
  );
};
