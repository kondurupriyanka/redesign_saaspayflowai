import { initializePaddle, type Environments, type Paddle } from '@paddle/paddle-js';

let paddleInitPromise: Promise<Paddle | undefined> | null = null;

function getPaddleEnvironment(): Environments {
  const env = import.meta.env.VITE_PADDLE_ENV as Environments | undefined;
  return env === 'production' ? 'production' : 'sandbox';
}

export function getPaddleClientToken(): string | null {
  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  return token?.trim() || null;
}

export function isPaddleEnabled(): boolean {
  return Boolean(getPaddleClientToken());
}

export async function initializePayFlowPaddle(): Promise<Paddle | undefined> {
  const token = getPaddleClientToken();
  if (!token) return undefined;

  if (!paddleInitPromise) {
    paddleInitPromise = initializePaddle({
      token,
      environment: getPaddleEnvironment(),
      checkout: {
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          allowLogout: false,
        },
      },
    }).catch((error) => {
      paddleInitPromise = null;
      throw error;
    });
  }

  return paddleInitPromise;
}
