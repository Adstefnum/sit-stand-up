"use client";

import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const SitStandTimer: React.FC = () => {
  const [status, setStatus] = useState<'Idle' | 'Sitting' | 'Standing'>('Idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [sitTime, setSitTime] = useState(0);
  const [standTime, setStandTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
    const audioContext = useRef<AudioContext | null>(null);


  useEffect(() => {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    loadPreferences();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (status === 'Sitting') {
        setStatus('Standing');
        setTimeLeft(standTime * 60);
        playNotification();
      } else if (status === 'Standing') {
        setStatus('Sitting');
        setTimeLeft(sitTime * 60);
        playNotification();
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, status, sitTime, standTime]);

  const loadPreferences = async () => {
    const prefs: any = await invoke('load_preferences');
    setSitTime(prefs.sit_time);
    setStandTime(prefs.stand_time);
  };

  const savePreferences = async () => {
    await invoke('save_preferences', { sitTime, standTime });
  };

  const startTimer = async () => {
    await savePreferences();
    setStatus('Sitting');
    setTimeLeft(sitTime * 60);
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStatus('Idle');
    setTimeLeft(0);
  };

  const restartTimer = async () => {
    await savePreferences();
    setStatus('Sitting');
    setTimeLeft(sitTime * 60);
    setIsRunning(true);
    setIsPaused(false);
  };

  const showNotification = async (title: string, body: string) => {
    try {
      await invoke('show_notification', { title, body });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

const playNotification = async () => {
    if (!audioContext.current) return;

    // Create an oscillator
    const oscillator = audioContext.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.current.currentTime); // 440 Hz - A4 note

    // Create a gain node
    const gainNode = audioContext.current.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.current.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 1);

    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    // Start and stop the oscillator
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + 1);

    const title = status === 'Sitting' ? 'Time to Stand!' : 'Time to Sit!';
    const body = `Your ${status.toLowerCase()} session has ended.`;
    await showNotification(title, body);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold mb-8 text-black">{status}</h1>
      <div className="text-4xl mb-8 text-black">{formatTime(timeLeft)}</div>
      <div className="flex gap-4 mb-4">
        <div>
          <label htmlFor="sitTimer" className="block text-sm font-medium text-gray-700">
            Sit Timer (minutes)
          </label>
          <input
            type="number"
            id="sitTimer"
            value={sitTime}
            onChange={(e) => setSitTime(parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
          />
        </div>
        <div>
          <label htmlFor="standTimer" className="block text-sm font-medium text-gray-700">
            Stand Timer (minutes)
          </label>
          <input
            type="number"
            id="standTimer"
            value={standTime}
            onChange={(e) => setStandTime(parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
          />
        </div>
      </div>
      <div className="flex gap-4">
        {!isRunning && (
          <button
            onClick={startTimer}
            className="px-4 py-2 font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          >
            Start
          </button>
        )}
        {isRunning && !isPaused && (
          <button
            onClick={pauseTimer}
            className="px-4 py-2 font-semibold text-white bg-yellow-500 rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
          >
            Pause
          </button>
        )}
        {isRunning && isPaused && (
          <button
            onClick={resumeTimer}
            className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            Resume
          </button>
        )}
        {isRunning && (
          <button
            onClick={stopTimer}
            className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
          >
            Stop
          </button>
        )}
        <button
          onClick={restartTimer}
          className="px-4 py-2 font-semibold text-white bg-purple-500 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default SitStandTimer;