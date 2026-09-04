import { create } from 'zustand';

export interface Player {
    id: string;
    name: string;
    avatar: string;
    score: number;
    combo: number;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correct_answer: string;
    time_limit: number;
}

interface GameState {
    roomCode: string | null;
    status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'EXPIRED';
    players: Player[];
    currentQuestion: Question | null;
    currentQuestionIndex: number;
    totalQuestions: number;
    timeLeft: number;
    isHost: boolean;
    currentPlayerId: string | null;
    setRoomState: (state: Partial<GameState>) => void;
    updatePlayer: (player: Player) => void;
    addPlayer: (player: Player) => void;
    removePlayer: (playerId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    roomCode: null,
    status: 'WAITING',
    players: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    timeLeft: 0,
    isHost: false,
    currentPlayerId: null,

    setRoomState: (state) => set((prev) => ({ ...prev, ...state })),

    updatePlayer: (player) =>
        set((state) => ({
            players: state.players.map(p => p.id === player.id ? player : p)
        })),

    addPlayer: (player) =>
        set((state) => ({
            players: [...state.players.filter(p => p.id !== player.id), player]
        })),

    removePlayer: (playerId) =>
        set((state) => ({
            players: state.players.filter(p => p.id !== playerId)
        })),
}));
