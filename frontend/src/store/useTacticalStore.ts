import { create } from 'zustand';
import {
  SportType,
  BasketballCourtVariant,
  ToolType,
  PlayerEntity,
  TacticalPoint,
  TacticalDrawing,
  StepFrame,
} from '../types/tactical';

export const DEFAULT_PLAYERS: PlayerEntity[] = [
  // Home / Offense
  { id: 'home-1', team: 'home', number: 1, name: 'PG', color: '#ef4444', textColor: '#ffffff' },
  { id: 'home-2', team: 'home', number: 2, name: 'SG', color: '#ef4444', textColor: '#ffffff' },
  { id: 'home-3', team: 'home', number: 3, name: 'SF', color: '#ef4444', textColor: '#ffffff' },
  { id: 'home-4', team: 'home', number: 4, name: 'PF', color: '#ef4444', textColor: '#ffffff' },
  { id: 'home-5', team: 'home', number: 5, name: 'C', color: '#ef4444', textColor: '#ffffff' },

  // Away / Defense
  { id: 'away-1', team: 'away', number: 1, name: 'D1', color: '#3b82f6', textColor: '#ffffff' },
  { id: 'away-2', team: 'away', number: 2, name: 'D2', color: '#3b82f6', textColor: '#ffffff' },
  { id: 'away-3', team: 'away', number: 3, name: 'D3', color: '#3b82f6', textColor: '#ffffff' },
  { id: 'away-4', team: 'away', number: 4, name: 'D4', color: '#3b82f6', textColor: '#ffffff' },
  { id: 'away-5', team: 'away', number: 5, name: 'D5', color: '#3b82f6', textColor: '#ffffff' },
];

export const DEFAULT_HALF_COURT_POSITIONS: Record<string, TacticalPoint> = {
  'home-1': { x: 350, y: 490 }, // PG Top of Key
  'home-2': { x: 140, y: 370 }, // SG Left Wing
  'home-3': { x: 560, y: 370 }, // SF Right Wing
  'home-4': { x: 190, y: 210 }, // PF Left Post
  'home-5': { x: 510, y: 210 }, // C Right Post

  'away-1': { x: 350, y: 430 },
  'away-2': { x: 180, y: 340 },
  'away-3': { x: 520, y: 340 },
  'away-4': { x: 230, y: 200 },
  'away-5': { x: 470, y: 200 },
};

export const DEFAULT_FULL_COURT_POSITIONS: Record<string, TacticalPoint> = {
  'home-1': { x: 430, y: 270 },
  'home-2': { x: 330, y: 140 },
  'home-3': { x: 330, y: 400 },
  'home-4': { x: 180, y: 190 },
  'home-5': { x: 180, y: 350 },

  'away-1': { x: 530, y: 270 },
  'away-2': { x: 630, y: 140 },
  'away-3': { x: 630, y: 400 },
  'away-4': { x: 780, y: 190 },
  'away-5': { x: 780, y: 350 },
};

function createInitialStep(variant: BasketballCourtVariant): StepFrame {
  const defaultPositions =
    variant === 'half_court' ? DEFAULT_HALF_COURT_POSITIONS : DEFAULT_FULL_COURT_POSITIONS;
  const pgPos = defaultPositions['home-1'];

  return {
    id: 'step-0',
    title: 'Фаза 1: Расстановка',
    duration: 1.8,
    playerPositions: { ...defaultPositions },
    ballPosition: {
      x: pgPos.x + 18,
      y: pgPos.y + 18,
      attachedToPlayerId: 'home-1',
    },
    drawings: [],
  };
}

interface TacticalStoreState {
  sport: SportType;
  courtVariant: BasketballCourtVariant;
  playTitle: string;
  players: PlayerEntity[];
  steps: StepFrame[];
  currentStepIndex: number;
  activeTool: ToolType;
  selectedEntityId: string | null;

  // Playback
  isPlaying: boolean;
  stepProgress: number; // 0..1
  speed: 0.5 | 1 | 1.5 | 2;
  isLooping: boolean;
  showGhost: boolean;

  // Actions
  setSport: (sport: SportType) => void;
  setCourtVariant: (variant: BasketballCourtVariant) => void;
  setPlayTitle: (title: string) => void;
  setCurrentStepIndex: (index: number) => void;
  addStep: () => void;
  duplicateStep: (index: number) => void;
  deleteStep: (index: number) => void;
  setStepDuration: (index: number, duration: number) => void;
  updatePlayerPosition: (playerId: string, pos: TacticalPoint) => void;
  updateBallPosition: (pos: TacticalPoint, attachedToPlayerId?: string | null) => void;
  addDrawing: (drawing: TacticalDrawing) => void;
  removeDrawing: (id: string) => void;
  clearStepDrawings: () => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedEntityId: (id: string | null) => void;
  resetCourtPositions: () => void;

  // Playback controls
  setIsPlaying: (playing: boolean) => void;
  setStepProgress: (progress: number) => void;
  setSpeed: (speed: 0.5 | 1 | 1.5 | 2) => void;
  toggleLoop: () => void;
  toggleGhost: () => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  loadPlay: (data: {
    title: string;
    sport: SportType;
    courtVariant: BasketballCourtVariant;
    players: PlayerEntity[];
    steps: StepFrame[];
  }) => void;
}

export const useTacticalStore = create<TacticalStoreState>((set, get) => ({
  sport: 'basketball',
  courtVariant: 'half_court',
  playTitle: 'Комбинация: Розыгрыш Pick and Roll',
  players: DEFAULT_PLAYERS,
  steps: [createInitialStep('half_court')],
  currentStepIndex: 0,
  activeTool: 'select',
  selectedEntityId: null,

  // Playback
  isPlaying: false,
  stepProgress: 0,
  speed: 1,
  isLooping: true,
  showGhost: true,

  setSport: (sport) => set({ sport }),

  setCourtVariant: (courtVariant) => {
    set({
      courtVariant,
      steps: [createInitialStep(courtVariant)],
      currentStepIndex: 0,
      stepProgress: 0,
      isPlaying: false,
    });
  },

  setPlayTitle: (playTitle) => set({ playTitle }),

  setCurrentStepIndex: (index) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStepIndex: index, stepProgress: 0 });
    }
  },

  addStep: () => {
    const { steps, currentStepIndex } = get();
    const currentStep = steps[currentStepIndex];
    const newStepIndex = steps.length;
    const newStep: StepFrame = {
      id: `step-${Date.now()}`,
      title: `Фаза ${newStepIndex + 1}`,
      duration: 1.8,
      playerPositions: { ...currentStep.playerPositions },
      ballPosition: { ...currentStep.ballPosition },
      drawings: [],
    };
    set({
      steps: [...steps, newStep],
      currentStepIndex: newStepIndex,
      stepProgress: 0,
    });
  },

  duplicateStep: (index) => {
    const { steps } = get();
    const stepToDup = steps[index];
    if (!stepToDup) return;
    const newStep: StepFrame = {
      id: `step-${Date.now()}`,
      title: `${stepToDup.title} (Копия)`,
      duration: stepToDup.duration,
      playerPositions: { ...stepToDup.playerPositions },
      ballPosition: { ...stepToDup.ballPosition },
      drawings: [...stepToDup.drawings],
    };
    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, newStep);
    set({ steps: newSteps, currentStepIndex: index + 1, stepProgress: 0 });
  },

  deleteStep: (index) => {
    const { steps, currentStepIndex } = get();
    if (steps.length <= 1) return; // Keep at least one step
    const newSteps = steps.filter((_, idx) => idx !== index);
    const newIndex = Math.min(currentStepIndex, newSteps.length - 1);
    set({ steps: newSteps, currentStepIndex: newIndex, stepProgress: 0 });
  },

  setStepDuration: (index, duration) => {
    const { steps } = get();
    if (!steps[index]) return;
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], duration };
    set({ steps: newSteps });
  },

  updatePlayerPosition: (playerId, pos) => {
    const { steps, currentStepIndex } = get();
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const newPositions = {
      ...currentStep.playerPositions,
      [playerId]: pos,
    };

    let newBallPos = { ...currentStep.ballPosition };
    if (currentStep.ballPosition.attachedToPlayerId === playerId) {
      newBallPos = {
        x: pos.x + 18,
        y: pos.y + 18,
        attachedToPlayerId: playerId,
      };
    }

    const newStep: StepFrame = {
      ...currentStep,
      playerPositions: newPositions,
      ballPosition: newBallPos,
    };

    const newSteps = [...steps];
    newSteps[currentStepIndex] = newStep;
    set({ steps: newSteps });
  },

  updateBallPosition: (pos, attachedToPlayerId) => {
    const { steps, currentStepIndex } = get();
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const newBallPos = {
      x: pos.x,
      y: pos.y,
      attachedToPlayerId: attachedToPlayerId !== undefined ? attachedToPlayerId : currentStep.ballPosition.attachedToPlayerId,
    };

    const newStep: StepFrame = {
      ...currentStep,
      ballPosition: newBallPos,
    };

    const newSteps = [...steps];
    newSteps[currentStepIndex] = newStep;
    set({ steps: newSteps });
  },

  addDrawing: (drawing) => {
    const { steps, currentStepIndex } = get();
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const newStep: StepFrame = {
      ...currentStep,
      drawings: [...currentStep.drawings, drawing],
    };

    const newSteps = [...steps];
    newSteps[currentStepIndex] = newStep;
    set({ steps: newSteps });
  },

  removeDrawing: (id) => {
    const { steps, currentStepIndex } = get();
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const newStep: StepFrame = {
      ...currentStep,
      drawings: currentStep.drawings.filter((d) => d.id !== id),
    };

    const newSteps = [...steps];
    newSteps[currentStepIndex] = newStep;
    set({ steps: newSteps });
  },

  clearStepDrawings: () => {
    const { steps, currentStepIndex } = get();
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    const newStep: StepFrame = {
      ...currentStep,
      drawings: [],
    };

    const newSteps = [...steps];
    newSteps[currentStepIndex] = newStep;
    set({ steps: newSteps });
  },

  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedEntityId: (selectedEntityId) => set({ selectedEntityId }),

  resetCourtPositions: () => {
    const { courtVariant, steps, currentStepIndex } = get();
    const defaultPositions =
      courtVariant === 'half_court' ? DEFAULT_HALF_COURT_POSITIONS : DEFAULT_FULL_COURT_POSITIONS;
    const pgPos = defaultPositions['home-1'];

    const newStep: StepFrame = {
      ...steps[currentStepIndex],
      playerPositions: { ...defaultPositions },
      ballPosition: {
        x: pgPos.x + 18,
        y: pgPos.y + 18,
        attachedToPlayerId: 'home-1',
      },
      drawings: [],
    };

    const newSteps = [...steps];
    newSteps[currentStepIndex] = newStep;
    set({ steps: newSteps });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setStepProgress: (stepProgress) => set({ stepProgress }),
  setSpeed: (speed) => set({ speed }),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  toggleGhost: () => set((state) => ({ showGhost: !state.showGhost })),

  goToNextStep: () => {
    const { steps, currentStepIndex } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1, stepProgress: 0 });
    }
  },

  goToPrevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1, stepProgress: 0 });
    }
  },

  loadPlay: (data) => {
    set({
      playTitle: data.title,
      sport: data.sport,
      courtVariant: data.courtVariant,
      players: data.players,
      steps: data.steps,
      currentStepIndex: 0,
      stepProgress: 0,
      isPlaying: false,
    });
  },
}));
