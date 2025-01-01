import { useState } from "react";
import { X } from "lucide-react";

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinTeam: (code: string) => void;
}

const JoinTeamModal = ({ isOpen, onClose, onJoinTeam }: JoinTeamModalProps) => {
  const [teamCode, setTeamCode] = useState("");

  if (!isOpen) return null;

  const handleJoin = () => {
    if (!teamCode.trim()) return;
    onJoinTeam(teamCode.trim().toUpperCase());
    setTeamCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-soft-lg p-6 w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Join Team</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Team Code
          </label>
          <input
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            className="input-clean w-full text-center font-mono text-lg tracking-widest uppercase"
            maxLength={6}
            autoFocus
          />
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleJoin}
            disabled={teamCode.length !== 6}
            className={`btn-primary flex-1 ${teamCode.length !== 6 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinTeamModal;
