import { useState, useEffect, useCallback } from 'react';
import { Phone } from 'lucide-react';
import { LiveKitService } from '@/services/livekit';
import { CallRoom } from './CallRoom';
import { toast } from 'sonner';

interface TeamCallProps {
  teamId: string;
  userId: string;
  userName: string;
  compact?: boolean;
  onCallStateChange?: (isInCall: boolean, isMinimized: boolean) => void;
}

export const TeamCall: React.FC<TeamCallProps> = ({ teamId, userId, userName, compact = false, onCallStateChange }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleJoinCall = useCallback(async (restoreMinimized = false, savedUserName?: string) => {
    setIsLoading(true);
    const isRestore = !!savedUserName;
    try {
      const nameToUse = savedUserName || userName;
      const callToken = await LiveKitService.getToken(teamId, userId, nameToUse);
      setToken(callToken);
      setIsInCall(true);
      setIsMinimized(restoreMinimized);
      
      // Mark user as in call in Firestore (optional, don't fail if permissions issue)
      LiveKitService.markUserInCall(teamId, userId, nameToUse).catch(e => 
        console.log('Could not mark user in call:', e.message)
      );
    } catch (error) {
      console.error('Failed to join call:', error);
      toast.error('Failed to join call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, userId, userName]);

  // Restore call state on mount
  useEffect(() => {
    const savedCallState = localStorage.getItem(`call_state_${teamId}`);
    if (savedCallState) {
      try {
        const { inCall, minimized, userName: savedUserName, timestamp } = JSON.parse(savedCallState);
        
        // Only restore if saved within last 5 seconds (page reload scenario)
        const now = Date.now();
        if (timestamp && (now - timestamp) > 5000) {
          localStorage.removeItem(`call_state_${teamId}`);
          return;
        }
        
        if (inCall) {
          handleJoinCall(minimized, savedUserName);
        }
      } catch (error) {
        console.error('Failed to restore call state:', error);
        localStorage.removeItem(`call_state_${teamId}`);
      }
    }
  }, [teamId, handleJoinCall]);

  // Save call state to localStorage
  useEffect(() => {
    if (isInCall) {
      const stateToSave = { inCall: true, minimized: isMinimized, userName, timestamp: Date.now() };
      localStorage.setItem(`call_state_${teamId}`, JSON.stringify(stateToSave));
    }
    onCallStateChange?.(isInCall, isMinimized);
  }, [isInCall, isMinimized, teamId, userName, onCallStateChange]);

  const handleLeaveCall = () => {
    setIsLeaving(true);
    
    // Clear localStorage immediately
    localStorage.removeItem(`call_state_${teamId}`);
    
    // Remove user from call in Firestore
    LiveKitService.removeUserFromCall(teamId, userId).catch(e => console.error('Failed to remove from call:', e));
    
    // Play leave sound
    const leaveAudio = new Audio('/assets/leave.mp3');
    leaveAudio.volume = 0.5;
    leaveAudio.play().catch(e => console.error('Leave sound error:', e));
    
    // Disconnect after sound plays
    setTimeout(() => {
      setIsInCall(false);
      setToken('');
      setIsMinimized(false);
      setIsLeaving(false);
    }, 500);
  };

  const handleDisconnect = () => {
    // Remove user from call in Firestore
    LiveKitService.removeUserFromCall(teamId, userId).catch(e => console.error('Failed to remove from call:', e));
    
    // Check if this is a reload (localStorage exists) or actual disconnect
    const savedState = localStorage.getItem(`call_state_${teamId}`);
    if (!savedState) {
      // No saved state means user intentionally left, don't restore
      setIsInCall(false);
      setToken('');
      setIsMinimized(false);
    } else {
      // Has saved state, this is a reload, keep state for restoration
      setIsInCall(false);
      setToken('');
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  if ((isInCall || isLeaving) && token) {
    return (
      <div style={{ display: isLeaving ? 'none' : 'block' }}>
        <CallRoom
          token={token}
          serverUrl={LiveKitService.getServerUrl()}
          onLeave={handleLeaveCall}
          onDisconnect={handleDisconnect}
          teamId={teamId}
          onMinimize={handleMinimize}
          isMinimized={isMinimized}
          onMaximize={handleMaximize}
        />
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => handleJoinCall()}
        disabled={isLoading}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 relative"
        title="Join team call"
      >
        <Phone className="w-4 h-4" />
        {/* Red dot shown when someone else is in call - will be passed as prop */}
      </button>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Team Call</h3>
      <button
        onClick={() => handleJoinCall()}
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
      >
        <Phone className="w-4 h-4" />
        {isLoading ? 'Joining...' : 'Join Call'}
      </button>
    </div>
  );
};
