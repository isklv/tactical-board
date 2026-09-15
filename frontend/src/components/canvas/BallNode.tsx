import React from 'react';
import { Group, Circle, Line } from 'react-konva';
import { TacticalPoint, PlayerEntity } from '../../types/tactical';

interface BallNodeProps {
  position: TacticalPoint;
  ghostPosition?: TacticalPoint | null;
  attachedToPlayerId?: string | null;
  players: PlayerEntity[];
  playerPositions: Record<string, TacticalPoint>;
  isDraggable?: boolean;
  onPositionChange: (pos: TacticalPoint, attachedToPlayerId?: string | null) => void;
}

export const BallNode: React.FC<BallNodeProps> = ({
  position,
  ghostPosition,
  attachedToPlayerId,
  players,
  playerPositions,
  isDraggable = true,
  onPositionChange,
}) => {
  const radius = 11;

  // Find nearest player when ball is dropped to see if it should snap
  const handleDragEnd = (e: any) => {
    const dropX = Math.round(e.target.x());
    const dropY = Math.round(e.target.y());

    let nearestPlayerId: string | null = null;
    let minDistance = 45; // snap threshold in virtual units

    for (const player of players) {
      const pPos = playerPositions[player.id];
      if (!pPos) continue;
      const dist = Math.hypot(dropX - pPos.x, dropY - pPos.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearestPlayerId = player.id;
      }
    }

    if (nearestPlayerId) {
      const pPos = playerPositions[nearestPlayerId];
      onPositionChange({ x: pPos.x + 18, y: pPos.y + 18 }, nearestPlayerId);
    } else {
      onPositionChange({ x: dropX, y: dropY }, null);
    }
  };

  return (
    <Group>
      {/* Ghost Ball trajectory from previous step */}
      {ghostPosition && (
        <Group listening={false}>
          <Line
            points={[ghostPosition.x, ghostPosition.y, position.x, position.y]}
            stroke="#f97316"
            strokeWidth={2}
            dash={[4, 4]}
            opacity={0.5}
          />
          <Circle
            x={ghostPosition.x}
            y={ghostPosition.y}
            radius={radius - 2}
            fill="#ea580c"
            opacity={0.35}
          />
        </Group>
      )}

      {/* Main Interactive Basketball */}
      <Group
        x={position.x}
        y={position.y}
        draggable={isDraggable}
        onDragMove={(e) => {
          onPositionChange(
            { x: Math.round(e.target.x()), y: Math.round(e.target.y()) },
            attachedToPlayerId
          );
        }}
        onDragEnd={handleDragEnd}
      >
        {/* Mobile touch expander (min 44px hit target) */}
        <Circle radius={24} fill="transparent" />

        {/* Outer ball circle */}
        <Circle
          radius={radius}
          fill="#f97316"
          stroke="#9a3412"
          strokeWidth={1.5}
          shadowColor="#000000"
          shadowBlur={5}
          shadowOffset={{ x: 0, y: 2 }}
          shadowOpacity={0.5}
        />

        {/* Basketball seams */}
        <Line
          points={[-radius + 2, 0, radius - 2, 0]}
          stroke="#431407"
          strokeWidth={1.5}
          listening={false}
        />
        <Line
          points={[0, -radius + 2, 0, radius - 2]}
          stroke="#431407"
          strokeWidth={1.5}
          listening={false}
        />
      </Group>
    </Group>
  );
};
