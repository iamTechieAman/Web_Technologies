'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export function useStepPlayer(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const next = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep(s => s + 1);
      }, speed);
    } else {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, totalSteps, speed]);

  return {
    currentStep,
    setCurrentStep,
    isPlaying,
    setIsPlaying,
    play,
    pause,
    stop,
    next,
    prev,
    speed,
    setSpeed
  };
}
