import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";

interface InviteCodeDisplayProps {
  code: string;
}

const InviteCodeDisplay = ({ code }: InviteCodeDisplayProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleHide = () => {
    setIsRevealed(false);
    setIsCopied(false);
  };

  return (
    <div className="relative">
      {!isRevealed ? (
        <button
          onClick={handleReveal}
          onMouseEnter={handleReveal}
          className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 
                     bg-card hover:bg-accent px-3 py-1.5 rounded-lg border border-border 
                     hover:border-primary/20 flex items-center gap-2 group"
        >
          <Users className="w-3 h-3" />
          <span className="font-medium">Invite Code</span>
        </button>
      ) : (
        <div
          onMouseLeave={handleHide}
          className="bg-card border border-border rounded-lg px-3 py-1.5 
                     shadow-soft animate-scale-in flex items-center gap-2"
        >
          <span className="text-sm font-mono text-foreground tracking-wider">
            {code}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors 
                       hover:bg-accent rounded"
            title={isCopied ? "Copied!" : "Copy code"}
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
          
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                          bg-popover text-popover-foreground text-xs px-2 py-1 rounded 
                          shadow-lg border whitespace-nowrap z-10">
            {isCopied ? "Copied to clipboard!" : "Click to copy"}
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteCodeDisplay;