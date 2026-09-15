import { useEffect, useRef } from 'react';
import { useTacticalStore } from '../store/useTacticalStore';
import { TacticalPoint } from '../types/tactical';

// Smooth ease-in-out cubic interpolation
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useTacticalAnimation() {
  const isPlaying = useTacticalStore((s) => s.isPlaying);
  const steps = useTacticalStore((s) => s.steps);
  const currentStepIndex = useTacticalStore((s) => s.currentStepIndex);
  const stepProgress = useTacticalStore((s) => s.stepProgress);
  const speed = useTacticalStore((s) => s.speed);
  const isLooping = useTacticalStore((s) => s.isLooping);

  const setIsPlaying = useTacticalStore((s) => s.setIsPlaying);
  const setStepProgress = useTacticalStore((s) => s.setStepProgress);
  const setCurrentStepIndex = useTacticalStore((s) => s.setCurrentStepIndex);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const currentStep = steps[currentStepIndex];
    const duration = (currentStep?.duration || 1.8) / speed;

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const deltaSec = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const newProgress = stepProgress + deltaSec / duration;

      if (newProgress >= 1) {
        // Reached end of current step transition
        if (currentStepIndex < steps.length - 1) {
          // Go to next step
          setCurrentStepIndex(currentStepIndex + 1);
          setStepProgress(0);
        } else {
          // End of whole play
          if (isLooping && steps.length > 1) {
            setCurrentStepIndex(0);
            setStepProgress(0);
          } else {
            setIsPlaying(false);
            setStepProgress(1);
          }
        }
      } else {
        setStepProgress(newProgress);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isPlaying,
    currentStepIndex,
    stepProgress,
    steps,
    speed,
    isLooping,
    setCurrentStepIndex,
    setIsPlaying,
    setStepProgress,
  ]);

  // Compute active interpolated positions for players and ball
  const currentStep = steps[currentStepIndex] || steps[0];
  const nextStep = steps[currentStepIndex + 1];

  const interpolatedPlayerPositions: Record<string, TacticalPoint> = {};
  let interpolatedBallPosition: TacticalPoint & { attachedToPlayerId: string | null } = {
    ...currentStep.ballPosition,
  };

  const t = easeInOutCubic(stepProgress);

  if (isPlaying && nextStep) {
    // Interpolate players
    for (const [id, startPos] of Object.entries(currentStep.playerPositions)) {
      const targetPos = nextStep.playerPositions[id] || startPos;
      interpolatedPlayerPositions[id] = {
        x: Math.round(startPos.x + (targetPos.x - startPos.x) * t),
        y: Math.round(startPos.y + (targetPos.y - startPos.y) * t),
      };
    }

    // Interpolate ball
    const startBall = currentStep.ballPosition;
    const endBall = nextStep.ballPosition;

    // Check if ball is passed between different players
    if (
      startBall.attachedToPlayerId &&
      endBall.attachedToPlayerId &&
      startBall.attachedToPlayerId !== endBall.attachedToPlayerId
    ) {
      // Ball in flight between player A and player B!
      const startP = currentStep.playerPositions[startBall.attachedToPlayerId] || startBall;
      const endP = nextStep.playerPositions[endBall.attachedToPlayerId] || endBall;
      interpolatedBallPosition = {
        x: Math.round(startP.x + (endP.x - startP.x) * t),
        y: Math.round(startP.y + (endP.y - startP.y) * t),
        attachedToPlayerId: t >= 0.85 ? endBall.attachedToPlayerId : null,
      };
    } else if (endBall.attachedToPlayerId) {
      // Ball held by single player
      const targetPlayerPos = interpolatedPlayerPositions[endBall.attachedToPlayerId];
      if (targetPlayerPos) {
        interpolatedBallPosition = {
          x: targetPlayerPos.x + 18,
          y: targetPlayerPos.y + 18,
          attachedToPlayerId: endBall.attachedToPlayerId,
        };
      } else {
        interpolatedBallPosition = {
          x: Math.round(startBall.x + (endBall.x - startBall.x) * t),
          y: Math.round(startBall.y + (endBall.y - startBall.y) * t),
          attachedToPlayerId: endBall.attachedToPlayerId,
        };
      }
    } else {
      // Ball moving freely
      interpolatedBallPosition = {
        x: Math.round(startBall.x + (endBall.x - startBall.x) * t),
        y: Math.round(startBall.y + (endBall.y - startBall.y) * t),
        attachedToPlayerId: null,
      };
    }
  } else {
    // Static state
    Object.assign(interpolatedPlayerPositions, currentStep.playerPositions);
    interpolatedBallPosition = { ...currentStep.ballPosition };
  }

  // Ghost positions from previous step for onion skinning
  const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;

  return {
    playerPositions: interpolatedPlayerPositions,
    ballPosition: interpolatedBallPosition,
    ghostStep: prevStep,
  };
}
