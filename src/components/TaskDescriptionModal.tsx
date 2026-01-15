import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface Task {
  id: string;
  name: string;
  description?: string;
}

interface TaskDescriptionModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDescriptionModal = ({ task, isOpen, onClose }: TaskDescriptionModalProps) => {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full sm:max-w-2xl max-h-[80vh] overflow-hidden rounded-lg">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-y-auto" data-color-mode="auto">
          {task.description ? (
            <MDEditor.Markdown 
              source={task.description} 
              style={{ fontSize: '0.875rem' }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">No description available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDescriptionModal;
