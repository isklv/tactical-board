export type SportType = 'basketball' | 'football' | 'hockey';
export type BasketballCourtVariant = 'half_court' | 'full_court';

export type ToolType = 
  | 'select'     // Select / Move players & ball
  | 'movement'   // Solid arrow (running without ball)
  | 'pass'       // Dashed arrow (ball pass)
  | 'dribble'    // Wavy/zigzag arrow (dribble with ball)
  | 'screen'     // Solid line with T-bar cap (pick/screen)
  | 'freehand'   // Freehand marker
  | 'eraser';    // Erase drawings

export interface TacticalPoint {
  x: number;
  y: number;
}

export interface PlayerEntity {
  id: string;
  team: 'home' | 'away';
  number: number;
  name?: string;
  color: string;
  textColor: string;
}

export interface BallEntity {
  id: 'ball';
  attachedToPlayerId: string | null;
}

export interface TacticalDrawing {
  id: string;
  type: 'movement' | 'pass' | 'dribble' | 'screen' | 'freehand';
  points: number[]; // [x1, y1, x2, y2, ...]
  color: string;
  width: number;
  stepIndex: number;
}

export interface StepFrame {
  id: string;
  title: string;
  duration: number; // in seconds, default 1.5s
  playerPositions: Record<string, TacticalPoint>;
  ballPosition: TacticalPoint & { attachedToPlayerId: string | null };
  drawings: TacticalDrawing[];
}

export interface TacticalPlay {
  id: string;
  title: string;
  sport: SportType;
  courtVariant: BasketballCourtVariant;
  players: PlayerEntity[];
  steps: StepFrame[];
  createdAt: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentStepIndex: number;
  stepProgress: number; // 0..1 progress between current step and next step
  speed: 0.5 | 1 | 1.5 | 2;
  isLooping: boolean;
  showGhost: boolean; // Onion skinning
}
