import { LiveKitRoom, VideoConference, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import * as React from 'react';
import { Track } from 'livekit-client';
import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor';

interface CallRoomProps {
  token: string;
  serverUrl: string;
  onLeave: () => void;
}

const NoiseFilterSetup = () => {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const setupNoiseFilter = async () => {
      const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone)?.audioTrack;
      if (audioTrack?.mediaStreamTrack) {
        try {
          const audioContext = new AudioContext();
          const stream = new MediaStream([audioTrack.mediaStreamTrack]);
          const source = audioContext.createMediaStreamSource(stream);
          
          const rnnoiseWasm = await loadRnnoise({
            url: 'https://unpkg.com/@sapphi-red/web-noise-suppressor@0.3.5/dist/rnnoise.wasm'
          });
          
          await audioContext.audioWorklet.addModule(
            'https://unpkg.com/@sapphi-red/web-noise-suppressor@0.3.5/dist/rnnoiseWorklet.js'
          );
          
          const rnnoise = new RnnoiseWorkletNode(audioContext, {
            wasmBinary: rnnoiseWasm
          });
          
          const destination = audioContext.createMediaStreamDestination();
          source.connect(rnnoise).connect(destination);
          
          const processedTrack = destination.stream.getAudioTracks()[0];
          await audioTrack.mediaStreamTrack.stop();
          
          const sender = audioTrack.sender;
          if (sender) {
            await sender.replaceTrack(processedTrack);
          }
          console.log('RNNoise enabled successfully');
        } catch (error) {
          console.error('Failed to setup RNNoise:', error);
        }
      }
    };

    if (localParticipant) {
      setupNoiseFilter();
    }
  }, [localParticipant]);

  // Show first letter in placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      const tiles = document.querySelectorAll('.lk-participant-tile[data-lk-video-muted="true"]');
      tiles.forEach((tile: any) => {
        const nameEl = tile.querySelector('.lk-participant-name');
        const placeholder = tile.querySelector('.lk-participant-placeholder');
        if (nameEl && placeholder) {
          const fullName = nameEl.textContent || '';
          const initial = fullName.charAt(0).toUpperCase();
          placeholder.setAttribute('data-initial', initial);
        }
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return null;
};

export const CallRoom: React.FC<CallRoomProps> = ({ token, serverUrl, onLeave }) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Check if dark mode is active
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const hasDarkClass = htmlElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleLeave = () => {
    onLeave();
  };

  const bgColor = isDark ? '#1a1a1a' : '#f5f5f5';
  const tileColor = isDark ? '#2a2a2a' : '#e8e8e8';

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: bgColor }}>
      <div className="h-full w-full p-8 flex items-center justify-center">
        <div className="w-full max-w-6xl h-full">
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={false}
            video={false}
            data-lk-theme={isDark ? 'dark' : 'default'}
            style={{ 
              height: '100%', 
              width: '100%',
              '--lk-bg': bgColor,
              '--lk-bg2': tileColor,
            } as React.CSSProperties}
            onDisconnected={handleLeave}
          >
            <NoiseFilterSetup />
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
      
      <style>{`
        [data-lk-theme] {
          --lk-bg: ${bgColor} !important;
          --lk-bg2: ${tileColor} !important;
          --lk-control-bg: ${isDark ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
          --lk-control-fg: ${isDark ? '#fff' : '#1f2937'} !important;
        }
        .lk-participant-tile {
          max-width: 300px !important;
          max-height: 225px !important;
          width: 300px !important;
          height: 225px !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          background-color: ${tileColor} !important;
          border: 2px solid #000 !important;
        }
        .lk-focus-layout-wrapper .lk-participant-tile,
        .lk-focused-participant .lk-participant-tile {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          min-width: auto !important;
          min-height: auto !important;
          flex: 1 1 auto !important;
        }
        .lk-focused-participant .lk-participant-tile {
          width: 100% !important;
          height: 100% !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          min-width: 100% !important;
          min-height: 100% !important;
        }
        .lk-focused-participant .lk-participant-tile video,
        .lk-focused-participant .lk-participant-tile .lk-participant-placeholder {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        .lk-grid-layout {
          gap: 1rem !important;
          padding: 1rem !important;
          background-color: ${bgColor} !important;
          display: grid !important;
          grid-template-columns: repeat(auto-fit, 300px) !important;
          justify-content: center !important;
        }
        .lk-focus-layout-wrapper {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 100 !important;
          background-color: ${bgColor} !important;
          padding: 3rem 3rem 3rem 5rem !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        .lk-control-bar {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 999 !important;
          background-color: ${isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(245, 245, 245, 0.95)'} !important;
        }
        .lk-focus-layout-wrapper .lk-focus-toggle-button,
        .lk-focused-participant .lk-focus-toggle-button {
          position: fixed !important;
          top: 1.5rem !important;
          left: 1.5rem !important;
          z-index: 103 !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          color: #fff !important;
          border: none !important;
          padding: 0.75rem !important;
          border-radius: 50% !important;
          width: 48px !important;
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          opacity: 1 !important;
          transition: background-color 0.2s !important;
        }
        .lk-focus-layout-wrapper .lk-focus-toggle-button:hover,
        .lk-focused-participant .lk-focus-toggle-button:hover {
          background-color: rgba(0, 0, 0, 0.9) !important;
        }
        .lk-focus-layout {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding-bottom: 69px !important;
        }
        .lk-focused-participant {
          flex: 1 1 auto !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
          position: relative !important;
          display: flex !important;
          z-index: 1 !important;
        }
        .lk-focused-participant .lk-participant-tile {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          flex: 1 1 auto !important;
          min-height: 0 !important;
        }
        .lk-focused-participant .lk-participant-tile video,
        .lk-focused-participant .lk-participant-tile .lk-participant-placeholder {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        .lk-carousel {
          display: none !important;
        }
        .lk-participant-tile:hover {
          transform: scale(1.02);
          transition: transform 0.2s;
        }
        .lk-participant-placeholder {
          background-color: ${tileColor} !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .lk-participant-placeholder svg {
          display: none !important;
        }
        .lk-participant-tile[data-lk-video-muted="true"] .lk-participant-placeholder::before {
          content: '';
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: ${isDark ? '#fff' : '#000'};
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        .lk-participant-tile[data-lk-video-muted="true"] .lk-participant-placeholder::after {
          content: attr(data-initial);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: ${isDark ? '#000' : '#fff'};
          font-size: 2.5rem;
          font-weight: 600;
          z-index: 2;
        }
        .lk-participant-metadata-item {
          background-color: ${isDark ? 'rgba(42, 42, 42, 0.9)' : 'rgba(208, 208, 208, 0.9)'} !important;
        }
        .lk-participant-name {
          color: ${isDark ? '#fff' : '#1f2937'} !important;
        }
        .lk-video-conference, .lk-video-conference-inner, .lk-grid-layout-wrapper {
          background-color: ${bgColor} !important;
        }
        .lk-control-bar {
          background-color: ${isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(245, 245, 245, 0.95)'} !important;
          border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} !important;
        }
        .lk-control-bar .lk-button, .lk-control-bar .lk-disconnect-button {
          background-color: ${isDark ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
          color: ${isDark ? '#fff' : '#1f2937'} !important;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} !important;
          padding: 0.625rem !important;
          min-width: auto !important;
          font-size: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .lk-button-group-menu > .lk-button {
          font-size: 1rem !important;
        }
        .lk-control-bar .lk-disconnect-button {
          background-color: #dc2626 !important;
          color: #fff !important;
          border: 1px solid #dc2626 !important;
        }
        .lk-control-bar .lk-disconnect-button:hover {
          background-color: #b91c1c !important;
        }
        .lk-control-bar .lk-button svg, .lk-control-bar .lk-disconnect-button svg {
          font-size: 1rem !important;
          display: block !important;
          margin: 0 auto !important;
        }
        .lk-control-bar .lk-button:hover {
          background-color: ${isDark ? 'rgba(55, 55, 55, 0.9)' : 'rgba(230, 230, 230, 0.9)'} !important;
        }
        .lk-control-bar .lk-chat-toggle,
        .lk-chat-toggle {
          display: none !important;
        }
        .lk-device-menu .lk-button {
          font-size: 0.875rem !important;
        }
        .lk-media-device-select .lk-button {
          font-size: 0.875rem !important;
        }
        .lk-button-group-menu > .lk-button {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0.625rem !important;
          min-width: 2.5rem !important;
        }
        .lk-button-group-menu > .lk-button svg {
          font-size: 1rem !important;
        }
        .lk-participant-tile {
          max-width: 300px !important;
          max-height: 225px !important;
          width: 300px !important;
          height: 225px !important;
          flex: 0 0 300px !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          background-color: ${tileColor} !important;
          border: 2px solid #000 !important;
        }
        .lk-participant-tile video,
        .lk-participant-tile .lk-participant-placeholder {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .lk-chat-toggle {
          display: none !important;
        }
        .lk-video-conference {
          display: flex !important;
          flex-direction: column !important;
        }
        .lk-video-conference-inner {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .lk-control-bar {
          position: relative !important;
          bottom: 0 !important;
          margin-top: auto !important;
        }
      `}</style>
    </div>
  );
};
