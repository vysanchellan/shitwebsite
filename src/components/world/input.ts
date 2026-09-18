'use client';

/**
 * Mutable input state, read once per frame by the player controller.
 *
 * Deliberately outside React: movement must not cause a re-render, and the
 * render loop should never wait on state propagation.
 */
export const input = {
  /** -1 back … 1 forward */
  forward: 0,
  /** -1 left … 1 right */
  right: 0,
  sprint: false,
  /** Accumulated look deltas, consumed and zeroed each frame. */
  yaw: 0,
  pitch: 0,
};

const KEY_FORWARD = new Set(['KeyW', 'ArrowUp']);
const KEY_BACK = new Set(['KeyS', 'ArrowDown']);
const KEY_LEFT = new Set(['KeyA', 'ArrowLeft']);
const KEY_RIGHT = new Set(['KeyD', 'ArrowRight']);

const held = new Set<string>();

function recompute() {
  let f = 0;
  let r = 0;
  for (const code of held) {
    if (KEY_FORWARD.has(code)) f += 1;
    if (KEY_BACK.has(code)) f -= 1;
    if (KEY_LEFT.has(code)) r -= 1;
    if (KEY_RIGHT.has(code)) r += 1;
  }
  input.forward = Math.max(-1, Math.min(1, f));
  input.right = Math.max(-1, Math.min(1, r));
  input.sprint = held.has('ShiftLeft') || held.has('ShiftRight');
}

export function keyDown(code: string) {
  held.add(code);
  recompute();
}

export function keyUp(code: string) {
  held.delete(code);
  recompute();
}

export function releaseAll() {
  held.clear();
  input.forward = 0;
  input.right = 0;
  input.sprint = false;
}

/** Touch joystick writes straight through; magnitude is already clamped. */
export function setStick(x: number, y: number) {
  input.right = x;
  input.forward = y;
}

/**
 * Look deltas.
 *
 * Pitch here is the camera's *elevation* on its boom, so pushing the pointer
 * down has to raise it — that is what tilts the view downward. Subtracting dy
 * did the opposite and read as inverted.
 */
export function addLook(dx: number, dy: number) {
  input.yaw -= dx;
  input.pitch += dy;
}
