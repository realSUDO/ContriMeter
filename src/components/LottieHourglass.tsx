import React from 'react';

interface HourglassIconProps {
  isActive: boolean;
}

const HourglassIcon = ({ isActive }: HourglassIconProps) => {
  if (isActive) {
    return (
      <div className="hourglass-animated">
        <svg width="16" height="24" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
          <path className="sand-top" d="M15,45 Q15,20 50,20 Q85,20 85,45 Q85,70 50,80 Q15,70 15,45 Z" fill="currentColor" />
          <path className="sand-bottom" d="M15,115 Q15,90 50,80 Q85,90 85,115 Q85,140 50,140 Q15,140 15,115 Z" fill="currentColor" />
          <path className="glass-frame" d="M30,20 H70 Q85,20 85,45 Q85,70 55,80 Q85,90 85,115 Q85,140 70,140 H30 Q15,140 15,115 Q15,90 45,80 Q15,70 15,45 Q15,20 30,20 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
          <path d="M30,30 Q25,45 30,60" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
          <line className="sand-stream" x1="50" y1="80" x2="50" y2="130" stroke="currentColor" strokeWidth="2.5" />
        </svg>
        
        <style jsx>{`
          .hourglass-animated {
            display: inline-block;
            animation: smooth-flip 4s cubic-bezier(0.85, 0, 0.15, 1) infinite;
          }

          .sand-top {
            animation: smooth-drain 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            transform-origin: 50px 80px;
            transform: scale(1);
          }

          .sand-bottom {
            animation: smooth-fill 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            transform-origin: 50px 140px;
            transform: scale(0);
          }

          .sand-stream {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: smooth-stream 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          }

          @keyframes smooth-flip {
            0%, 15% { transform: rotate(180deg); }
            25%, 100% { transform: rotate(0deg); }
          }

          @keyframes smooth-drain {
            0%, 25% { transform: scale(1); opacity: 1; }
            80%, 100% { transform: scale(0); opacity: 0; }
          }

          @keyframes smooth-fill {
            0%, 30% { transform: scale(0); }
            80%, 100% { transform: scale(1); }
          }

          @keyframes smooth-stream {
            0%, 27% { stroke-dashoffset: 50; }
            35%, 75% { stroke-dashoffset: 0; }
            82%, 100% { stroke-dashoffset: 50; }
          }
        `}</style>
      </div>
    );
  }

  // Static hourglass (filled)
  return (
    <svg width="16" height="24" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
      <path d="M15,115 Q15,90 50,80 Q85,90 85,115 Q85,140 50,140 Q15,140 15,115 Z" fill="currentColor" />
      <path d="M30,20 H70 Q85,20 85,45 Q85,70 55,80 Q85,90 85,115 Q85,140 70,140 H30 Q15,140 15,115 Q15,90 45,80 Q15,70 15,45 Q15,20 30,20 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M30,30 Q25,45 30,60" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
};

export default HourglassIcon;
