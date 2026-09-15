import React from 'react';
import { Group, Rect, Line, Circle, Arc, Path } from 'react-konva';
import { BasketballCourtVariant } from '../../types/tactical';

export const HALF_COURT_BOUNDS = { width: 700, height: 680 };
export const FULL_COURT_BOUNDS = { width: 960, height: 540 };

interface BasketballCourtProps {
  variant: BasketballCourtVariant;
}

export const BasketballCourt: React.FC<BasketballCourtProps> = ({ variant }) => {
  const isHalfCourt = variant === 'half_court';

  if (isHalfCourt) {
    const W = HALF_COURT_BOUNDS.width;
    const H = HALF_COURT_BOUNDS.height;
    const margin = 20;
    const courtW = W - margin * 2; // 660
    const courtH = H - margin * 2; // 640
    const courtLeft = margin; // 20
    const courtTop = margin; // 20
    const rimX = W / 2; // 350
    const rimY = courtTop + 70; // 90
    const keyW = 240;
    const keyH = 290;
    const keyLeft = rimX - keyW / 2; // 230
    const keyTop = courtTop; // 20
    const ftY = keyTop + keyH; // 310
    const ftRadius = 88;
    const threePtRadius = 340;
    const cornerXDist = 290; // Distance from rim to corner 3-pt line
    const yIntersect = rimY + Math.sqrt(threePtRadius * threePtRadius - cornerXDist * cornerXDist);
    const halfCourt3PtPath = `M ${rimX - cornerXDist} ${courtTop} L ${rimX - cornerXDist} ${yIntersect} A ${threePtRadius} ${threePtRadius} 0 0 0 ${rimX + cornerXDist} ${yIntersect} L ${rimX + cornerXDist} ${courtTop}`;

    return (
      <Group id="court-background" listening={false}>
        {/* Parquet/Court Floor */}
        <Rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="#1e222d"
          cornerRadius={12}
        />

        {/* Court Boundary Line */}
        <Rect
          x={courtLeft}
          y={courtTop}
          width={courtW}
          height={courtH}
          stroke="#475569"
          strokeWidth={3}
          fill="#161922"
        />

        {/* Backboard */}
        <Line
          points={[rimX - 50, courtTop + 30, rimX + 50, courtTop + 30]}
          stroke="#94a3b8"
          strokeWidth={5}
          lineCap="round"
        />

        {/* Rim & Ring */}
        <Circle
          x={rimX}
          y={rimY}
          radius={16}
          stroke="#f97316"
          strokeWidth={3.5}
        />

        {/* Rim connector */}
        <Line
          points={[rimX, courtTop + 30, rimX, rimY - 16]}
          stroke="#94a3b8"
          strokeWidth={3.5}
        />

        {/* Restricted Area Arc */}
        <Arc
          x={rimX}
          y={rimY}
          innerRadius={65}
          outerRadius={65}
          angle={180}
          rotation={0}
          stroke="#475569"
          strokeWidth={2.5}
        />

        {/* Key / Paint (Trapezoid/Rectangle) */}
        <Rect
          x={keyLeft}
          y={keyTop}
          width={keyW}
          height={keyH}
          stroke="#475569"
          strokeWidth={2.5}
          fill="#1a202c"
        />

        {/* Free Throw Circle (Top Solid) */}
        <Arc
          x={rimX}
          y={ftY}
          innerRadius={ftRadius}
          outerRadius={ftRadius}
          angle={180}
          rotation={0}
          stroke="#475569"
          strokeWidth={2.5}
        />

        {/* Free Throw Circle (Bottom Dashed inside the paint) */}
        <Arc
          x={rimX}
          y={ftY}
          innerRadius={ftRadius}
          outerRadius={ftRadius}
          angle={180}
          rotation={180}
          stroke="#475569"
          strokeWidth={2.5}
          dash={[10, 10]}
        />

        {/* Continuous 3-Point Line (Seamless Corners + Arc) */}
        <Path
          data={halfCourt3PtPath}
          stroke="#475569"
          strokeWidth={2.5}
          lineCap="round"
          lineJoin="round"
        />

        {/* Half-court Line (Baseline on bottom) */}
        <Line
          points={[courtLeft, courtTop + courtH, courtLeft + courtW, courtTop + courtH]}
          stroke="#475569"
          strokeWidth={3}
        />

        {/* Center Circle Arc at half court */}
        <Arc
          x={rimX}
          y={courtTop + courtH}
          innerRadius={88}
          outerRadius={88}
          angle={180}
          rotation={180}
          stroke="#475569"
          strokeWidth={2.5}
        />
      </Group>
    );
  }

  // Full Court (960 x 540)
  const W = FULL_COURT_BOUNDS.width;
  const H = FULL_COURT_BOUNDS.height;
  const margin = 20;
  const courtW = W - margin * 2;
  const courtH = H - margin * 2;
  const courtLeft = margin;
  const courtTop = margin;
  const midX = W / 2;
  const midY = H / 2;

  // Left Basket
  const leftRimX = courtLeft + 65;
  const leftRimY = midY;
  // Right Basket
  const rightRimX = courtLeft + courtW - 65;
  const rightRimY = midY;

  // Full-court 3-point paths
  const threePtRadiusFull = 240;
  const cornerYDistFull = 180;
  const xDeltaFull = Math.sqrt(threePtRadiusFull * threePtRadiusFull - cornerYDistFull * cornerYDistFull);
  const leftXIntersect = leftRimX + xDeltaFull;
  const left3PtPath = `M ${courtLeft} ${midY - cornerYDistFull} L ${leftXIntersect} ${midY - cornerYDistFull} A ${threePtRadiusFull} ${threePtRadiusFull} 0 0 1 ${leftXIntersect} ${midY + cornerYDistFull} L ${courtLeft} ${midY + cornerYDistFull}`;

  const rightXIntersect = rightRimX - xDeltaFull;
  const right3PtPath = `M ${courtLeft + courtW} ${midY - cornerYDistFull} L ${rightXIntersect} ${midY - cornerYDistFull} A ${threePtRadiusFull} ${threePtRadiusFull} 0 0 0 ${rightXIntersect} ${midY + cornerYDistFull} L ${courtLeft + courtW} ${midY + cornerYDistFull}`;

  return (
    <Group id="court-background" listening={false}>
      {/* Floor */}
      <Rect
        x={0}
        y={0}
        width={W}
        height={H}
        fill="#1e222d"
        cornerRadius={12}
      />

      {/* Outer Court Boundary */}
      <Rect
        x={courtLeft}
        y={courtTop}
        width={courtW}
        height={courtH}
        stroke="#475569"
        strokeWidth={3}
        fill="#161922"
      />

      {/* Midcourt Line */}
      <Line
        points={[midX, courtTop, midX, courtTop + courtH]}
        stroke="#475569"
        strokeWidth={2.5}
      />

      {/* Center Circle */}
      <Circle
        x={midX}
        y={midY}
        radius={70}
        stroke="#475569"
        strokeWidth={2.5}
      />

      {/* LEFT BASKET */}
      <Line
        points={[courtLeft + 25, midY - 45, courtLeft + 25, midY + 45]}
        stroke="#94a3b8"
        strokeWidth={4.5}
      />
      <Circle
        x={leftRimX}
        y={leftRimY}
        radius={14}
        stroke="#f97316"
        strokeWidth={3}
      />
      <Line
        points={[courtLeft + 25, midY, leftRimX - 14, midY]}
        stroke="#94a3b8"
        strokeWidth={3}
      />
      {/* Left Key */}
      <Rect
        x={courtLeft}
        y={midY - 90}
        width={180}
        height={180}
        stroke="#475569"
        strokeWidth={2.5}
        fill="#1a202c"
      />
      {/* Left FT Circle */}
      <Arc
        x={courtLeft + 180}
        y={midY}
        innerRadius={65}
        outerRadius={65}
        angle={180}
        rotation={270}
        stroke="#475569"
        strokeWidth={2.5}
      />
      {/* Left 3PT Line (Continuous Path) */}
      <Path
        data={left3PtPath}
        stroke="#475569"
        strokeWidth={2.5}
        lineCap="round"
        lineJoin="round"
      />

      {/* RIGHT BASKET */}
      <Line
        points={[courtLeft + courtW - 25, midY - 45, courtLeft + courtW - 25, midY + 45]}
        stroke="#94a3b8"
        strokeWidth={4.5}
      />
      <Circle
        x={rightRimX}
        y={rightRimY}
        radius={14}
        stroke="#f97316"
        strokeWidth={3}
      />
      <Line
        points={[courtLeft + courtW - 25, midY, rightRimX + 14, midY]}
        stroke="#94a3b8"
        strokeWidth={3}
      />
      {/* Right Key */}
      <Rect
        x={courtLeft + courtW - 180}
        y={midY - 90}
        width={180}
        height={180}
        stroke="#475569"
        strokeWidth={2.5}
        fill="#1a202c"
      />
      {/* Right FT Circle */}
      <Arc
        x={courtLeft + courtW - 180}
        y={midY}
        innerRadius={65}
        outerRadius={65}
        angle={180}
        rotation={90}
        stroke="#475569"
        strokeWidth={2.5}
      />
      {/* Right 3PT Line (Continuous Path) */}
      <Path
        data={right3PtPath}
        stroke="#475569"
        strokeWidth={2.5}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};
