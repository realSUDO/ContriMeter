import { useState, useEffect, useCallback, useRef } from "react";
import { Check, AlertTriangle, MoreVertical, Trash2, Archive, Crown, GripVertical } from "lucide-react";
import StatusBadge from "./StatusBadge";
import MemberAssignmentDropdown from "./ui/member-assignment-dropdown";
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
  activeUserId?: string; // For common tasks, tracks who is currently working on it
  completedBy?: string; // For common tasks, tracks who completed it
  archived?: boolean;
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
  teamLeader?: string;
}

type FilterType = "all" | "active" | "completed" | "at-risk" | "inactive" | "common";

const TaskSection = ({ onTaskSelect, selectedTask, tasks, onTaskUpdate, onTaskDelete, onTaskArchive, onArchiveAllCompleted, onMarkDone, user, teamMembers, teamId, teamLeader }: TaskSectionProps) => {
  const [newTask, setNewTask] = useState("");
  const [assignee, setAssignee] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverTask, setDragOverTask] = useState<string | null>(null);
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const members = teamMembers || [user?.uid].filter(Boolean);
  // Always show "common" at the top of the dropdown
  const sortedMembers = members.includes("common") 
    ? ["common", ...members.filter(m => m !== "common")]
    : ["common", ...members];
  const { memberProfiles } = useTeamMemberProfiles(members);

  // Get member display names
  const getMemberName = (memberId: string) => {
    if (memberId === "common") return "Common";
    if (memberId === user?.uid) return "You";
    const profile = memberProfiles[memberId];
    return profile?.name?.slice(0, 8) || "Unknown";
  };

  // Transform members for the dropdown component
  const memberOptions = sortedMembers.map(memberId => ({
    id: memberId,
    name: getMemberName(memberId),
    isLeader: memberId === teamLeader,
    isOnline: true // You can add online status logic here if needed
  }));

  // Load task order from localStorage
  useEffect(() => {
    if (teamId) {
      const savedOrder = localStorage.getItem(`taskOrder_${teamId}`);
      if (savedOrder) {
        setTaskOrder(JSON.parse(savedOrder));
      }
    }
  }, [teamId]);

  // Save task order to localStorage
  const saveTaskOrder = (order: string[]) => {
    if (teamId) {
      localStorage.setItem(`taskOrder_${teamId}`, JSON.stringify(order));
      setTaskOrder(order);
    }
  };

  // Set default assignee to current user when component mounts
  useEffect(() => {
    if (user?.uid && !assignee) {
      setAssignee(user.uid);
    }
  }, [user?.uid, assignee]);



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
      // Permission checks
      if (task.assignee !== user?.uid && task.assignee !== "common") {
        return; // Can't modify other users' tasks
      }
      
      // For common tasks that are completed, only completer or leader can unmark
      if (task.assignee === "common" && task.status === "done" && task.completedBy) {
        if (task.completedBy !== user?.uid && teamLeader !== user?.uid) {
          return; // Only completer or leader can unmark completed common tasks
        }
      }
      
      const newStatus = task.status === "pending" ? "done" : "pending";
      const updates: Partial<Task> = {
        status: newStatus,
        isActive: false, // Always stop timer when status changes
        lastActivity: new Date()
      };
      
      // If task is active and being marked as done, stop the timer and save time
      if (task.isActive && newStatus === "done") {
        const stopTaskTimer = (window as any).__stopTaskTimer;
        if (stopTaskTimer) {
          const timeSpentMinutes = await stopTaskTimer(taskId);
          if (timeSpentMinutes > 0) {
            updates.timeSpent = (task.timeSpent || 0) + timeSpentMinutes;
          }
        }
      }
      
      // For common tasks, clear the active user when completed and track who completed it
      if (task.assignee === "common") {
        updates.activeUserId = newStatus === "done" ? null : task.activeUserId;
        updates.completedBy = newStatus === "done" ? user?.uid : null;
      }
      
      onTaskUpdate(taskId, updates);
      
      // Update contributions - for common tasks, credit the actual performer
      if (teamId) {
        const contributionUserId = task.assignee === "common" ? (task.activeUserId || user?.uid) : task.assignee;
        if (contributionUserId && contributionUserId !== "common") {
          try {
            if (newStatus === "done") {
              // Task completed - increment
              await updateContribution(teamId, contributionUserId, 0, 1);
            } else {
              // Task unmarked - decrement
              await decrementContribution(teamId, contributionUserId, 1);
            }
          } catch (error) {
            console.error("Error updating contribution:", error);
          }
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
    if (selectedTask && selectedTask.status === "pending" && 
        (selectedTask.assignee === user?.uid || selectedTask.assignee === "common")) {
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setTaskMenuOpen(null);
      }
    };

    if (taskMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [taskMenuOpen]);

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
    // Exclude archived tasks
    if (task.archived) return false;
    
    // Filter by ownership first - check if task is assigned to current user or common
    if (showMyTasksOnly && task.assignee !== (user?.uid || "You") && task.assignee !== "common") return false;
    
    // Then filter by status
    const status = getTaskStatus(task);
    if (filter === "active") return status === "active";
    if (filter === "completed") return status === "completed";
    if (filter === "at-risk") return status === "at-risk";
    if (filter === "inactive") return status === "inactive";
    if (filter === "common") return task.assignee === "common";
    return true;
  }).sort((a, b) => {
    // Sort by saved order only (don't use preview order for sorting)
    const aIndex = taskOrder.indexOf(a.id);
    const bIndex = taskOrder.indexOf(b.id);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    const currentTasks = filteredTasks.map(t => t.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask !== taskId) {
      setDragOverTask(taskId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTask(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const currentTasks = filteredTasks.map(t => t.id);
    const draggedIndex = currentTasks.indexOf(draggedTask);
    const targetIndex = currentTasks.indexOf(targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const newOrder = [...currentTasks];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTask);

    saveTaskOrder(newOrder);
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

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
                className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border shadow-sm transition ${
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
          {(["all", "active", "completed", "at-risk", "inactive", "common"] as FilterType[]).map((f) => (
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
        <div className="sm:w-40">
          <MemberAssignmentDropdown
            members={memberOptions}
            selectedMember={assignee}
            onMemberSelect={setAssignee}
            currentUserId={user?.uid}
            placeholder="Assign to..."
          />
        </div>
        <button onClick={addTask} className="btn-primary">Add</button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task, index) => (
          <div 
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, task.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, task.id)}
            onDragEnd={handleDragEnd}
            onClick={() => onTaskSelect(selectedTask?.id === task.id ? null : task)}
            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200
                       ${selectedTask?.id === task.id 
                         ? "bg-primary/5 ring-1 ring-primary/20" 
                         : "bg-background hover:bg-background/80"}
                       ${draggedTask === task.id ? "opacity-50 scale-95 shadow-lg" : ""}
                       ${dragOverTask === task.id ? "scale-105 bg-primary/10 ring-2 ring-primary/30" : ""}`}
          >
            <div 
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>
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
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>{getMemberName(task.assignee)}</span>
                {task.assignee === teamLeader && (
                  <Crown className="w-3 h-3 text-accent" />
                )}
                {task.assignee === "common" && task.activeUserId && (
                  <>
                    <span> ({getMemberName(task.activeUserId)}</span>
                    {task.activeUserId === teamLeader && (
                      <Crown className="w-3 h-3 text-accent" />
                    )}
                    <span>)</span>
                  </>
                )}
                {task.assignee === "common" && task.status === "done" && task.completedBy && (
                  <>
                    <span> (completed by {getMemberName(task.completedBy)}</span>
                    {task.completedBy === teamLeader && (
                      <Crown className="w-3 h-3 text-accent" />
                    )}
                    <span>)</span>
                  </>
                )}
                <span> • {task.timeSpent || 0}min</span>
                {task.isActive && <span> • Running</span>}
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
              <div className="relative" ref={menuRef}>
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
                        if (task.assignee === user?.uid || task.assignee === "common") {
                          onTaskArchive?.(task.id);
                        }
                        setTaskMenuOpen(null);
                      }}
                      disabled={task.assignee !== user?.uid && task.assignee !== "common"}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2 ${
                        task.assignee !== user?.uid && task.assignee !== "common" ? 'opacity-50 cursor-not-allowed' : ''
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
                      disabled={task.assignee !== user?.uid && task.assignee !== "common" && teamLeader !== user?.uid}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted text-red-600 flex items-center gap-2 ${
                        task.assignee !== user?.uid && task.assignee !== "common" && teamLeader !== user?.uid ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
