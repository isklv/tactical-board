import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { HALF_COURT_BOUNDS, FULL_COURT_BOUNDS } from '../court/BasketballCourt';
import { BasketballCourtVariant } from '../../types/tactical';

interface ResponsiveStageProps {
  courtVariant: BasketballCourtVariant;
  stageRef: React.RefObject<Konva.Stage>;
  children: React.ReactNode;
  onPointerDown?: (virtualPos: { x: number; y: number }, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onPointerMove?: (virtualPos: { x: number; y: number }, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onPointerUp?: (virtualPos: { x: number; y: number }, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

export const ResponsiveStage: React.FC<ResponsiveStageProps> = ({
  courtVariant,
  stageRef,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState({
    width: 800,
    height: 600,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const virtualBounds =
    courtVariant === 'half_court' ? HALF_COURT_BOUNDS : FULL_COURT_BOUNDS;

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;

    // Leave minimal padding for mobile screens to maximize court size
    const pad = clientWidth < 600 ? 2 : 10;
    const availW = Math.max(280, clientWidth - pad * 2);
    const availH = Math.max(240, clientHeight - pad * 2);

    const scale = Math.min(availW / virtualBounds.width, availH / virtualBounds.height);
    const renderedW = virtualBounds.width * scale;
    const renderedH = virtualBounds.height * scale;

    const offsetX = (clientWidth - renderedW) / 2;
    const offsetY = (clientHeight - renderedH) / 2;

    setStageDimensions({
      width: clientWidth,
      height: clientHeight,
      scale,
      offsetX,
      offsetY,
    });
  }, [virtualBounds.width, virtualBounds.height]);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener('orientationchange', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', updateSize);
    };
  }, [updateSize]);

  // Convert raw screen pointer coordinate to normalized virtual coordinates
  const getVirtualPointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };

    const x = Math.round((pointer.x - stageDimensions.offsetX) / stageDimensions.scale);
    const y = Math.round((pointer.y - stageDimensions.offsetY) / stageDimensions.scale);
    return { x, y };
  }, [stageRef, stageDimensions.offsetX, stageDimensions.offsetY, stageDimensions.scale]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'none', // Crucial for mobile touch drag
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stage
        ref={stageRef}
        width={stageDimensions.width}
        height={stageDimensions.height}
        scaleX={stageDimensions.scale}
        scaleY={stageDimensions.scale}
        x={stageDimensions.offsetX}
        y={stageDimensions.offsetY}
        onMouseDown={(e) => onPointerDown?.(getVirtualPointerPos(), e)}
        onMouseMove={(e) => onPointerMove?.(getVirtualPointerPos(), e)}
        onMouseUp={(e) => onPointerUp?.(getVirtualPointerPos(), e)}
        onTouchStart={(e) => onPointerDown?.(getVirtualPointerPos(), e)}
        onTouchMove={(e) => onPointerMove?.(getVirtualPointerPos(), e)}
        onTouchEnd={(e) => onPointerUp?.(getVirtualPointerPos(), e)}
      >
        {children}
      </Stage>
    </div>
  );
};
