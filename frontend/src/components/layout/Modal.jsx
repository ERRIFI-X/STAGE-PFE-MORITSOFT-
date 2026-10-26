export const Modal = ({ children, onClose, isVisible, maxWidth = "max-w-lg" }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 w-full ${maxWidth} rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
