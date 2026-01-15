import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, History } from "lucide-react";
import SessionHistory from "./SessionHistory";
import HourglassIcon from "./LottieHourglass";
import { updateContribution } from "@/services/contributions";
import { addSession, getTeamSessions, Session } from "@/services/sessions";

interface Task {
  id: string;
  name: string;
  description?: string;
  assignee: string;
  status: "pending" | "done";
  timeSpent?: number;
  isActive?: boolean;
  lastActivity?: Date;
  createdAt?: Date;
  manuallyMarkedAtRisk?: boolean;
}

interface Session {
  id: string;
  userId: string;
  teamId: string;
  taskName: string;
  duration: number;
  createdAt: Date;
}

interface TimerSectionProps {
  selectedTask: Task | null;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  teamId?: string;
  userId?: string;
  tasks: Task[];
  onStopTask?: (taskId: string) => Promise<void>;
}

const TimerSection = ({ selectedTask, onTaskUpdate, teamId, userId, tasks, onStopTask }: TimerSectionProps) => {
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [activeTaskIds, setActiveTaskIds] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const recentlyStartedRef = useRef<Set<string>>(new Set());

  // Load team sessions
  useEffect(() => {
    if (!teamId) return;
    
    const loadSessions = async () => {
      try {
        const teamSessions = await getTeamSessions(teamId);
        setSessions(teamSessions);
      } catch (error) {
        console.error("Error loading sessions:", error);
      }
    };
    
    loadSessions();
    
    // Refresh sessions when history is shown
    if (showHistory) {
      const interval = setInterval(loadSessions, 5000);
      return () => clearInterval(interval);
    }
  }, [teamId, showHistory]);

  // Close session history on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHistory) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showHistory]);

  const activeTaskIdsRef = useRef<Set<string>>(new Set());
  
  // Keep ref in sync with state
  useEffect(() => {
    activeTaskIdsRef.current = activeTaskIds;
  }, [activeTaskIds]);

  useEffect(() => {
    if (activeTaskIds.size > 0) {
      intervalRef.current = window.setInterval(() => {
        setTaskTimers(prev => {
          const updated = { ...prev };
          activeTaskIdsRef.current.forEach(taskId => {
            updated[taskId] = (updated[taskId] || 0) + 1;
          });
          return updated;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTaskIds]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = useCallback(() => {
    console.log('handleStart called', { selectedTask: selectedTask?.id, activeTaskIds: Array.from(activeTaskIdsRef.current) });
    if (!selectedTask) return;
    
    // Only allow starting timer for tasks assigned to current user or common tasks
    if (selectedTask.assignee !== userId && selectedTask.assignee !== "common") {
      return;
    }
    
    // For common tasks, check if someone else is already working on it
    if (selectedTask.assignee === "common" && selectedTask.activeUserId && selectedTask.activeUserId !== userId) {
      return;
    }
    
    // Check if already running
    if (activeTaskIdsRef.current.has(selectedTask.id)) {
      console.log('Task already running, returning');
      return;
    }
    
    console.log('Starting timer for task:', selectedTask.id);
    
    // Mark as recently started to prevent immediate stopping
    recentlyStartedRef.current.add(selectedTask.id);
    setTimeout(() => {
      recentlyStartedRef.current.delete(selectedTask.id);
    }, 1000); // Give 1 second for Firebase to sync
    
    // Update timer state first
    setActiveTaskIds(prev => {
      const newSet = new Set([...prev, selectedTask.id]);
      console.log('Updated activeTaskIds:', Array.from(newSet));
      return newSet;
    });
    
    // Then update task state
    console.log('Calling onTaskUpdate with isActive: true');
    const updates: any = { 
      isActive: true,
      lastActivity: new Date()
    };
    
    // For common tasks, set the active user
    if (selectedTask.assignee === "common") {
      updates.activeUserId = userId;
    }
    
    onTaskUpdate(selectedTask.id, updates);
  }, [selectedTask, onTaskUpdate, userId]);

  const handleStop = useCallback(async () => {
    if (!selectedTask || !activeTaskIds.has(selectedTask.id)) return;
    
    const duration = taskTimers[selectedTask.id] || 0;
    
    // Stop timer immediately in UI
    setActiveTaskIds(prev => {
      const updated = new Set(prev);
      updated.delete(selectedTask.id);
      return updated;
    });
    setTaskTimers(prev => ({ ...prev, [selectedTask.id]: 0 }));
    
    // Always update task to mark as inactive
    const updates: any = { 
      isActive: false,
      lastActivity: new Date()
    };
    
    // For common tasks, clear the active user immediately
    if (selectedTask.assignee === "common") {
      updates.activeUserId = null; // Use null instead of undefined for Firestore
    }
    
    if (duration > 0) {
      const newSession: Session = {
        id: Date.now().toString(),
        userId: userId || "",
        teamId: teamId || "",
        taskName: selectedTask.name,
        duration,
        createdAt: new Date(),
      };
      setSessions(prev => [newSession, ...prev]);
      
      // Add accumulated time to the updates
      const totalTimeMinutes = Math.floor(duration / 60);
      updates.timeSpent = (selectedTask.timeSpent || 0) + totalTimeMinutes;
      
      // Background operations - don't await to avoid UI delay
      if (teamId && userId) {
        addSession(userId, teamId, selectedTask.name, duration);
      }

      if (teamId) {
        const contributionUserId = selectedTask.assignee === "common" ? (selectedTask.activeUserId || userId) : selectedTask.assignee;
        if (contributionUserId && contributionUserId !== "common") {
          updateContribution(teamId, contributionUserId, duration, 0);
        }
      }
    }
    
    // Apply all updates in a single call
    onTaskUpdate(selectedTask.id, updates);
  }, [selectedTask, activeTaskIds, taskTimers, onTaskUpdate, teamId, userId]);

  // Expose stop function for any task
  const stopAnyTask = useCallback(async (taskId: string) => {
    if (!activeTaskIds.has(taskId)) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const duration = taskTimers[taskId] || 0;
    
    // Stop timer immediately in UI
    setActiveTaskIds(prev => {
      const updated = new Set(prev);
      updated.delete(taskId);
      return updated;
    });
    setTaskTimers(prev => ({ ...prev, [taskId]: 0 }));
    
    if (duration > 0) {
      const newSession: Session = {
        id: Date.now().toString(),
        userId: userId || "",
        teamId: teamId || "",
        taskName: task.name,
        duration,
        createdAt: new Date(),
      };
      setSessions(prev => [newSession, ...prev]);
      
      // Background operations
      if (teamId && userId) {
        addSession(userId, teamId, task.name, duration);
      }

      if (teamId) {
        const contributionUserId = task.assignee === "common" ? (task.activeUserId || userId) : task.assignee;
        if (contributionUserId && contributionUserId !== "common") {
          updateContribution(teamId, contributionUserId, duration, 0);
        }
      }
      
      // Return the time spent to be added to task
      const totalTimeMinutes = Math.floor(duration / 60);
      return totalTimeMinutes;
    }
    
    return 0;
  }, [activeTaskIds, taskTimers, tasks, teamId, userId]);

  // Register the stop callback
  useEffect(() => {
    if (onStopTask) {
      (window as any).__stopTaskTimer = stopAnyTask;
    }
  }, [stopAnyTask, onStopTask]);

  const stopTaskTimer = useCallback((taskId: string) => {
    if (!activeTaskIds.has(taskId)) return;
    
    setActiveTaskIds(prev => {
      const updated = new Set(prev);
      updated.delete(taskId);
      return updated;
    });
    setTaskTimers(prev => ({ ...prev, [taskId]: 0 }));
  }, [activeTaskIds]);

  // Stop timers for tasks that become inactive
  useEffect(() => {
    activeTaskIds.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      console.log('Checking task for stop:', taskId, 'task.isActive:', task?.isActive, 'recentlyStarted:', recentlyStartedRef.current.has(taskId));
      if (task && task.isActive === false && !recentlyStartedRef.current.has(taskId)) {
        console.log('Stopping timer for task:', taskId);
        setActiveTaskIds(prev => {
          const updated = new Set(prev);
          updated.delete(taskId);
          return updated;
        });
        setTaskTimers(prev => ({ ...prev, [taskId]: 0 }));
      }
    });
  }, [tasks, activeTaskIds]);

  // Keyboard shortcut for S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key.toLowerCase() === "s" && selectedTask && !activeTaskIds.has(selectedTask.id)) {
        e.preventDefault();
        handleStart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTask, activeTaskIds, handleStart]);

  const currentElapsed = selectedTask ? (taskTimers[selectedTask.id] || 0) : 0;
  const isRunning = selectedTask ? activeTaskIds.has(selectedTask.id) : false;

  return (
    <div className="card-soft text-center">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <HourglassIcon isActive={isRunning} />
          <h2 className="text-lg font-semibold text-foreground">Hourglass</h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-lg transition-colors ${showHistory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          title="Session history"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
      
      {showHistory ? (
        <SessionHistory sessions={sessions} />
      ) : (
        <>
          {/* Timer Display */}
          <div className="mb-6">
            <p className="text-5xl font-light text-foreground tracking-wider font-mono mb-4">
              {formatTime(currentElapsed)}
            </p>
            
            {selectedTask ? (
              <p className="text-sm text-muted-foreground">
                {isRunning ? (
                  <>Working on: <span className="text-foreground font-medium">{selectedTask.name}</span></>
                ) : (
                  <>Wanna start: <span className="text-foreground font-medium">{selectedTask.name}?</span></>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a task to start tracking
              </p>
            )}
            
            {activeTaskIds.size > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                {activeTaskIds.size} tasks running
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            <button 
              onClick={handleStart}
              disabled={!selectedTask || isRunning}
              className={`btn-primary flex items-center gap-2 
                         ${(!selectedTask || isRunning) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Play className="w-4 h-4" />
              Start
            </button>
            <button 
              onClick={handleStop}
              disabled={!isRunning}
              className={`btn-secondary flex items-center gap-2
                         ${!isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TimerSection;
