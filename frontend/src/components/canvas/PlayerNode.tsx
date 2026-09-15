import React from 'react';
import { Group, Circle, Text, Line } from 'react-konva';
import { PlayerEntity, TacticalPoint } from '../../types/tactical';

interface PlayerNodeProps {
  player: PlayerEntity;
  position: TacticalPoint;
  ghostPosition?: TacticalPoint | null;
  hasBall?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  onPositionChange?: (pos: TacticalPoint) => void;
  onSelect?: () => void;
}

export const PlayerNode: React.FC<PlayerNodeProps> = ({
  player,
  position,
  ghostPosition,
  hasBall = false,
  isSelected = false,
  isDraggable = true,
  onPositionChange,
  onSelect,
}) => {
  const radius = 19;

  return (
    <Group>
      {/* Ghost (Onion-skinning) from previous step */}
      {ghostPosition && (
        <Group listening={false}>
          {/* Movement trajectory path from ghost to current position */}
          <Line
            points={[ghostPosition.x, ghostPosition.y, position.x, position.y]}
            stroke={player.color}
            strokeWidth={2}
            dash={[6, 6]}
            opacity={0.5}
          />
          {/* Ghost token */}
          <Circle
            x={ghostPosition.x}
            y={ghostPosition.y}
            radius={radius - 2}
            fill={player.color}
            opacity={0.3}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
          <Text
            x={ghostPosition.x - radius}
            y={ghostPosition.y - 7}
            width={radius * 2}
            align="center"
            text={player.number.toString()}
            fontSize={12}
            fontStyle="bold"
            fill="#ffffff"
            opacity={0.4}
          />
        </Group>
      )}

      {/* Main Interactive Player Token */}
      <Group
        x={position.x}
        y={position.y}
        draggable={isDraggable}
        onDragMove={(e) => {
          if (onPositionChange) {
            onPositionChange({
              x: Math.round(e.target.x()),
              y: Math.round(e.target.y()),
            });
          }
        }}
        onClick={onSelect}
        onTap={onSelect}
      >
        {/* Expanded Invisible Touch Area for Mobile (Min 48px touch target) */}
        <Circle radius={28} fill="transparent" />

        {/* Selection Ring */}
        {isSelected && (
          <Circle
            radius={radius + 6}
            stroke="#f59e0b"
            strokeWidth={3}
            dash={[6, 3]}
          />
        )}

        {/* Ball Possession Halo Ring */}
        {hasBall && (
          <Circle
            radius={radius + 4}
            stroke="#f97316"
            strokeWidth={3}
            shadowColor="#ea580c"
            shadowBlur={8}
            shadowOpacity={0.8}
          />
        )}

        {/* Player Body Badge */}
        <Circle
          radius={radius}
          fill={player.color}
          stroke="#ffffff"
          strokeWidth={2.5}
          shadowColor="#000000"
          shadowBlur={6}
          shadowOffset={{ x: 0, y: 3 }}
          shadowOpacity={0.4}
        />

        {/* Jersey Number */}
        <Text
          x={-radius}
          y={-8}
          width={radius * 2}
          align="center"
          text={player.number.toString()}
          fontSize={15}
          fontStyle="bold"
          fill={player.textColor || '#ffffff'}
          listening={false}
        />

        {/* Player Name / Position Label below token */}
        {player.name && (
          <Text
            x={-30}
            y={radius + 3}
            width={60}
            align="center"
            text={player.name}
            fontSize={11}
            fontStyle="bold"
            fill="#cbd5e1"
            listening={false}
            shadowColor="#000000"
            shadowBlur={4}
            shadowOpacity={0.8}
          />
        )}
      </Group>
    </Group>
  );
};
