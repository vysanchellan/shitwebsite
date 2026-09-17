'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NODES } from '@/data/content';
import { ACCENT_HEX } from './layout';
import { addLook, setStick } from './input';
import { useWorld } from './store';

const STICK_RADIUS = 56;
const LOOK_SENSITIVITY = 0.0038;

/**
 * Touch layer: a left thumbstick, a right-hand look pad and a read button.
 * Rendered only on coarse pointers so it never sits over a desktop scene.
 */
export function TouchControls() {
  const nearby = useWorld((s) => s.nearby);
  const open = useWorld((s) => s.open);
  const paused = useWorld((s) => s.paused);

  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const stickId = useRef<number | null>(null);
  const stickOrigin = useRef({ x: 0, y: 0 });
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  const node = nearby ? NODES.find((n) => n.id === nearby) : null;

  const endStick = useCallback(() => {
    stickId.current = null;
    setKnob(null);
    setStick(0, 0);
  }, []);

  useEffect(() => {
    if (paused) endStick();
  }, [paused, endStick]);

  useEffect(() => () => setStick(0, 0), []);

  const onStickDown = (e: React.PointerEvent) => {
    if (stickId.current !== null) return;
    stickId.current = e.pointerId;
    stickOrigin.current = { x: e.clientX, y: e.clientY };
    setKnob({ x: 0, y: 0 });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onStickMove = (e: React.PointerEvent) => {
    if (stickId.current !== e.pointerId) return;
    let dx = e.clientX - stickOrigin.current.x;
    let dy = e.clientY - stickOrigin.current.y;
    const len = Math.hypot(dx, dy);
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS;
      dy = (dy / len) * STICK_RADIUS;
    }
    setKnob({ x: dx, y: dy });
    setStick(dx / STICK_RADIUS, -dy / STICK_RADIUS);
  };

  const onLookDown = (e: React.PointerEvent) => {
    if (lookId.current !== null) return;
    lookId.current = e.pointerId;
    lookLast.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onLookMove = (e: React.PointerEvent) => {
    if (lookId.current !== e.pointerId) return;
    addLook(
      (e.clientX - lookLast.current.x) * LOOK_SENSITIVITY,
      (e.clientY - lookLast.current.y) * LOOK_SENSITIVITY,
    );
    lookLast.current = { x: e.clientX, y: e.clientY };
  };

  const endLook = (e: React.PointerEvent) => {
    if (lookId.current === e.pointerId) lookId.current = null;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none">
      {/* Look pad — the whole right side, under the HUD chrome */}
      <div
        className="pointer-events-auto absolute top-20 right-0 bottom-32 left-1/2"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={endLook}
        onPointerCancel={endLook}
        aria-hidden="true"
      />

      {/* Thumbstick */}
      <div
        className="pointer-events-auto absolute bottom-8 left-6 h-32 w-32 touch-none"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={endStick}
        onPointerCancel={endStick}
        aria-hidden="true"
      >
        <span className="absolute inset-0 rounded-full border border-white/15 bg-ink/45 backdrop-blur-sm" />
        <span className="absolute inset-[30%] rounded-full border border-white/10" />
        <span
          className="absolute top-1/2 left-1/2 h-14 w-14 rounded-full border border-cyan/50 bg-cyan/22 backdrop-blur-sm transition-transform duration-75"
          style={{
            transform: `translate(-50%, -50%) translate(${knob?.x ?? 0}px, ${knob?.y ?? 0}px)`,
          }}
        />
      </div>

      {/* Read button */}
      <div className="pointer-events-auto absolute right-6 bottom-8">
        <button
          type="button"
          disabled={!node}
          onClick={() => node && open(node.id)}
          className="grid h-20 w-20 place-items-center rounded-full border-2 font-mono text-[0.7rem] tracking-[0.18em] uppercase backdrop-blur-sm transition-all duration-300 disabled:opacity-25"
          style={{
            borderColor: node ? ACCENT_HEX[node.accent] : 'rgba(255,255,255,0.2)',
            background: node ? `${ACCENT_HEX[node.accent]}2e` : 'rgba(255,255,255,0.05)',
            color: node ? ACCENT_HEX[node.accent] : '#f5f4f0',
          }}
          aria-label={node ? `Read ${node.label}` : 'Nothing to read here'}
        >
          Read
        </button>
      </div>
    </div>
  );
}
