import { Search, Plus, Mail, Phone, MoreHorizontal, Trash2, Edit2, MapPin, Download, Users, Briefcase, ExternalLink, ShieldCheck, UserPlus, Sparkles } from "lucide-react";
import useCrud from "../api/api";
import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/layout/Modal";
import { FormClients } from "../components/elements/FormClients";
import { ConfirmModal } from "../components/elements/ConfirmModal";
import toast from "react-hot-toast";

export const Clients = () => {
  const { isTester } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, error, create, remove, update, refresh } = useCrud("clients");
  const { data: projectsData } = useCrud("projects");

  const clients = Array.isArray(data) ? data : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const lower = search.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(lower) || 
      c.email?.toLowerCase().includes(lower) ||
      c.username?.toLowerCase().includes(lower) ||
      c.phone?.includes(lower)
    );
  }, [clients, search]);

  const handleSubmit = async (clientData) => {
    try {
      if (editClient) {
        await update(editClient.id, clientData);
        toast.success("Informations du client mises à jour !");
      } else {
        if (isTester) {
          toast.error("Règle du Testeur : Vous disposez déjà de votre client unique de test (@user_tester).");
          return;
        }
        await create(clientData);
        toast.success("Client créé avec succès ! Identifiants d'accès générés.");
      }
      refresh();
      setShowForm(false);
      setEditClient(null);
    } catch (err) {
      console.error("Opération client échouée", err);
      toast.error(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    const loadingToast = toast.loading("Suppression du compte client...");
    try {
      await remove(clientToDelete.id);
      refresh();
      setClientToDelete(null);
      toast.success("Client supprimé avec succès !", { id: loadingToast });
    } catch (err) { 
      console.error("Échec de la suppression", err);
      toast.error(err.message || "Échec de la suppression", { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredClients.length) {
      toast.error("Aucun client à exporter");
      return;
    }
    const headers = ["ID", "Raison Sociale / Nom", "Identifiant Portail", "Email", "Telephone", "Adresse"];
    const rows = filteredClients.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.username || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clients_kalyo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportation CSV terminée !");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Répertoire Entreprises
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {filteredClients.length} comptes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Annuaire des Clients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gérez vos partenaires, coordonnées de facturation et identifiants du Portail Client.
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

          {isTester ? (
            <button 
              disabled
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-90 shadow-2xs"
              title="Le compte testeur est limité à son client unique (@user_tester)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1 Client unique inclus</span>
            </button>
          ) : (
            <button 
              onClick={() => { setEditClient(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          )}
        </div>
      </div>

      {/* TESTER NOTICE BANNER */}
      {isTester && (
        <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-[11px] uppercase tracking-wide">
              🧪 Règle Testeur
            </span>
            <span className="font-medium">
              Ce profil est configuré avec un client unique par défaut (<strong>@user_tester</strong>) pour vos essais. L'ajout de clients supplémentaires est restreint.
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 whitespace-nowrap">
            1 / 1 Client Actif
          </span>
        </div>
      )}

      {/* 2. SEARCH & SUMMARY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, téléphone ou identifiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
          <span>Total : {clients.length} clients</span>
        </div>
      </div>

      {/* 3. CLIENTS TABLE */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-6 py-4">Client / Entreprise</th>
                <th className="px-6 py-4">Accès Portail</th>
                <th className="px-6 py-4">Contact Direct</th>
                <th className="px-6 py-4">Projets Liés</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredClients.map((client) => {
                const clientProjects = projects.filter(p => String(p.client_id) === String(client.id));

                return (
                  <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    
                    {/* Name & Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary dark:text-indigo-400 flex items-center justify-center font-black text-xs uppercase shrink-0 border border-primary/20">
                          {client.name ? client.name.slice(0, 2) : "CL"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900 dark:text-white truncate">
                              {client.name || "Client sans nom"}
                            </p>
                            {client.username === 'maroc_logistics' && (
                              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Compte Test
                              </span>
                            )}
                          </div>
                          <a 
                            href={`mailto:${client.email}`}
                            className="text-xs text-slate-400 hover:text-primary transition-colors flex items-center gap-1 mt-0.5 truncate"
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>{client.email}</span>
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Portal Credentials Badge */}
                    <td className="px-6 py-4">
                      {client.username ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>@{client.username}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Non configuré
                        </span>
                      )}
                    </td>

                    {/* Phone & Address */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {client.phone ? (
                          <a 
                            href={`tel:${client.phone}`}
                            className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold hover:text-primary transition-colors"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{client.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Téléphone non renseigné</span>
                        )}
                        {client.address && (
                          <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-xs">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{client.address}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Linked Projects */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {clientProjects.length} / 3
                        </span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                          clientProjects.length >= 3 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}>
                          {clientProjects.length >= 3 ? 'Max Atteint' : `${3 - clientProjects.length} disp.`}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditClient(client); setShowForm(true); }} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Modifier les coordonnées"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setClientToDelete(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Supprimer le client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    Aucun client trouvé pour cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <Modal isVisible={showForm} onClose={() => { setShowForm(false); setEditClient(null); }}>
        <FormClients 
          onSubmit={handleSubmit} 
          onCancel={() => { setShowForm(false); setEditClient(null); }} 
          initialData={editClient}
        />
      </Modal>

      <ConfirmModal
        isVisible={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le Client"
        message="Voulez-vous vraiment supprimer définitivement ce compte client ? Ses accès au portail seront instantanément révoqués."
        itemName={clientToDelete?.name}
        confirmLabel="Supprimer définitivement"
        loading={isDeleting}
      />
    </div>
  );
};
