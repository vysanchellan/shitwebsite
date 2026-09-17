/**
 * District light.
 *
 * Kept in its own module because the document at /overview needs these colours
 * and nothing else from the world. Importing them from `layout.ts` dragged the
 * whole city generator — 252 buildings, 656 props, 1,114 colliders, all built at
 * module scope — into a page that renders no 3D at all.
 *
 * All of it is metal or fire. Aether is the pale brass the world's own interface
 * is lit with; the rest is the light a building gives off, kept far enough apart
 * that the districts stay distinguishable.
 */
export const ACCENT_HEX: Record<string, string> = {
  aether: '#dcbd82',
  azure: '#b08d4e',
  verdant: '#a8a86a',
  jade: '#8e9c62',
  amber: '#d9a441',
  ember: '#c4553c',
  plum: '#b08a6e',
};
