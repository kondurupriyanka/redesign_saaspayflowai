import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Paddle } from '@paddle/paddle-js';
import { initializePayFlowPaddle, isPaddleEnabled } from '@/lib/paddle';

type PaddleContextValue = {
  paddle: Paddle | null;
  isReady: boolean;
  isEnabled: boolean;
};

const PaddleContext = createContext<PaddleContextValue | undefined>(undefined);

export function PaddleProvider({ children }: { children: ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    initializePayFlowPaddle()
      .then((instance) => {
        if (!active) return;
        setPaddle(instance ?? null);
      })
      .catch((error) => {
        console.error('Failed to initialize Paddle', error);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<PaddleContextValue>(
    () => ({
      paddle,
      isReady,
      isEnabled: isPaddleEnabled(),
    }),
    [isReady, paddle],
  );

  return <PaddleContext.Provider value={value}>{children}</PaddleContext.Provider>;
}

export function usePaddle() {
  const context = useContext(PaddleContext);
  if (!context) {
    throw new Error('usePaddle must be used within PaddleProvider');
  }
  return context;
}
