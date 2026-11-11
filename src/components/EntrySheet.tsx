import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  /** Lets the motion layer animate the sheet and scrim in. */
  onOpen?: (sheet: HTMLElement, scrim: HTMLElement) => () => void;
};

const CLOSE_DISTANCE = 96; // px dragged down before letting go closes the sheet

/**
 * Bottom sheet for an entry on phones (PLAN.md C7). A native <dialog> opened with showModal():
 * the browser makes the rest of the page inert, keeps focus inside and maps Esc to "cancel".
 * Closes on Esc, the scrim, the close button, Back (the URL changes) and a swipe down.
 */
export function EntrySheet({ labelledBy, onClose, children, onOpen }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number; dy: number } | null>(null);
  const openHandler = useRef(onOpen);
  const stopMotion = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    if (!element.open) element.showModal();
    stopMotion.current = sheet.current && scrim.current ? openHandler.current?.(sheet.current, scrim.current) : undefined;
    return () => {
      stopMotion.current?.();
      document.body.style.overflow = overflow;
      if (element.open) element.close();
      returnFocus?.focus({ preventScroll: true });
    };
  }, []);

  const setOffset = (dy: number) => {
    if (sheet.current) sheet.current.style.transform = dy > 0 ? `translateY(${dy}px)` : '';
  };
  const snapBack = () => {
    const element = sheet.current;
    if (!element) return;
    element.classList.add('sheet-snapping');
    setOffset(0);
    window.setTimeout(() => element.classList.remove('sheet-snapping'), 220);
  };

  return (
    <dialog
      ref={dialog}
      className="sheet-layer"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Esc: let the router close it, so the URL and the dialog stay in step.
        event.preventDefault();
        onClose();
      }}
    >
      <div ref={scrim} className="scrim" onClick={onClose} aria-hidden="true" />
      <div ref={sheet} className="sheet">
        <div
          className="sheet-grip"
          onPointerDown={(event) => {
            // Grabbed while still sliding in: finish the slide at once so the drag owns the transform.
            stopMotion.current?.();
            stopMotion.current = undefined;
            drag.current = { startY: event.clientY, startTime: event.timeStamp, dy: 0 };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            drag.current.dy = Math.max(0, event.clientY - drag.current.startY);
            setOffset(drag.current.dy);
          }}
          onPointerUp={(event) => {
            const state = drag.current;
            drag.current = null;
            if (!state) return;
            const velocity = state.dy / Math.max(1, event.timeStamp - state.startTime); // px per ms
            if (state.dy > CLOSE_DISTANCE || (state.dy > 24 && velocity > 0.6)) onClose();
            else snapBack();
          }}
          onPointerCancel={() => {
            drag.current = null;
            snapBack();
          }}
        >
          <span className="sheet-handle" aria-hidden="true" />
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </dialog>
  );
}
