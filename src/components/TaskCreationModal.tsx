import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface TaskCreationModalProps {
  isOpen: boolean;
  initialTaskName: string;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}

const TaskCreationModal = ({ isOpen, initialTaskName, onSave, onClose }: TaskCreationModalProps) => {
  const [taskName, setTaskName] = useState(initialTaskName);
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTaskName(initialTaskName);
  }, [initialTaskName]);

  useEffect(() => {
    // Ensure scroll is enabled when modal opens/closes
    if (isOpen) {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSave = () => {
    if (taskName.trim()) {
      onSave(taskName.trim(), description.trim());
      // Clear state and close modal
      setTaskName("");
      setDescription("");
      onClose();
    }
  };

  const handleClose = () => {
    setTaskName("");
    setDescription("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-foreground">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mt-1 px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-0 focus:border-border overflow-x-auto"
              placeholder="Enter task name..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Description ({description.length}/250)
            </label>
            <div className="mt-1" data-color-mode="auto">
              <MDEditor
                value={description}
                onChange={(val) => {
                  const newValue = val || "";
                  if (newValue.length <= 250) {
                    setDescription(newValue);
                  }
                }}
                preview="live"
                hideToolbar={false}
                height={200}
                data-color-mode="auto"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleClose}
              type="button"
              className="px-4 py-2 text-sm border border-border text-foreground rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create Task
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCreationModal;
