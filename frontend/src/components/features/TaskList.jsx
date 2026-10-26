import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, User, Calendar, Lock, FileText, Shapes, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useCrud from "../../api/api";
import { Modal } from "../layout/Modal";
import { FormTask } from "../elements/FormTask";
import toast from "react-hot-toast";

export const TaskList = ({ tasks = [], serviceId, projectId, onRefresh }) => {
  const { isClient } = useAuth();
  const { create: createTask, update, remove, loading, error } = useCrud("tasks");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.id === expandedTaskId);
  }, [tasks, expandedTaskId]);

  const handleCreateTask = async (taskData) => {
    const loadingToast = toast.loading("Création de la tâche...");
    try {
      await createTask({ ...taskData, service_id: serviceId });
      setShowTaskForm(false);
      toast.success("Tâche créée avec succès !", { id: loadingToast });
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Échec de la création de la tâche", { id: loadingToast });
      console.error(err);
    }
  };

  const handleEditTask = async (taskData) => {
    const loadingToast = toast.loading("Mise à jour de la tâche...");
    try {
      await update(taskData.id, taskData);
      setEditingTask(null);
      toast.success("Tâche mise à jour !", { id: loadingToast });
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Échec de la mise à jour de la tâche", { id: loadingToast });
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      const loadingToast = toast.loading("Suppression de la tâche...");
      try {
        await remove(id);
        toast.success("Tâche supprimée", { id: loadingToast });
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error("Échec de la suppression de la tâche", { id: loadingToast });
        console.error(err);
      }
    }
  };

  const toggleDetails = (id) => {
    setExpandedTaskId(prevId => prevId === id ? null : id);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Header for TaskList */}
      <div className="flex items-center justify-between mb-4 mt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          Tâches
        </h3>
        {!isClient && (
          <button 
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter une Tâche
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
           <div className="mb-4 inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
              <EyeOff className="w-8 h-8" />
           </div>
           <p className="font-bold tracking-tight">Aucune tâche trouvée pour ce service.</p>
           <p className="text-xs mt-1">Ajoutez votre première tâche pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex flex-col border rounded-[32px] overflow-hidden shadow-sm transition-all duration-500 ${
                task.status === 'completed' 
                ? 'bg-green-50/30 dark:bg-green-950/10 border-green-100 dark:border-green-900/30 opacity-80' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1'
              }`}
            >
              <div className="p-6 flex-1 flex flex-col">
                {/* Task Badges */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    task.priority === 'high' ? 'bg-red-50 text-red-600' : 
                    task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </span>
                  <div className={`h-2 w-2 rounded-full animate-pulse ${
                    task.status === 'completed' || task.status === 'done' ? 'bg-green-500' : 
                    task.status === 'in_progress' ? 'bg-indigo-500' : 
                    task.status === 'overdue' ? 'bg-red-500' :
                    'bg-slate-300'
                  }`} title={`Statut: ${task.status}`} />
                </div>
                
                {/* Task Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-lg font-black transition-colors ${
                      task.status === 'completed' 
                      ? 'text-slate-400 dark:text-slate-500 line-through' 
                      : 'text-slate-800 dark:text-white group-hover:text-indigo-600'
                    }`}>
                      {task.title}
                    </h4>
                    {task.status === 'completed' && <Lock className="w-4 h-4 text-green-500" />}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl w-fit">
                    <Calendar className="w-3.5 h-3.5" />
                    {task.end_date || "Pas de date d'échéance"}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {task.description || "Aucune description fournie pour cette tâche."}
                  </p>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className={`px-6 py-5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-800 grid ${isClient ? 'grid-cols-1' : 'grid-cols-3'} gap-3`}>
                {!isClient && (
                  <>
                    <button 
                      onClick={() => setEditingTask(task)}
                      disabled={task.status === 'completed'}
                      className={`flex items-center justify-center p-3 rounded-2xl transition-all shadow-sm border border-transparent ${
                        task.status === 'completed'
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-100'
                      }`}
                      title={task.status === 'completed' ? "Tâche Fermée" : "Modifier la Tâche"}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={task.status === 'completed'}
                      className={`flex items-center justify-center p-3 rounded-2xl transition-all shadow-sm border border-transparent ${
                        task.status === 'completed'
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-100'
                      }`}
                      title={task.status === 'completed' ? "Tâche Fermée" : "Supprimer la Tâche"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => toggleDetails(task.id)}
                  className="flex items-center justify-center p-3 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm border border-transparent"
                  title="Voir les détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Info Modal (Elegant Vertical Design) */}
      <Modal isVisible={expandedTaskId !== null} onClose={() => setExpandedTaskId(null)}>
        <div className="relative p-6 md:p-10 max-w-3xl mx-auto space-y-12">
           {/* Close Button (X) */}
           <button 
             onClick={() => setExpandedTaskId(null)}
             className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
             title="Fermer la fenêtre"
           >
             <X className="w-5 h-5" />
           </button>

           {/* Modal Header: Elegant & Minimal */}
           <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Document de Tâche</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {selectedTask?.title || "Aperçu de la Tâche"}
              </h2>
           </div>

           {selectedTask && (
             <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                {/* Meta-Information: Vertical Stack */}
                <div className="md:col-span-4 space-y-8 border-r border-slate-50 dark:border-slate-800 pr-8">
                   <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <User className="w-3 h-3" /> Priorité
                      </p>
                      <span className={`inline-block text-xs font-black uppercase ${
                         selectedTask.priority === 'high' ? 'text-red-500' : 
                         selectedTask.priority === 'medium' ? 'text-amber-500' : 'text-slate-500'
                      }`}>
                         {selectedTask.priority === 'high' ? 'Haute' : selectedTask.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Lock className="w-3 h-3" /> Statut
                      </p>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        {
                          selectedTask.status === 'completed' ? 'Terminée' :
                          selectedTask.status === 'in_progress' ? 'En cours' :
                          selectedTask.status === 'overdue' ? 'En retard' : 'En attente'
                        }
                      </span>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Calendar className="w-3 h-3" /> Calendrier
                      </p>
                      <div className="space-y-2">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-bold text-slate-300 uppercase">Date de Début</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedTask.start_date || 'Non spécifiée'}</span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-bold text-slate-300 uppercase">Date Limite</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{selectedTask.end_date || 'Non spécifiée'}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Main Documentation Body */}
                <div className="md:col-span-8 space-y-6">
                   <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Description</h3>
                   </div>
                   
                   <div className="bg-slate-50/50 dark:bg-slate-900/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
                         {selectedTask.description || "Aucun contexte détaillé n'a été fourni pour cette exigence."}
                      </p>
                   </div>
                </div>
             </div>
           )}

           {/* Footer Branding */}
           <div className="pt-8 flex items-center justify-between border-t border-slate-50 dark:border-slate-800">
               <div className="flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                  <Shapes className="w-3.5 h-3.5" />
                  Fiche Technique
               </div>
               <span className="text-[8px] font-bold text-slate-300 uppercase">Session Authentifiée</span>
           </div>
        </div>
      </Modal>

      {/* Editing Task Modal */}
      <Modal isVisible={editingTask !== null} onClose={() => setEditingTask(null)}>
        <FormTask
            initialData={editingTask}
            onSubmit={handleEditTask}
            onCancel={() => setEditingTask(null)}
        />
      </Modal>

      {/* Creating Task Modal */}
      <Modal isVisible={showTaskForm} onClose={() => setShowTaskForm(false)}>
        <FormTask
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
        />
      </Modal>
    </div>
  );
};
