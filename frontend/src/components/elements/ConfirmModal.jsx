import { AlertTriangle, Trash2, X } from "lucide-react";
import { Modal } from "../layout/Modal";

export const ConfirmModal = ({ 
  isVisible, 
  onClose, 
  onConfirm, 
  title = "Confirmer la suppression", 
  message = "Êtes-vous sûr de vouloir supprimer cet élément ?", 
  itemName = "", 
  confirmLabel = "Supprimer", 
  cancelLabel = "Annuler",
  loading = false
}) => {
  return (
    <Modal isVisible={isVisible} onClose={onClose} maxWidth="max-w-[400px]">
      <div className="p-8">
        {/* Header with Icon */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 group animate-in zoom-in-50 duration-500">
            <div className="relative">
              <Trash2 className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
              {itemName && (
                <span className="block mt-2 font-black text-slate-800 dark:text-slate-200">
                  "{itemName}"
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-10">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-red-200 dark:shadow-red-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full h-14 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 flex items-center justify-center"
          >
            {cancelLabel}
          </button>
        </div>

        {/* Warning Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
           <div className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
           Cette action est irréversible
        </div>
      </div>
    </Modal>
  );
};
