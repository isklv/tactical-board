import React from 'react';
import { Group, Rect, Line, Circle, Arc, Path } from 'react-konva';
import { BasketballCourtVariant } from '../../types/tactical';

export const HALF_COURT_BOUNDS = { width: 1000, height: 800 };
export const FULL_COURT_BOUNDS = { width: 1000, height: 580 };

interface BasketballCourtProps {
  variant: BasketballCourtVariant;
}

export const BasketballCourt: React.FC<BasketballCourtProps> = ({ variant }) => {
  const isHalfCourt = variant === 'half_court';

  if (isHalfCourt) {
    const W = HALF_COURT_BOUNDS.width;
    const H = HALF_COURT_BOUNDS.height;
    const margin = 40;
    const courtW = W - margin * 2; // 920
    const courtH = H - margin * 2; // 720
    const courtLeft = margin;
    const courtTop = margin;
    const rimX = W / 2;
    const rimY = courtTop + 75; // 115
    const keyW = 320;
    const keyH = 380;
    const keyLeft = rimX - keyW / 2; // 340
    const keyTop = courtTop; // 40
    const ftY = keyTop + keyH; // 420
    const ftRadius = 115;
    const threePtRadius = 450;
    const cornerXDist = 385; // Distance from rim to corner 3-pt line
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
          cornerRadius={16}
        />

        {/* Court Boundary Line */}
        <Rect
          x={courtLeft}
          y={courtTop}
          width={courtW}
          height={courtH}
          stroke="#475569"
          strokeWidth={4}
          fill="#161922"
        />

        {/* Backboard */}
        <Line
          points={[rimX - 60, courtTop + 35, rimX + 60, courtTop + 35]}
          stroke="#94a3b8"
          strokeWidth={6}
          lineCap="round"
        />

        {/* Rim & Ring */}
        <Circle
          x={rimX}
          y={rimY}
          radius={18}
          stroke="#f97316"
          strokeWidth={4}
        />

        {/* Rim connector */}
        <Line
          points={[rimX, courtTop + 35, rimX, rimY - 18]}
          stroke="#94a3b8"
          strokeWidth={4}
        />

        {/* Restricted Area Arc */}
        <Arc
          x={rimX}
          y={rimY}
          innerRadius={75}
          outerRadius={75}
          angle={180}
          rotation={0}
          stroke="#475569"
          strokeWidth={3}
        />

        {/* Key / Paint (Trapezoid/Rectangle) */}
        <Rect
          x={keyLeft}
          y={keyTop}
          width={keyW}
          height={keyH}
          stroke="#475569"
          strokeWidth={3}
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
          strokeWidth={3}
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
          strokeWidth={3}
          dash={[12, 12]}
        />

        {/* Continuous 3-Point Line (Seamless Corners + Arc) */}
        <Path
          data={halfCourt3PtPath}
          stroke="#475569"
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
        />

        {/* Half-court Line (Baseline on bottom) */}
        <Line
          points={[courtLeft, courtTop + courtH, courtLeft + courtW, courtTop + courtH]}
          stroke="#475569"
          strokeWidth={4}
        />

        {/* Center Circle Arc at half court */}
        <Arc
          x={rimX}
          y={courtTop + courtH}
          innerRadius={115}
          outerRadius={115}
          angle={180}
          rotation={180}
          stroke="#475569"
          strokeWidth={3}
        />
      </Group>
    );
  }

  // Full Court
  const W = FULL_COURT_BOUNDS.width;
  const H = FULL_COURT_BOUNDS.height;
  const margin = 30;
  const courtW = W - margin * 2;
  const courtH = H - margin * 2;
  const courtLeft = margin;
  const courtTop = margin;
  const midX = W / 2;
  const midY = H / 2;

  // Left Basket
  const leftRimX = courtLeft + 70;
  const leftRimY = midY;
  // Right Basket
  const rightRimX = courtLeft + courtW - 70;
  const rightRimY = midY;

  // Full-court 3-point paths
  const threePtRadiusFull = 260;
  const cornerYDistFull = 190;
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
        cornerRadius={16}
      />

      {/* Outer Court Boundary */}
      <Rect
        x={courtLeft}
        y={courtTop}
        width={courtW}
        height={courtH}
        stroke="#475569"
        strokeWidth={4}
        fill="#161922"
      />

      {/* Midcourt Line */}
      <Line
        points={[midX, courtTop, midX, courtTop + courtH]}
        stroke="#475569"
        strokeWidth={3}
      />

      {/* Center Circle */}
      <Circle
        x={midX}
        y={midY}
        radius={75}
        stroke="#475569"
        strokeWidth={3}
      />

      {/* LEFT BASKET */}
      {/* Backboard */}
      <Line
        points={[courtLeft + 30, midY - 50, courtLeft + 30, midY + 50]}
        stroke="#94a3b8"
        strokeWidth={5}
      />
      <Circle
        x={leftRimX}
        y={leftRimY}
        radius={14}
        stroke="#f97316"
        strokeWidth={3}
      />
      <Line
        points={[courtLeft + 30, midY, leftRimX - 14, midY]}
        stroke="#94a3b8"
        strokeWidth={3}
      />
      {/* Left Key */}
      <Rect
        x={courtLeft}
        y={midY - 100}
        width={190}
        height={200}
        stroke="#475569"
        strokeWidth={3}
        fill="#1a202c"
      />
      {/* Left FT Circle */}
      <Arc
        x={courtLeft + 190}
        y={midY}
        innerRadius={70}
        outerRadius={70}
        angle={180}
        rotation={270}
        stroke="#475569"
        strokeWidth={3}
      />
      {/* Left 3PT Line (Continuous Path) */}
      <Path
        data={left3PtPath}
        stroke="#475569"
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />

      {/* RIGHT BASKET */}
      {/* Backboard */}
      <Line
        points={[courtLeft + courtW - 30, midY - 50, courtLeft + courtW - 30, midY + 50]}
        stroke="#94a3b8"
        strokeWidth={5}
      />
      <Circle
        x={rightRimX}
        y={rightRimY}
        radius={14}
        stroke="#f97316"
        strokeWidth={3}
      />
      <Line
        points={[courtLeft + courtW - 30, midY, rightRimX + 14, midY]}
        stroke="#94a3b8"
        strokeWidth={3}
      />
      {/* Right Key */}
      <Rect
        x={courtLeft + courtW - 190}
        y={midY - 100}
        width={190}
        height={200}
        stroke="#475569"
        strokeWidth={3}
        fill="#1a202c"
      />
      {/* Right FT Circle */}
      <Arc
        x={courtLeft + courtW - 190}
        y={midY}
        innerRadius={70}
        outerRadius={70}
        angle={180}
        rotation={90}
        stroke="#475569"
        strokeWidth={3}
      />
      {/* Right 3PT Line (Continuous Path) */}
      <Path
        data={right3PtPath}
        stroke="#475569"
        strokeWidth={3}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};
