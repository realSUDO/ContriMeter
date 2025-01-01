import { useState } from "react";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { key: "N", action: "New task" },
  { key: "S", action: "Start timer" },
  { key: "D", action: "Mark done" },
];

const KeyboardShortcutsHint = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="p-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-soft-lg p-3 min-w-[140px] animate-fade-in z-10">
          <p className="text-xs font-medium text-foreground mb-2">Shortcuts</p>
          <div className="space-y-1">
            {shortcuts.map(({ key, action }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">{action}</span>
                <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsHint;
