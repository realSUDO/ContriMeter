import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { unarchiveTask } from "@/services/tasks";

interface ArchivedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  memberProfiles: Record<string, any>;
}

const ArchivedTasksModal = ({ isOpen, onClose, teamId, memberProfiles }: ArchivedTasksModalProps) => {
  const [archivedTasks, setArchivedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !teamId) return;

    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      where("teamId", "==", teamId),
      where("archived", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActivity: doc.data().lastActivity?.toDate()
      }));
      setArchivedTasks(tasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, teamId]);

  const handleUnarchive = async (taskId: string) => {
    try {
      await unarchiveTask(taskId);
    } catch (error) {
      console.error("Error unarchiving task:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-card border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">Archived Tasks</h2>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : archivedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No archived tasks</div>
            ) : (
              <div className="space-y-3">
                {archivedTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{task.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Assigned to: {memberProfiles[task.assignee]?.name || 'Unknown'} • 
                        {task.status === 'done' ? ' ✓ Completed' : ' Pending'} • 
                        {task.timeSpent || 0}min
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnarchive(task.id)}
                      className="ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                      title="Unarchive task"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ArchivedTasksModal;
