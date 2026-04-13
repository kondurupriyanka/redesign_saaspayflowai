declare module 'node-cron' {
  export interface ScheduledTask {
    start(): void;
    stop(): void;
    destroy(): void;
  }

  export function schedule(
    expression: string,
    func: () => void | Promise<void>,
    options?: { timezone?: string }
  ): ScheduledTask;

  const cron: {
    schedule: typeof schedule;
  };

  export default cron;
}
