import { useState, useEffect, useCallback } from "react";
import { Check, AlertTriangle, MoreVertical, Trash2, Archive } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useTeamMemberProfiles } from "@/hooks/useTeamMemberProfiles";
import { updateContribution, decrementContribution } from "@/services/contributions";

interface Task {
  id: string;
  name: string;
  assignee: string;
  status: "pending" | "done";
  timeSpent?: number; // in minutes
  isActive?: boolean;
  lastActivity?: Date;
  createdAt?: Date;
  manuallyMarkedAtRisk?: boolean;
}

interface TaskSectionProps {
  onTaskSelect: (task: Task | null) => void;
  selectedTask: Task | null;
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskArchive?: (taskId: string) => void;
  onArchiveAllCompleted?: () => void;
  onMarkDone?: () => void;
  user?: any;
  teamMembers?: string[];
  teamId?: string;
}

type FilterType = "all" | "active" | "completed" | "at-risk" | "inactive";

const TaskSection = ({ onTaskSelect, selectedTask, tasks, onTaskUpdate, onTaskDelete, onTaskArchive, onArchiveAllCompleted, onMarkDone, user, teamMembers, teamId }: TaskSectionProps) => {
  const [newTask, setNewTask] = useState("");
  const [assignee, setAssignee] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);

  const members = teamMembers || [user?.uid].filter(Boolean);
  const { memberProfiles } = useTeamMemberProfiles(members);

  // Set default assignee to current user when component mounts
  useEffect(() => {
    if (user?.uid && !assignee) {
      setAssignee(user.uid);
    }
  }, [user?.uid, assignee]);

  // Get member display names
  const getMemberName = (memberId: string) => {
    if (memberId === user?.uid) return "You";
    const profile = memberProfiles[memberId];
    return profile?.name || memberId.slice(0, 8) + "...";
  };

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    const now = new Date();
    const task: Task = {
      id: Date.now().toString(),
      name: newTask,
      assignee,
      status: "pending",
      timeSpent: 0,
      isActive: false,
      lastActivity: now,
      createdAt: now,
      manuallyMarkedAtRisk: false,
    };
    onTaskUpdate(task.id, task);
    setNewTask("");
  }, [newTask, assignee, onTaskUpdate]);

  const toggleStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Only allow task assignee to mark task as done
      if (task.assignee !== user?.uid) {
        return;
      }
      
      const newStatus = task.status === "pending" ? "done" : "pending";
      onTaskUpdate(taskId, { 
        status: newStatus,
        isActive: false, // Always stop timer when status changes
        lastActivity: new Date()
      });
      
      // Update contributions based on status change
      if (teamId && task.assignee) {
        try {
          if (newStatus === "done") {
            // Task completed - increment
            await updateContribution(teamId, task.assignee, 0, 1);
          } else {
            // Task unmarked - decrement
            await decrementContribution(teamId, task.assignee, 1);
          }
        } catch (error) {
          console.error("Error updating contribution:", error);
        }
      }
      
      // Timer will stop automatically via isActive: false in onTaskUpdate
    }
  };

  const toggleAtRisk = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onTaskUpdate(taskId, { 
        manuallyMarkedAtRisk: !task.manuallyMarkedAtRisk,
        lastActivity: new Date()
      });
    }
  };

  const markSelectedDone = useCallback(() => {
    if (selectedTask && selectedTask.status === "pending" && selectedTask.assignee === user?.uid) {
      toggleStatus(selectedTask.id);
    }
  }, [selectedTask, user?.uid]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-task-input]')?.focus();
      }
      if (e.key.toLowerCase() === "d" && selectedTask && selectedTask.status === "pending") {
        e.preventDefault();
        markSelectedDone();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [markSelectedDone]);

  useEffect(() => {
    if (onMarkDone) {
      onMarkDone();
    }
  }, [onMarkDone]);

  const getTaskStatus = (task: Task): "active" | "at-risk" | "inactive" | "completed" => {
    if (task.status === "done") return "completed";
    
    // If manually marked at-risk, return at-risk (only for non-completed tasks)
    if (task.manuallyMarkedAtRisk) return "at-risk";
    
    // Task is active only when timer is running
    if (task.isActive) return "active";
    
    // All other non-completed tasks are inactive
    return "inactive";
  };

  const canMarkAtRisk = (task: Task): boolean => {
    if (task.status === "done") return false;
    const status = getTaskStatus({ ...task, manuallyMarkedAtRisk: false });
    return status === "active" || status === "inactive";
  };

  const filteredTasks = tasks.filter(task => {
    // Filter by ownership first - check if task is assigned to current user
    if (showMyTasksOnly && task.assignee !== (user?.uid || "You")) return false;
    
    // Then filter by status
    const status = getTaskStatus(task);
    if (filter === "active") return status === "active";
    if (filter === "completed") return status === "completed";
    if (filter === "at-risk") return status === "at-risk";
    if (filter === "inactive") return status === "inactive";
    return true;
  });

  return (
    <div className="card-soft">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <label className='flex cursor-pointer select-none items-center'>
            <div className='relative'>
              <input
                type='checkbox'
                checked={showMyTasksOnly}
                onChange={() => setShowMyTasksOnly(!showMyTasksOnly)}
                className='sr-only'
              />
              <div
                className={`box block h-8 w-14 rounded-full border-2 ${
                  showMyTasksOnly ? 'bg-primary border-primary' : 'bg-muted border-border'
                }`}
              ></div>
              <div
                className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition ${
                  showMyTasksOnly ? 'translate-x-full' : ''
                }`}
              ></div>
            </div>
          </label>
          <span className="text-lg font-semibold text-foreground">
            {showMyTasksOnly ? "MY TASKS" : "ALL TASKS"}
          </span>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 p-1 bg-background rounded-lg w-fit">
          {(["all", "active", "completed", "at-risk", "inactive"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 capitalize
                         ${filter === f 
                           ? "bg-card text-foreground shadow-sm" 
                           : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
        
        {filter === "completed" && filteredTasks.length > 0 && (
          <button
            onClick={() => onArchiveAllCompleted?.()}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Archive className="w-3 h-3" />
            Archive All
          </button>
        )}
      </div>
      
      {/* Add Task Form */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          data-task-input
          placeholder="New task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="input-clean flex-1"
        />
        <select 
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="input-clean sm:w-40"
        >
          {members.map(memberId => (
            <option key={memberId} value={memberId}>
              {getMemberName(memberId)}
            </option>
          ))}
        </select>
        <button onClick={addTask} className="btn-primary">Add</button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map(task => (
          <div 
            key={task.id}
            onClick={() => onTaskSelect(selectedTask?.id === task.id ? null : task)}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 cursor-pointer
                       ${selectedTask?.id === task.id 
                         ? "bg-primary/5 ring-1 ring-primary/20" 
                         : "bg-background hover:bg-background/80"}`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggleStatus(task.id); }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
                         ${task.status === "done" 
                           ? "bg-primary border-primary" 
                           : "border-muted-foreground/40 hover:border-primary"}`}
            >
              {task.status === "done" && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {task.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {getMemberName(task.assignee)} • {task.timeSpent || 0}min
                {task.isActive && " • Running"}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {canMarkAtRisk(task) && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAtRisk(task.id); }}
                  className={`p-1 rounded transition-colors ${
                    task.manuallyMarkedAtRisk 
                      ? "text-orange-500 bg-orange-50" 
                      : "text-muted-foreground hover:text-orange-500"
                  }`}
                  title="Mark as at-risk"
                >
                  <AlertTriangle className="w-3 h-3" />
                </button>
              )}
              <StatusBadge status={getTaskStatus(task)} />
              
              {/* Task Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                
                {taskMenuOpen === task.id && (
                  <div className="absolute right-0 top-6 bg-card border rounded-lg shadow-lg py-1 z-10 min-w-32">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.assignee === user?.uid) {
                          onTaskArchive?.(task.id);
                        }
                        setTaskMenuOpen(null);
                      }}
                      disabled={task.assignee !== user?.uid}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2 ${
                        task.assignee !== user?.uid ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Archive className="w-3 h-3" />
                      Archive
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskDelete?.(task.id);
                        setTaskMenuOpen(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No {filter === "all" ? "" : filter} tasks
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskSection;
