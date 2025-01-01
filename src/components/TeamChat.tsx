import { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip, Download } from "lucide-react";
import { subscribeToTeamMessages, sendMessage, ChatMessage } from "@/services/chat";
import { uploadFile } from "@/services/storage";

interface TeamChatProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  userId: string;
  userName: string;
}

const TeamChat = ({ isOpen, onClose, teamId, userId, userName }: TeamChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !teamId) return;

    const unsubscribe = subscribeToTeamMessages(teamId, setMessages);
    return () => unsubscribe();
  }, [isOpen, teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(teamId, userId, userName, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Do nothing - coming soon functionality
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      
      {/* Chat Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-card border-l shadow-lg z-50 rounded-l-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Team Chat</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-lg p-3 ${
                msg.userId === userId 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
              }`}>
                {msg.userId !== userId && (
                  <p className="text-xs opacity-70 mb-1">{msg.userName}</p>
                )}
                
                {msg.fileUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm">{msg.message}</p>
                    <div className="flex items-center gap-2 p-2 bg-black/10 rounded">
                      <Paperclip className="w-3 h-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{msg.fileName}</p>
                        <p className="text-xs opacity-70">{formatFileSize(msg.fileSize || 0)}</p>
                      </div>
                      <a 
                        href={msg.fileUrl} 
                        download={msg.fileName}
                        className="p-1 hover:bg-black/10 rounded"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{msg.message}</p>
                )}
                
                <p className="text-xs opacity-70 mt-1">
                  {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              disabled={uploading}
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                // Do nothing - just show tooltip
              }}
              disabled={uploading}
              className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="File upload - Coming Soon"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || uploading}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {uploading && (
            <p className="text-xs text-muted-foreground mt-2">Uploading file...</p>
          )}
        </div>
      </div>
    </>
  );
};

export default TeamChat;
