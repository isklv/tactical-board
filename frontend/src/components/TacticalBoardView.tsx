import React, { useRef, useState, useEffect } from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { useTacticalStore } from '../store/useTacticalStore';
import { useTacticalAnimation } from '../hooks/useTacticalAnimation';
import { ResponsiveStage } from './canvas/ResponsiveStage';
import { BasketballCourt } from './court/BasketballCourt';
import { PlayerNode } from './canvas/PlayerNode';
import { BallNode } from './canvas/BallNode';
import { TacticalArrows } from './canvas/TacticalArrows';
import { TacticalToolbar } from './controls/TacticalToolbar';
import { MobilePlaybackBar } from './controls/MobilePlaybackBar';
import { ShareExportModal } from './modals/ShareExportModal';
import { TacticalDrawing, TacticalPoint } from '../types/tactical';

export const TacticalBoardView: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeDrawing, setActiveDrawing] = useState<TacticalDrawing | null>(null);

  const courtVariant = useTacticalStore((s) => s.courtVariant);
  const players = useTacticalStore((s) => s.players);
  const steps = useTacticalStore((s) => s.steps);
  const currentStepIndex = useTacticalStore((s) => s.currentStepIndex);
  const activeTool = useTacticalStore((s) => s.activeTool);
  const isPlaying = useTacticalStore((s) => s.isPlaying);
  const showGhost = useTacticalStore((s) => s.showGhost);
  const selectedEntityId = useTacticalStore((s) => s.selectedEntityId);

  const setSelectedEntityId = useTacticalStore((s) => s.setSelectedEntityId);
  const updatePlayerPosition = useTacticalStore((s) => s.updatePlayerPosition);
  const updateBallPosition = useTacticalStore((s) => s.updateBallPosition);
  const addDrawing = useTacticalStore((s) => s.addDrawing);
  const removeDrawing = useTacticalStore((s) => s.removeDrawing);
  const loadPlay = useTacticalStore((s) => s.loadPlay);

  // Animation interpolation hook
  const { playerPositions, ballPosition, ghostStep } = useTacticalAnimation();

  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-load shared play from URL hash if available
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#play=')) {
      try {
        const encoded = hash.replace('#play=', '');
        const jsonStr = decodeURIComponent(escape(atob(encoded)));
        const parsed = JSON.parse(jsonStr);
        if (parsed.steps && parsed.sport) {
          loadPlay(parsed);
        }
      } catch (err) {
        console.error('Failed to parse shared play from URL:', err);
      }
    }
  }, [loadPlay]);

  // Handle pointer down on stage (for tactical drawing)
  const handlePointerDown = (virtualPos: TacticalPoint) => {
    if (isPlaying || activeTool === 'select' || activeTool === 'eraser') return;

    const toolColorMap: Record<string, string> = {
      movement: '#38bdf8',
      pass: '#f59e0b',
      dribble: '#10b981',
      screen: '#ec4899',
      freehand: '#facc15',
    };

    const newDrawing: TacticalDrawing = {
      id: `drawing-${Date.now()}`,
      type: activeTool as any,
      points: [virtualPos.x, virtualPos.y],
      color: toolColorMap[activeTool] || '#ffffff',
      width: activeTool === 'screen' ? 4 : 3,
      stepIndex: currentStepIndex,
    };

    setActiveDrawing(newDrawing);
  };

  // Handle pointer move (drawing tracking)
  const handlePointerMove = (virtualPos: TacticalPoint) => {
    if (!activeDrawing) return;

    if (activeDrawing.type === 'freehand') {
      setActiveDrawing({
        ...activeDrawing,
        points: [...activeDrawing.points, virtualPos.x, virtualPos.y],
      });
    } else {
      // For movement, pass, dribble, screen: update endpoint
      setActiveDrawing({
        ...activeDrawing,
        points: [activeDrawing.points[0], activeDrawing.points[1], virtualPos.x, virtualPos.y],
      });
    }
  };

  // Handle pointer up (complete drawing)
  const handlePointerUp = () => {
    if (!activeDrawing) return;

    // Only save if it has a noticeable distance
    if (activeDrawing.points.length >= 4) {
      const x1 = activeDrawing.points[0];
      const y1 = activeDrawing.points[1];
      const x2 = activeDrawing.points[activeDrawing.points.length - 2];
      const y2 = activeDrawing.points[activeDrawing.points.length - 1];
      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist > 15 || activeDrawing.type === 'freehand') {
        addDrawing(activeDrawing);
      }
    }

    setActiveDrawing(null);
  };

  return (
    <div className="tactical-app-container">
      {/* Top Header & Toolbar */}
      <TacticalToolbar onOpenExport={() => setIsExportOpen(true)} />

      {/* Main Canvas Area */}
      <main className="canvas-wrapper">
        <ResponsiveStage
          courtVariant={courtVariant}
          stageRef={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Layer 1: Court Floor & Markings */}
          <Layer id="court-layer">
            <BasketballCourt variant={courtVariant} />
          </Layer>

          {/* Layer 2: Tactical Arrows & Drawings */}
          <Layer id="tactical-drawings-layer">
            <TacticalArrows
              drawings={currentStep.drawings}
              activeDrawing={activeDrawing}
              onSelectDrawing={(id) => {
                if (activeTool === 'eraser') {
                  removeDrawing(id);
                }
              }}
            />
          </Layer>

          {/* Layer 3: Players & Ball */}
          <Layer id="entities-layer">
            {/* Players */}
            {players.map((player) => {
              const pos = playerPositions[player.id] || { x: 0, y: 0 };
              const ghostPos =
                showGhost && !isPlaying && ghostStep?.playerPositions?.[player.id]
                  ? ghostStep.playerPositions[player.id]
                  : null;

              const isBallCarrier = ballPosition.attachedToPlayerId === player.id;
              const isSelected = selectedEntityId === player.id;

              return (
                <PlayerNode
                  key={player.id}
                  player={player}
                  position={pos}
                  ghostPosition={ghostPos}
                  hasBall={isBallCarrier}
                  isSelected={isSelected}
                  isDraggable={!isPlaying && activeTool === 'select'}
                  onPositionChange={(newPos) => {
                    updatePlayerPosition(player.id, newPos);
                  }}
                  onSelect={() => {
                    if (activeTool === 'select') {
                      setSelectedEntityId(player.id);
                    }
                  }}
                />
              );
            })}

            {/* Ball */}
            <BallNode
              position={ballPosition}
              ghostPosition={
                showGhost && !isPlaying && ghostStep?.ballPosition
                  ? ghostStep.ballPosition
                  : null
              }
              attachedToPlayerId={ballPosition.attachedToPlayerId}
              players={players}
              playerPositions={playerPositions}
              isDraggable={!isPlaying && activeTool === 'select'}
              onPositionChange={(newPos, attachedId) => {
                updateBallPosition(newPos, attachedId);
              }}
            />
          </Layer>
        </ResponsiveStage>
      </main>

      {/* Bottom Timeline & Mobile Playback Bar */}
      <MobilePlaybackBar />

      {/* Share & Export Modal */}
      <ShareExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stageRef={stageRef}
      />
    </div>
  );
};
