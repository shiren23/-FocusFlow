import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ isOpen, onClose, taskTitle }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(seconds => seconds - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsFinished(true);
      // Play a subtle chime
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed', e));
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(300);
      setIsActive(true);
      setIsFinished(false);
    } else {
      setIsActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-xl transition-all duration-500">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="text-center w-full max-w-2xl px-6">
        <h2 className="text-2xl text-morandi-clay font-medium mb-8 animate-pulse">
          Focus Mode: {taskTitle}
        </h2>
        
        <div className="text-[12rem] font-bold text-white tracking-tighter leading-none font-mono">
          {formatTime(timeLeft)}
        </div>

        <div className="mt-12 flex justify-center gap-8">
          {!isFinished ? (
            <>
              <button 
                onClick={() => setIsActive(!isActive)}
                className="p-6 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-105"
              >
                {isActive ? <Pause size={48} /> : <Play size={48} fill="currentColor" />}
              </button>
              <button 
                onClick={() => setTimeLeft(300)}
                className="p-6 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-all"
              >
                <RotateCcw size={48} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 animate-fade-in-up">
              <p className="text-3xl text-morandi-sage text-center">Excellent! Keep the momentum?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setTimeLeft(300); setIsActive(true); setIsFinished(false); }}
                  className="px-8 py-3 bg-morandi-sage text-white rounded-full text-xl hover:bg-morandi-sageDark transition-colors"
                >
                  Continue Focus
                </button>
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-white/10 text-white rounded-full text-xl hover:bg-white/20 transition-colors"
                >
                  Take a Break
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
