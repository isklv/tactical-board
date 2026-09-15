import React from 'react';
import {
  MousePointer,
  MoveRight,
  Split,
  Activity,
  ShieldAlert,
  Eraser,
  RotateCcw,
  Share2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTacticalStore } from '../../store/useTacticalStore';
import { ToolType } from '../../types/tactical';

interface TacticalToolbarProps {
  onOpenExport: () => void;
}

export const TacticalToolbar: React.FC<TacticalToolbarProps> = ({ onOpenExport }) => {
  const activeTool = useTacticalStore((s) => s.activeTool);
  const setActiveTool = useTacticalStore((s) => s.setActiveTool);
  const courtVariant = useTacticalStore((s) => s.courtVariant);
  const setCourtVariant = useTacticalStore((s) => s.setCourtVariant);
  const resetCourtPositions = useTacticalStore((s) => s.resetCourtPositions);
  const clearStepDrawings = useTacticalStore((s) => s.clearStepDrawings);
  const playTitle = useTacticalStore((s) => s.playTitle);
  const setPlayTitle = useTacticalStore((s) => s.setPlayTitle);

  const tools: { id: ToolType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'select', label: 'Выбор', icon: <MousePointer size={18} />, color: '#ffffff' },
    { id: 'movement', label: 'Рывок', icon: <MoveRight size={18} />, color: '#38bdf8' },
    { id: 'pass', label: 'Пас', icon: <Split size={18} />, color: '#f59e0b' },
    { id: 'dribble', label: 'Ведение', icon: <Activity size={18} />, color: '#10b981' },
    { id: 'screen', label: 'Заслон', icon: <ShieldAlert size={18} />, color: '#ec4899' },
    { id: 'eraser', label: 'Ластик', icon: <Eraser size={18} />, color: '#ef4444' },
  ];

  return (
    <header className="tactical-header">
      {/* Title & Sport / Court variant */}
      <div className="header-left">
        <input
          type="text"
          className="title-input"
          value={playTitle}
          onChange={(e) => setPlayTitle(e.target.value)}
          placeholder="Название комбинации..."
        />
        <div className="court-toggle-group">
          <button
            className={`court-toggle-btn ${courtVariant === 'half_court' ? 'active' : ''}`}
            onClick={() => setCourtVariant('half_court')}
            title="Половина площадки"
          >
            <Minimize2 size={15} />
            <span>1/2 Корта</span>
          </button>
          <button
            className={`court-toggle-btn ${courtVariant === 'full_court' ? 'active' : ''}`}
            onClick={() => setCourtVariant('full_court')}
            title="Полная площадка"
          >
            <Maximize2 size={15} />
            <span>Весь корт</span>
          </button>
        </div>
      </div>

      {/* Tool selector */}
      <div className="tools-bar">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              className={`tool-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
            >
              <span style={{ color: isActive ? '#fff' : t.color }}>{t.icon}</span>
              <span className="tool-label">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Actions (Reset, Clear, Share) */}
      <div className="header-right">
        <button
          className="action-icon-btn"
          onClick={clearStepDrawings}
          title="Стереть стрелки на этой фазе"
        >
          <Eraser size={16} />
          <span className="btn-text">Очистить стрелки</span>
        </button>
        <button
          className="action-icon-btn"
          onClick={resetCourtPositions}
          title="Сбросить игроков в стандартную расстановку"
        >
          <RotateCcw size={16} />
          <span className="btn-text">Сброс</span>
        </button>
        <button className="share-btn" onClick={onOpenExport} title="Поделиться и экспортировать">
          <Share2 size={16} />
          <span>Поделиться</span>
        </button>
      </div>
    </header>
  );
};
