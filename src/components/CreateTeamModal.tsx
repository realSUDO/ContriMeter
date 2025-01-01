import { useState } from "react";
import { X } from "lucide-react";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (name: string, code: string) => void;
}

const generateTeamCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CreateTeamModal = ({ isOpen, onClose, onCreateTeam }: CreateTeamModalProps) => {
  const [teamName, setTeamName] = useState("");
  const [generatedCode] = useState(() => generateTeamCode());

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    
    try {
      await onCreateTeam(teamName.trim(), generatedCode);
      setTeamName("");
      onClose();
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/10 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-background border border-border rounded-xl shadow-soft-lg p-6 w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Create Team</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Product Design"
              className="input-clean w-full"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Team Code
            </label>
            <div className="bg-muted rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-foreground text-center">
              {generatedCode}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Share this code with your team
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!teamName.trim()}
            className={`btn-primary flex-1 ${!teamName.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Create
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          You'll be the team leader
        </p>
      </div>
    </div>
  );
};

export default CreateTeamModal;
