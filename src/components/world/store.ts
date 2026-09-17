'use client';

import { create } from 'zustand';

export type ControlMode = 'idle' | 'locked' | 'touch';

type WorldState = {
  /** Node the player is standing close enough to read. */
  nearby: string | null;
  /** Node currently open in the reading panel. */
  active: string | null;
  /** Everything read so far, in the order it was found. */
  discovered: string[];
  mapOpen: boolean;
  /** True while the intro card, a panel or the map has the player's attention. */
  paused: boolean;
  started: boolean;
  mode: ControlMode;
  /** Live player position, mirrored out of the render loop for the minimap. */
  player: [number, number];
  heading: number;

  setNearby: (id: string | null) => void;
  open: (id: string) => void;
  close: () => void;
  toggleMap: () => void;
  setMode: (m: ControlMode) => void;
  start: () => void;
  setPlayer: (x: number, z: number, heading: number) => void;
};

export const useWorld = create<WorldState>((set, get) => ({
  nearby: null,
  active: null,
  discovered: [],
  mapOpen: false,
  paused: true,
  started: false,
  mode: 'idle',
  player: [0, 72],
  heading: Math.PI,

  setNearby: (id) => {
    if (get().nearby !== id) set({ nearby: id });
  },

  open: (id) =>
    set((s) => ({
      active: id,
      paused: true,
      mapOpen: false,
      discovered: s.discovered.includes(id) ? s.discovered : [...s.discovered, id],
    })),

  close: () => set({ active: null, paused: false }),

  toggleMap: () =>
    set((s) => {
      const mapOpen = !s.mapOpen;
      return { mapOpen, paused: mapOpen || s.active !== null };
    }),

  setMode: (mode) => set({ mode }),

  start: () => set({ started: true, paused: false }),

  setPlayer: (x, z, heading) => set({ player: [x, z], heading }),
}));
