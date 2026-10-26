import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import useCrud from "../../api/api";
import { Modal } from "../layout/Modal";
import { FormSubtask } from "../elements/FormSubtask";
import toast from "react-hot-toast";

export const SubtaskList = ({ taskId }) => {
  const { data: subtasksData, loading, error, create, update, remove } = useCrud("subtasks");
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);

  const subtasks = useMemo(() => {
    if (!Array.isArray(subtasksData)) return [];
    return subtasksData.filter(st => String(st.task_id) === String(taskId));
  }, [subtasksData, taskId]);

  const handleCreateSubtask = async (subtaskData) => {
    const loadingToast = toast.loading("Creating subtask...");
    try {
      await create({ ...subtaskData, task_id: taskId });
      setAddingSubtask(false);
      toast.success("Subtask added successfully!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to add subtask", { id: loadingToast });
      console.error(err);
    }
  };

  const handleEditSubtask = async (subtaskData) => {
    const loadingToast = toast.loading("Updating subtask...");
    try {
      await update(subtaskData.id, subtaskData);
      setEditingSubtask(null);
      toast.success("Subtask updated!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to update subtask", { id: loadingToast });
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (id) => {
    if (window.confirm("Are you sure you want to delete this subtask?")) {
      const loadingToast = toast.loading("Deleting subtask...");
      try {
        await remove(id);
        toast.success("Subtask removed", { id: loadingToast });
      } catch (err) {
        toast.error("Failed to delete subtask", { id: loadingToast });
        console.error(err);
      }
    }
  };

  const toggleDetails = (id) => {
    setExpandedSubtaskId(prev => prev === id ? null : id);
  };

  if (loading) return <div className="text-sm text-slate-500 py-2">Loading subtasks...</div>;
  if (error) return <div className="text-sm text-red-500 py-2">{error}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
           Sub-Tasks List
        </h6>
        <button 
          onClick={() => setAddingSubtask(true)}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Add Subtask
        </button>
      </div>

      {subtasks.length === 0 ? (
        <div className="p-10 text-center text-slate-400 bg-slate-50/50 dark:bg-white/5 rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800">
           <p className="text-[11px] font-bold tracking-tight">No subtasks yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {subtasks.map(subtask => (
            <div 
              key={subtask.id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* Subtask Info */}
                <div className="flex-1 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    subtask.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  }`} />
                  <div className="space-y-1">
                    <h5 className="font-black text-slate-800 dark:text-white leading-tight">{subtask.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 leading-tight">
                       {subtask.status === 'completed' ? 'Project Requirement Met' : 'Work in progress'}
                    </p>
                  </div>
                </div>

                {/* Buttons for Subtask */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingSubtask(subtask)}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => toggleDetails(subtask.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      expandedSubtaskId === subtask.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {expandedSubtaskId === subtask.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} 
                    View
                  </button>
                </div>
              </div>

              {/* Subtask Description (Détails) */}
              {expandedSubtaskId === subtask.id && (
                <div className="px-6 py-5 bg-slate-50/30 dark:bg-black/20 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <h6 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Goal Explanation</h6>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {subtask.description || <span className="italic">No detailed documentation provided for this specific sub-goal.</span>}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editing Subtask Modal */}
      <Modal isVisible={editingSubtask !== null} onClose={() => setEditingSubtask(null)}>
        <FormSubtask 
          initialData={editingSubtask}
          onSubmit={handleEditSubtask} 
          onCancel={() => setEditingSubtask(null)} 
        />
      </Modal>

      {/* Adding Subtask (just an extra button from subtask level mapped to the same handler) */}
      <Modal isVisible={addingSubtask} onClose={() => setAddingSubtask(false)}>
        <FormSubtask 
          onSubmit={handleCreateSubtask} 
          onCancel={() => setAddingSubtask(false)} 
        />
      </Modal>
    </div>
  );
};
