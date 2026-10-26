import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { 
  Search, 
  Bell, 
  Menu, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Loader2, 
  Send, 
  Eye, 
  Sun, 
  Moon,
  FolderKanban,
  Users,
  Receipt,
  CreditCard,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export const Header = ({ onToggleSidebar, isDark, setIsDark }) => {
  const { logout, user, isAdmin, isClient } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingNoteId, setRejectingNoteId] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState({});

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/notifications?user_id=${user.id}&role=${user.role || (isAdmin ? "admin" : "client")}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications?id=${id}&user_id=${user.id}&role=${user.role || (isAdmin ? "admin" : "client")}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications?mark_all=true&user_id=${user.id}&role=${user.role || (isAdmin ? "admin" : "client")}`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const extractProjectId = (message) => {
    const match = message?.match(/\[project_id:(\d+)\]/);
    return match ? match[1] : null;
  };

  const cleanMessage = (message) => {
    return message?.replace(/\s*\[(project_id|invoice_id):\d+\]/, '') || '';
  };

  const extractInvoiceId = (message) => {
    const match = message?.match(/\[invoice_id:(\d+)\]/);
    return match ? match[1] : null;
  };

  const handleConfirmProject = async (notifId, projectId) => {
    setActionLoading(notifId);
    try {
      await api.put(`/projects?id=${projectId}&confirm=true`);
      await markAsRead(notifId);
      toast.success('Projet confirmé avec succès !');
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la confirmation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProject = async (notifId, projectId, projectName) => {
    const note = rejectionNotes[notifId] || 'Aucune note fournie.';
    setActionLoading(notifId);
    try {
      await api.put(`/projects?id=${projectId}&reject=true`, { note });
      await markAsRead(notifId);
      toast.success('Projet refusé, Admin notifié. ❌');
      setRejectingNoteId(null);
      fetchNotifications();
    } catch (err) {
      const backendError = err.response?.data?.error || err.message;
      toast.error(`Erreur: ${backendError}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (isAdmin) {
      navigate(`/admin/projects?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/user/projects?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-between">
      
      {/* LEFT: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button 
          onClick={onToggleSidebar} 
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isAdmin ? "Rechercher projets, clients, factures..." : "Rechercher mes projets..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-slate-100"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
            ↵
          </kbd>
        </form>
      </div>

      {/* RIGHT: Actions, Notifications, Theme & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Quick Create Dropdown for Admin */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowQuickCreate(!showQuickCreate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Créer</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showQuickCreate && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickCreate(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    to="/admin/projects?new=1"
                    onClick={() => setShowQuickCreate(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <FolderKanban className="w-4 h-4 text-primary" />
                    <span>Nouveau Projet</span>
                  </Link>
                  <Link
                    to="/admin/clients"
                    onClick={() => setShowQuickCreate(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Nouveau Client</span>
                  </Link>
                  <Link
                    to="/admin/invoices"
                    onClick={() => setShowQuickCreate(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Receipt className="w-4 h-4 text-indigo-500" />
                    <span>Émettre Facture</span>
                  </Link>
                  <Link
                    to="/admin/payments"
                    onClick={() => setShowQuickCreate(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    <span>Enregistrer Paiement</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          title={isDark ? "Mode clair" : "Mode sombre"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-xl transition-colors ${
              showNotifications 
                ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[440px] animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Centre de Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-primary text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider transition-colors"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Aucune notification pour le moment.
                    </div>
                  ) : (
                    notifications.map(note => {
                      const projectId = extractProjectId(note.message);
                      const displayMessage = cleanMessage(note.message);
                      const isProjectNotif = !isAdmin && !!projectId && !note.is_read;
                      const isShowingNote = rejectingNoteId === note.id;

                      return (
                        <div 
                          key={note.id} 
                          className={`p-3.5 flex gap-3 transition-colors relative group/note ${
                            !note.is_read ? 'bg-primary/5 dark:bg-primary/10' : 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {note.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                             note.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-500" /> :
                             note.type === 'error' ? <X className="w-4 h-4 text-rose-500" /> :
                             <Info className="w-4 h-4 text-primary" />}
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                              {displayMessage}
                            </p>

                            {/* Yes/No Buttons for project notifications */}
                            {isProjectNotif && !isShowingNote && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleConfirmProject(note.id, projectId)}
                                  disabled={actionLoading === note.id}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 disabled:opacity-60"
                                >
                                  {actionLoading === note.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                                  <span>Confirmer</span>
                                </button>
                                <button
                                  onClick={() => setRejectingNoteId(note.id)}
                                  disabled={actionLoading === note.id}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 disabled:opacity-60"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                  <span>Refuser</span>
                                </button>
                              </div>
                            )}

                            {/* View Invoice Button */}
                            {!!extractInvoiceId(note.message) && !note.is_read && (
                              <div className="flex gap-2 pt-1">
                                <Link
                                  to={isAdmin ? "/admin/invoices" : "/user/invoices"}
                                  onClick={() => markAsRead(note.id)}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Voir Facture</span>
                                </Link>
                              </div>
                            )}

                            {/* Rejection note input */}
                            {isProjectNotif && isShowingNote && (
                              <div className="space-y-2 pt-1">
                                <textarea
                                  value={rejectionNotes[note.id] || ''}
                                  onChange={(e) => setRejectionNotes(prev => ({ ...prev, [note.id]: e.target.value }))}
                                  placeholder="Motif du refus..."
                                  className="w-full h-16 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-rose-500 resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setRejectingNoteId(null)}
                                    className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => {
                                      const projectName = displayMessage.match(/"([^"]+)"/);
                                      handleRejectProject(note.id, projectId, projectName?.[1] || 'Projet');
                                    }}
                                    disabled={actionLoading === note.id}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all active:scale-95 disabled:opacity-60"
                                  >
                                    {actionLoading === note.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    <span>Transmettre</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {new Date(note.created_at).toLocaleDateString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-2 shrink-0">
                            {!note.is_read && (
                              <button 
                                onClick={() => markAsRead(note.id)}
                                className="h-2 w-2 rounded-full bg-primary hover:scale-150 transition-transform"
                                title="Marquer comme lu"
                              />
                            )}
                            <button 
                              onClick={async () => {
                                try {
                                  await api.delete(`/notifications?id=${note.id}`);
                                  setNotifications(prev => prev.filter(n => n.id !== note.id));
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="opacity-0 group-hover/note:opacity-100 text-slate-400 hover:text-rose-500 transition-all mt-auto"
                              title="Supprimer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Button & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{user?.name || "Admin"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isAdmin ? "Direction" : "Client"}</p>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.username ? `@${user.username}` : user?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    logout();
                    navigate(isClient ? "/login/client" : "/login/admin");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors text-left mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
