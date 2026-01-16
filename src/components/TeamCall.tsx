import { useState } from 'react';
import { Phone, X } from 'lucide-react';
import { LiveKitService } from '@/services/livekit';
import { CallRoom } from './CallRoom';
import { toast } from 'sonner';

interface TeamCallProps {
  teamId: string;
  userId: string;
  userName: string;
  compact?: boolean;
}

export const TeamCall: React.FC<TeamCallProps> = ({ teamId, userId, userName, compact = false }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinCall = async () => {
    setIsLoading(true);
    try {
      const callToken = await LiveKitService.getToken(teamId, userId, userName);
      setToken(callToken);
      setIsInCall(true);
      toast.success('Joined team call');
    } catch (error) {
      console.error('Failed to join call:', error);
      toast.error('Failed to join call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setToken('');
    toast.info('Left team call');
  };

  if (isInCall && token) {
    return (
      <CallRoom
        token={token}
        serverUrl={LiveKitService.getServerUrl()}
        onLeave={handleLeaveCall}
      />
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleJoinCall}
        disabled={isLoading}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Join team call"
      >
        <Phone className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Team Call</h3>
      <button
        onClick={handleJoinCall}
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
      >
        <Phone className="w-4 h-4" />
        {isLoading ? 'Joining...' : 'Join Call'}
      </button>
    </div>
  );
};
