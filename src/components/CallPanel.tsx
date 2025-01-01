import React, { useState } from 'react';
import { Phone, Video, VideoOff } from 'lucide-react';

interface CallPanelProps {
  teamId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CallPanel: React.FC<CallPanelProps> = ({ teamId, userId, isOpen, onClose }) => {
  const [withVideo, setWithVideo] = useState(true);

  if (!isOpen) return null;

  const handleStartCall = () => {
    // Placeholder for future calling implementation
    alert('Calling feature will be implemented soon!');
    onClose();
  };

  const handleJoinCall = () => {
    // Placeholder for future calling implementation
    alert('Join call feature will be implemented soon!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Team Call</h3>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            📞 Video calling feature coming soon! We're working on integrating a reliable calling solution.
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={withVideo}
              onChange={(e) => setWithVideo(e.target.checked)}
            />
            {withVideo ? <Video size={16} /> : <VideoOff size={16} />}
            Enable video
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStartCall}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
          >
            <Phone size={16} />
            Start Call
          </button>
          
          <button
            onClick={handleJoinCall}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
          >
            <Phone size={16} />
            Join Call
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 bg-gray-300 text-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
