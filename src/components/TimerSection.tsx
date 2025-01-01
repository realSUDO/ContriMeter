import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, History } from "lucide-react";
import SessionHistory from "./SessionHistory";
import { updateContribution } from "@/services/contributions";
import { addSession, getTeamSessions, Session } from "@/services/sessions";

interface Task {
  id: string;
  name: string;
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
}

const TimerSection = ({ selectedTask, onTaskUpdate, teamId, userId, tasks }: TimerSectionProps) => {
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [activeTaskIds, setActiveTaskIds] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (activeTaskIds.size > 0) {
      intervalRef.current = window.setInterval(() => {
        setTaskTimers(prev => {
          const updated = { ...prev };
          activeTaskIds.forEach(taskId => {
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
    if (!selectedTask) return;
    
    // Only allow starting timer for tasks assigned to current user
    if (selectedTask.assignee !== userId) {
      return;
    }
    
    // Prevent double clicks by checking current state
    setActiveTaskIds(prev => {
      if (prev.has(selectedTask.id)) return prev; // Already running
      
      onTaskUpdate(selectedTask.id, { 
        isActive: true,
        lastActivity: new Date()
      });
      
      return new Set([...prev, selectedTask.id]);
    });
  }, [selectedTask, onTaskUpdate, userId]);

  const handleStop = useCallback(async () => {
    if (!selectedTask || !activeTaskIds.has(selectedTask.id)) return;
    
    const duration = taskTimers[selectedTask.id] || 0;
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
      
      // Save session to Firestore
      if (teamId && userId) {
        await addSession(userId, teamId, selectedTask.name, duration);
      }
      
      // Update task with accumulated time
      const totalTimeMinutes = Math.floor(duration / 60); // Convert to minutes
      onTaskUpdate(selectedTask.id, { 
        timeSpent: (selectedTask.timeSpent || 0) + totalTimeMinutes,
        isActive: false,
        lastActivity: new Date()
      });

      // Update contributions for the task assignee (use seconds for real-time updates)
      if (teamId && selectedTask.assignee) {
        await updateContribution(teamId, selectedTask.assignee, duration, 0); // Pass seconds directly
      }
    }
    
    setActiveTaskIds(prev => {
      const updated = new Set(prev);
      updated.delete(selectedTask.id);
      return updated;
    });
    setTaskTimers(prev => ({ ...prev, [selectedTask.id]: 0 }));
  }, [selectedTask, activeTaskIds, taskTimers, onTaskUpdate]);

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
      if (task && task.isActive === false) {
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
        <h2 className="text-lg font-semibold text-foreground">Timer</h2>
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
                Working on: <span className="text-foreground font-medium">{selectedTask.name}</span>
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
