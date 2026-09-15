import React from 'react';
import { Group, Line } from 'react-konva';
import { TacticalDrawing } from '../../types/tactical';

interface TacticalArrowsProps {
  drawings: TacticalDrawing[];
  activeDrawing?: TacticalDrawing | null;
  onSelectDrawing?: (id: string) => void;
}

// Helper to compute arrowhead points at the end of a line
function computeArrowhead(x1: number, y1: number, x2: number, y2: number, headLength = 22) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const leftX = x2 - headLength * Math.cos(angle - Math.PI / 6);
  const leftY = y2 - headLength * Math.sin(angle - Math.PI / 6);
  const rightX = x2 - headLength * Math.cos(angle + Math.PI / 6);
  const rightY = y2 - headLength * Math.sin(angle + Math.PI / 6);

  return [leftX, leftY, x2, y2, rightX, rightY];
}

// Helper to compute screen T-bar perpendicular line at the end
function computeScreenTBar(x1: number, y1: number, x2: number, y2: number, barHalfLength = 22) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const perpAngle = angle + Math.PI / 2;

  const tx1 = x2 + barHalfLength * Math.cos(perpAngle);
  const ty1 = y2 + barHalfLength * Math.sin(perpAngle);
  const tx2 = x2 - barHalfLength * Math.cos(perpAngle);
  const ty2 = y2 - barHalfLength * Math.sin(perpAngle);

  return [tx1, ty1, tx2, ty2];
}

// Helper to create zigzag points for dribble
function computeZigzag(x1: number, y1: number, x2: number, y2: number, amplitude = 13) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 20) return [x1, y1, x2, y2];

  const actualSegments = Math.max(4, Math.floor(dist / 25));
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;
  const points: number[] = [x1, y1];

  for (let i = 1; i < actualSegments; i++) {
    const t = i / actualSegments;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const sign = i % 2 === 1 ? 1 : -1;
    const zx = px + sign * amplitude * Math.cos(perpAngle);
    const zy = py + sign * amplitude * Math.sin(perpAngle);
    points.push(zx, zy);
  }

  points.push(x2, y2);
  return points;
}

export const TacticalArrows: React.FC<TacticalArrowsProps> = ({
  drawings,
  activeDrawing,
  onSelectDrawing,
}) => {
  const renderItem = (drawing: TacticalDrawing, isPreview = false) => {
    const { id, type, points, color, width } = drawing;
    if (points.length < 4) return null;

    const x1 = points[0];
    const y1 = points[1];
    const x2 = points[points.length - 2];
    const y2 = points[points.length - 1];

    if (type === 'movement') {
      // Solid arrow for movement
      const arrowPoints = computeArrowhead(x1, y1, x2, y2);
      return (
        <Group key={id} onClick={() => onSelectDrawing?.(id)} onTap={() => onSelectDrawing?.(id)}>
          <Line
            points={points}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
          <Line
            points={arrowPoints}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
        </Group>
      );
    }

    if (type === 'pass') {
      // Dashed arrow for ball pass
      const arrowPoints = computeArrowhead(x1, y1, x2, y2);
      return (
        <Group key={id} onClick={() => onSelectDrawing?.(id)} onTap={() => onSelectDrawing?.(id)}>
          <Line
            points={points}
            stroke={color}
            strokeWidth={width}
            dash={[10, 8]}
            lineCap="round"
            lineJoin="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
          <Line
            points={arrowPoints}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
        </Group>
      );
    }

    if (type === 'dribble') {
      // Zigzag line with arrowhead
      const zigzagPoints = computeZigzag(x1, y1, x2, y2);
      const lastSegmentIdx = zigzagPoints.length - 4;
      const arrowPoints = computeArrowhead(
        zigzagPoints[lastSegmentIdx],
        zigzagPoints[lastSegmentIdx + 1],
        x2,
        y2
      );

      return (
        <Group key={id} onClick={() => onSelectDrawing?.(id)} onTap={() => onSelectDrawing?.(id)}>
          <Line
            points={zigzagPoints}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
          <Line
            points={arrowPoints}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
        </Group>
      );
    }

    if (type === 'screen') {
      // Screen / Pick: Solid line with perpendicular T-bar cap
      const tBarPoints = computeScreenTBar(x1, y1, x2, y2);
      return (
        <Group key={id} onClick={() => onSelectDrawing?.(id)} onTap={() => onSelectDrawing?.(id)}>
          <Line
            points={points}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            opacity={isPreview ? 0.7 : 0.95}
          />
          <Line
            points={tBarPoints}
            stroke={color}
            strokeWidth={width + 1.5}
            lineCap="square"
            opacity={isPreview ? 0.7 : 0.95}
          />
        </Group>
      );
    }

    if (type === 'freehand') {
      return (
        <Line
          key={id}
          points={points}
          stroke={color}
          strokeWidth={width}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={isPreview ? 0.7 : 0.95}
        />
      );
    }

    return null;
  };

  return (
    <Group id="tactical-drawings">
      {drawings.map((d) => renderItem(d, false))}
      {activeDrawing && renderItem(activeDrawing, true)}
    </Group>
  );
};
