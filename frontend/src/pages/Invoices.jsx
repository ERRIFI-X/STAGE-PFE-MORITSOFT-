import { Search, Plus, Calendar, FileText, Trash2, Edit2, FolderOpen, User, Eye, Download, Clock, CheckCircle2, AlertCircle, Printer } from "lucide-react";
import useCrud from "../api/api";
import { useState, useMemo } from "react";
import { Modal } from "../components/layout/Modal";
import { FormInvoices } from "../components/elements/FormInvoices";
import { ConfirmModal } from "../components/elements/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export const Invoices = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: invoicesData, loading, error, create, remove, update, refresh } = useCrud("invoices");
  const { data: projectsData } = useCrud("projects");
  const { data: clientsData } = useCrud("clients");

  const invoices = Array.isArray(invoicesData) ? invoicesData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];
  const clients = Array.isArray(clientsData) ? clientsData : [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const project = projects.find(proj => String(proj.id) === String(i.project_id));
      const client = clients.find(c => String(c.id) === String(i.client_id));
      
      const lower = search.toLowerCase();
      const matchesSearch = !search.trim() || 
        project?.name?.toLowerCase().includes(lower) || 
        client?.name?.toLowerCase().includes(lower) ||
        String(i.id).includes(lower);

      const matchesStatus = statusFilter === "all" || i.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, projects, clients, search, statusFilter]);

  // Aggregate stats
  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paidAmount = invoices.filter(i => i.status === "paid").reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const overdueAmount = invoices.filter(i => i.status === "overdue").reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    return {
      total: invoices.length,
      paidCount: invoices.filter(i => i.status === "paid").length,
      overdueCount: invoices.filter(i => i.status === "overdue").length,
      totalAmount,
      paidAmount,
      pendingAmount
    };
  }, [invoices]);

  const handleSubmit = async (invoiceData) => {
    const action = editInvoice ? update(editInvoice.id, invoiceData) : create(invoiceData);
    
    toast.promise(
      action.then(() => {
        refresh();
        setShowForm(false);
        setEditInvoice(null);
      }),
      {
        loading: editInvoice ? "Mise à jour de la facture..." : "Génération de la facture MAD...",
        success: editInvoice ? "Facture mise à jour !" : "Facture officielle générée avec succès !",
        error: (err) => err.message || "Une erreur est survenue lors de l'opération."
      }
    );
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    const loadingToast = toast.loading("Suppression de la facture...");
    try {
      await remove(invoiceToDelete.id);
      refresh();
      setInvoiceToDelete(null);
      toast.success("Facture supprimée avec succès !", { id: loadingToast });
    } catch (err) {
      toast.error(err.message || "Échec de la suppression.", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredInvoices.length) {
      toast.error("Aucune facture à exporter");
      return;
    }
    const headers = ["N Facture", "Projet", "Client", "Montant (MAD)", "Statut", "Date Emission", "Date Echeance"];
    const rows = filteredInvoices.map(i => {
      const proj = projects.find(p => String(p.id) === String(i.project_id));
      const cl = clients.find(c => String(c.id) === String(i.client_id));
      return [
        `"FAC-${String(i.id).padStart(5, '0')}"`,
        `"${(proj?.name || '').replace(/"/g, '""')}"`,
        `"${(cl?.name || '').replace(/"/g, '""')}"`,
        i.amount || 0,
        `"${i.status || ''}"`,
        `"${i.created_at ? i.created_at.slice(0, 10) : ''}"`,
        `"${i.due_date || ''}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `factures_kalyo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportation des factures terminée !");
  };

  const statusConfig = {
    paid: { label: "Payée", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40" },
    overdue: { label: "En retard", classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40" },
    sent: { label: "Envoyée", classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40" },
    draft: { label: "Brouillon", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Comptabilité & Devis MAD
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {filteredInvoices.length} factures</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Factures & Règlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Émission, suivi de solvabilité et impression des factures au format normalisé.
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
            onClick={() => { setEditInvoice(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Facture</span>
          </button>
        </div>
      </div>

      {/* 2. FINANCIAL SUMMARY CHIPS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Facturé</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {summary.totalAmount.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Encaissé</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {summary.paidAmount.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reste à Percevoir</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {summary.pendingAmount.toLocaleString("fr-FR")} <span className="text-xs text-slate-400 font-bold">MAD</span>
          </p>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Toutes" },
            { id: "paid", label: "Payées" },
            { id: "sent", label: "Envoyées" },
            { id: "draft", label: "Brouillons" },
            { id: "overdue", label: "En retard" }
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

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher facture, client, projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Statut & Échéance</th>
                <th className="px-6 py-4 text-right">Montant MAD</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredInvoices.map((invoice) => {
                const project = projects.find(p => String(p.id) === String(invoice.project_id));
                const client = clients.find(c => String(c.id) === String(invoice.client_id));
                const status = statusConfig[invoice.status] || statusConfig.draft;

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

                    {/* Project */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {project?.name || "Projet non spécifié"}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {client?.name || "Client"}
                    </td>

                    {/* Status & Due Date */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.classes}`}>
                          {status.label}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{invoice.due_date ? `Échéance: ${invoice.due_date}` : "Sans échéance"}</span>
                        </p>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white tabular-nums text-sm">
                      {Number(invoice.amount || 0).toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400 font-bold">DH</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/admin/invoices/print/${invoice.id}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Imprimer / Télécharger la facture"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => { setEditInvoice(invoice); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setInvoiceToDelete(invoice)}
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

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Aucune facture trouvée pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <Modal isVisible={showForm} onClose={() => { setShowForm(false); setEditInvoice(null); }}>
        <FormInvoices 
          onSubmit={handleSubmit} 
          onCancel={() => { setShowForm(false); setEditInvoice(null); }} 
          initialData={editInvoice}
          projects={projects}
          clients={clients}
        />
      </Modal>

      <ConfirmModal
        isVisible={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la Facture"
        message="Voulez-vous vraiment supprimer définitivement cette facture ? Cette action modifiera le solde restant du projet."
        itemName={invoiceToDelete ? `FAC-${String(invoiceToDelete.id).padStart(5, '0')}` : ""}
        confirmLabel="Supprimer définitivement"
        loading={isDeleting}
      />
    </div>
  );
};
