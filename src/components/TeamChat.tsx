import React, { useState, useEffect, useRef } from "react";
import { X, Paperclip, Download, Meh, Laugh, CircleArrowUp } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { subscribeToTeamMessages, sendMessage, ChatMessage } from "@/services/chat";
import { uploadFile } from "@/services/storage";

interface TeamChatProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  userId: string;
  userName: string;
  onNewMessage?: () => void;
}

const TeamChat = ({ isOpen, onClose, teamId, userId, userName, onNewMessage }: TeamChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const prevMessageCountRef = React.useRef(0);
  const lastReadTimestampRef = React.useRef<number>(0);
  
  // Load last read timestamp from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`lastReadMessage_${teamId}`);
    if (saved) {
      lastReadTimestampRef.current = parseInt(saved);
    }
  }, [teamId]);
  
  const [newMessage, setNewMessage] = useState(() => {
    // Load draft from localStorage on init
    const draft = localStorage.getItem(`chatDraft_${teamId}`);
    return draft || "";
  });
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const cursorPositionRef = useRef(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [chatWidth, setChatWidth] = useState(() => {
    const saved = localStorage.getItem('chatWidth');
    return saved ? parseInt(saved) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    const constrainedWidth = Math.max(280, Math.min(600, newWidth));
    setChatWidth(constrainedWidth);
    localStorage.setItem('chatWidth', constrainedWidth.toString());
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  useEffect(() => {
    if (!teamId) return;

    const unsubscribe = subscribeToTeamMessages(teamId, (newMessages) => {
      if (newMessages.length > prevMessageCountRef.current) {
        const latestMessage = newMessages[newMessages.length - 1];
        const messageTimestamp = latestMessage.createdAt?.getTime() || 0;
        
        if (latestMessage.userId !== userId && 
            messageTimestamp > lastReadTimestampRef.current && 
            onNewMessage) {
          onNewMessage();
        }
      }
      prevMessageCountRef.current = newMessages.length;
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [teamId, userId, onNewMessage, isOpen]);
  
  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const latestTimestamp = messages[messages.length - 1]?.createdAt?.getTime() || 0;
      lastReadTimestampRef.current = latestTimestamp;
      localStorage.setItem(`lastReadMessage_${teamId}`, latestTimestamp.toString());
    }
  }, [isOpen, messages, teamId]);

  // Close chat on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // First priority: close emoji picker if open
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
          return;
        }
        
        // Second priority: if an input or textarea is focused, just blur it
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          (activeElement as HTMLElement).blur();
        } else {
          // Last priority: close the chat
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, showEmojiPicker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateDraft = (message: string) => {
    setNewMessage(message);
    localStorage.setItem(`chatDraft_${teamId}`, message);
  };

  const clearDraft = () => {
    setNewMessage("");
    localStorage.removeItem(`chatDraft_${teamId}`);
  };

  const handleSendMessage = async () => {
    if (!newMessage) return; // Only check if message exists, don't trim

    try {
      await sendMessage(teamId, userId, userName, newMessage);
      clearDraft(); // Clear draft after sending
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    const input = inputRef.current;
    if (input) {
      // Get current value and cursor position from the input element directly
      const currentValue = input.value;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      
      const updatedMessage = currentValue.slice(0, start) + emojiData.emoji + currentValue.slice(end);
      
      // Update draft
      updateDraft(updatedMessage);
      
      // Set cursor position after the inserted emoji
      const newPosition = start + emojiData.emoji.length;
      
      // Restore cursor position after React updates
      requestAnimationFrame(() => {
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
      });
    } else {
      updateDraft(newMessage + emojiData.emoji);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Limit to 800 characters
    if (value.length > 800) {
      value = value.slice(0, 800);
    }
    
    // Count newlines and limit to 10
    const newlineCount = (value.match(/\n/g) || []).length;
    if (newlineCount > 10) {
      // Remove excess newlines from the end
      const lines = value.split('\n');
      value = lines.slice(0, 11).join('\n'); // 11 lines = 10 newlines
    }
    
    // Prevent more than 3 consecutive newlines
    value = value.replace(/\n{4,}/g, '\n\n\n');
    
    updateDraft(value);
    cursorPositionRef.current = e.target.selectionStart || 0;
  };

  const handleInputFocus = () => {
    const input = inputRef.current;
    if (input) {
      cursorPositionRef.current = input.selectionStart || 0;
    }
  };

  const handleInputBlur = () => {
    const input = inputRef.current;
    if (input) {
      cursorPositionRef.current = input.selectionStart || 0;
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

  return (
    <>
      {/* Chat Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full bg-card border-l shadow-lg z-30 flex flex-col
                   transition-transform duration-300 ease-out ${
                     isOpen ? 'translate-x-0' : 'translate-x-full'
                   }`}
        style={{ width: `${chatWidth}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors"
          onMouseDown={handleMouseDown}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Team Chat</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
          <div ref={messagesEndRef} />
          {messages.slice().reverse().map((msg) => (
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
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-3">
              <style>{`
                .epr-emoji-category-label {
                  font-size: 12px !important;
                }
                .epr-emoji {
                  font-size: 18px !important;
                }
                .epr-emoji-img {
                  width: 18px !important;
                  height: 18px !important;
                }
              `}</style>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={Math.min(300, window.innerHeight * 0.4)}
                previewConfig={{ showPreview: false }}
                theme={isDarkMode ? 'dark' : 'light'}
                emojiStyle="native"
                searchDisabled={false}
                skinTonePickerLocation="SEARCH"
                categories={[
                  'smileys_people',
                  'animals_nature',
                  'food_drink',
                  'travel_places',
                  'activities',
                  'objects',
                  'symbols',
                  'flags'
                ]}
              />
            </div>
          )}
          
          <div className="relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onSelect={(e) => {
                cursorPositionRef.current = e.currentTarget.selectionStart || 0;
              }}
              placeholder="Type a message..."
              className="w-full pl-3 pr-24 py-3 border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground resize-none min-h-[48px] max-h-32 overflow-y-auto"
              disabled={uploading}
              rows={1}
            />
            
            {/* Buttons inside input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Add emoji"
              >
                {showEmojiPicker ? (
                  <Laugh className="w-4 h-4" />
                ) : (
                  <Meh className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Do nothing - just show tooltip
                }}
                disabled={uploading}
                className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                title="File upload - Coming Soon"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage || uploading}
                className="p-1.5 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
              >
                <CircleArrowUp className="w-4 h-4" />
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
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
