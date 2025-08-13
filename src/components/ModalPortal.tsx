import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
}

export function ModalPortal({ children }: ModalPortalProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  if (!elRef.current) {
    elRef.current = document.createElement('div');
    elRef.current.className = 'modal-portal-root';
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);


    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      try {
        document.body.removeChild(el);
      } catch (_) {

      }
    };
  }, []);

  return createPortal(children, elRef.current!);
}

