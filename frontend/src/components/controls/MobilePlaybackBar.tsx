import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Copy,
  Trash2,
  Repeat,
  Ghost,
} from 'lucide-react';
import { useTacticalStore } from '../../store/useTacticalStore';

export const MobilePlaybackBar: React.FC = () => {
  const steps = useTacticalStore((s) => s.steps);
  const currentStepIndex = useTacticalStore((s) => s.currentStepIndex);
  const setCurrentStepIndex = useTacticalStore((s) => s.setCurrentStepIndex);
  const addStep = useTacticalStore((s) => s.addStep);
  const duplicateStep = useTacticalStore((s) => s.duplicateStep);
  const deleteStep = useTacticalStore((s) => s.deleteStep);

  const isPlaying = useTacticalStore((s) => s.isPlaying);
  const setIsPlaying = useTacticalStore((s) => s.setIsPlaying);
  const stepProgress = useTacticalStore((s) => s.stepProgress);
  const speed = useTacticalStore((s) => s.speed);
  const setSpeed = useTacticalStore((s) => s.setSpeed);
  const isLooping = useTacticalStore((s) => s.isLooping);
  const toggleLoop = useTacticalStore((s) => s.toggleLoop);
  const showGhost = useTacticalStore((s) => s.showGhost);
  const toggleGhost = useTacticalStore((s) => s.toggleGhost);
  const goToNextStep = useTacticalStore((s) => s.goToNextStep);
  const goToPrevStep = useTacticalStore((s) => s.goToPrevStep);

  const speedOptions: (0.5 | 1 | 1.5 | 2)[] = [0.5, 1, 1.5, 2];

  const cycleSpeed = () => {
    const currentIndex = speedOptions.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setSpeed(speedOptions[nextIndex]);
  };

  // Calculate total play progress for the timeline bar
  const totalSteps = steps.length;
  const overallProgress =
    totalSteps > 1
      ? ((currentStepIndex + stepProgress) / (totalSteps - 1)) * 100
      : 100;

  return (
    <footer className="tactical-footer">
      {/* Playback progress bar */}
      <div className="timeline-progress-track">
        <div
          className="timeline-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
        />
      </div>

      <div className="footer-content">
        {/* Step Manager Pills */}
        <div className="steps-container">
          <div className="steps-scroll">
            {steps.map((step, idx) => {
              const isActive = currentStepIndex === idx;
              return (
                <button
                  key={step.id}
                  className={`step-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(idx);
                  }}
                >
                  <span className="step-num">{idx + 1}</span>
                  <span className="step-label">Фаза {idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="step-actions">
            <button className="step-action-btn primary" onClick={addStep} title="Добавить следующий шаг">
              <Plus size={16} />
              <span className="step-action-text">+ Фаза</span>
            </button>
            <button
              className="step-action-btn"
              onClick={() => duplicateStep(currentStepIndex)}
              title="Дублировать текущую фазу"
            >
              <Copy size={15} />
            </button>
            {steps.length > 1 && (
              <button
                className="step-action-btn danger"
                onClick={() => deleteStep(currentStepIndex)}
                title="Удалить эту фазу"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Playback Controller Controls */}
        <div className="playback-controls">
          {/* Ghost / Onion Skinning Toggle */}
          <button
            className={`control-toggle-btn ${showGhost ? 'active' : ''}`}
            onClick={toggleGhost}
            title={showGhost ? 'Призраки (позиции с прошлого шага): ВКЛ' : 'Призраки: ВЫКЛ'}
          >
            <Ghost size={16} />
            <span className="toggle-label">Призраки</span>
          </button>

          {/* Loop Toggle */}
          <button
            className={`control-toggle-btn ${isLooping ? 'active' : ''}`}
            onClick={toggleLoop}
            title={isLooping ? 'Зацикливание: ВКЛ' : 'Зацикливание: ВЫКЛ'}
          >
            <Repeat size={16} />
          </button>

          {/* Speed Button */}
          <button className="speed-btn" onClick={cycleSpeed} title="Скорость анимации">
            {speed}x
          </button>

          {/* Step Prev */}
          <button
            className="playback-btn"
            onClick={() => {
              setIsPlaying(false);
              goToPrevStep();
            }}
            disabled={currentStepIndex === 0}
            title="Предыдущая фаза"
          >
            <SkipBack size={18} />
          </button>

          {/* Play / Pause */}
          <button
            className="playback-btn play-main"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? <Pause size={22} fill="#ffffff" /> : <Play size={22} fill="#ffffff" />}
          </button>

          {/* Step Next */}
          <button
            className="playback-btn"
            onClick={() => {
              setIsPlaying(false);
              goToNextStep();
            }}
            disabled={currentStepIndex === steps.length - 1}
            title="Следующая фаза"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
};
