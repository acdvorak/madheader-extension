import type { ChildProcess } from 'node:child_process';
import { spawn, spawnSync } from 'node:child_process';

export interface Command {
  executable: string;
  args: string[];
}

interface CommandResult {
  exitCode: number;
  processId?: number;
}

type HandledSignal = 'SIGHUP' | 'SIGINT' | 'SIGTERM';

const FORCE_KILL_DELAY_MS = 5_000;
const SIGNAL_EXIT_CODES: Record<HandledSignal, number> = {
  SIGHUP: 129,
  SIGINT: 130,
  SIGTERM: 143,
};

const ownedProcessIds = new Set<number>();
let forceKillTimer: NodeJS.Timeout | undefined;
let receivedSignal: HandledSignal | undefined;
let shuttingDown = false;

function killProcessTree(processId: number, signal: NodeJS.Signals): void {
  try {
    if (process.platform === 'win32') {
      const args = ['/pid', String(processId), '/T'];

      if (signal === 'SIGKILL') {
        args.push('/F');
      }

      spawnSync('taskkill', args, {
        stdio: 'ignore',
        windowsHide: true,
      });
      return;
    }

    process.kill(-processId, signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
      console.error(error);
    }
  }
}

function killOwnedProcesses(signal: NodeJS.Signals): void {
  for (const processId of ownedProcessIds) {
    killProcessTree(processId, signal);
  }
}

function scheduleForceKill(): void {
  forceKillTimer ??= setTimeout(() => {
    killOwnedProcesses('SIGKILL');
  }, FORCE_KILL_DELAY_MS);

  forceKillTimer.unref();
}

function beginShutdown(signal: NodeJS.Signals): void {
  shuttingDown = true;
  killOwnedProcesses(signal);
  scheduleForceKill();
}

function finishShutdown(): void {
  killOwnedProcesses('SIGKILL');
  ownedProcessIds.clear();

  if (forceKillTimer) {
    clearTimeout(forceKillTimer);
    forceKillTimer = undefined;
  }
}

function handleSignal(signal: HandledSignal): void {
  if (receivedSignal) {
    killOwnedProcesses('SIGKILL');
    return;
  }

  receivedSignal = signal;
  beginShutdown(signal);
}

for (const signal of Object.keys(SIGNAL_EXIT_CODES) as HandledSignal[]) {
  process.on(signal, () => {
    handleSignal(signal);
  });
}

process.once('exit', () => {
  killOwnedProcesses('SIGKILL');
});

function signalExitCode(signal: NodeJS.Signals | null): number {
  if (signal && signal in SIGNAL_EXIT_CODES) {
    return SIGNAL_EXIT_CODES[signal as HandledSignal];
  }

  return 1;
}

function runCommand(command: Command, cwd: string): Promise<CommandResult> {
  return new Promise<CommandResult>((resolvePromise, rejectPromise) => {
    const child: ChildProcess = spawn(command.executable, command.args, {
      cwd,
      detached: process.platform !== 'win32',
      stdio: 'inherit',
    });
    const processId = child.pid;

    if (processId !== undefined) {
      ownedProcessIds.add(processId);
    }

    child.once('error', (error) => {
      if (processId !== undefined) {
        ownedProcessIds.delete(processId);
      }

      rejectPromise(
        new Error(`Failed to start ${command.executable}: ${error.message}`, {
          cause: error,
        }),
      );
    });

    child.once('close', (exitCode, signal) => {
      resolvePromise({
        exitCode: exitCode ?? signalExitCode(signal),
        processId,
      });
    });
  });
}

function releaseProcess(result: CommandResult): void {
  if (result.processId !== undefined) {
    ownedProcessIds.delete(result.processId);
  }
}

function receivedSignalExitCode(): number | undefined {
  return receivedSignal ? SIGNAL_EXIT_CODES[receivedSignal] : undefined;
}

export async function runCommandsSequentially(
  commands: Command[],
  cwd: string,
): Promise<number> {
  for (const command of commands) {
    if (receivedSignal) {
      finishShutdown();
      return SIGNAL_EXIT_CODES[receivedSignal];
    }

    const result = await runCommand(command, cwd);

    if (shuttingDown) {
      finishShutdown();
      return receivedSignalExitCode() ?? result.exitCode;
    }

    releaseProcess(result);

    if (result.exitCode !== 0) {
      return result.exitCode;
    }
  }

  return 0;
}

export async function runCommandsConcurrently(
  commands: Command[],
  cwd: string,
): Promise<number> {
  const completions = commands.map(async (command) => runCommand(command, cwd));

  try {
    const firstResult = await Promise.race(completions);

    if (!shuttingDown) {
      beginShutdown('SIGTERM');
    }

    await Promise.allSettled(completions);
    finishShutdown();

    return receivedSignalExitCode() ?? firstResult.exitCode;
  } catch (error) {
    beginShutdown('SIGTERM');
    await Promise.allSettled(completions);
    finishShutdown();
    throw error;
  }
}
