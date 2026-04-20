import { useState, useEffect, useRef, useCallback } from 'react';
import { now } from '../lib/utils';

export type PollStatus = 'idle' | 'fetching' | 'done' | 'error';

export interface PollState {
  status: PollStatus;
  lastUpdated: string | null;
  newCount: number;
  error: string | null;
}

export interface UseFeedPollingOptions {
  key: string;
  intervalMs?: number;
  onPoll: () => Promise<number>;
}

// Module-level set prevents duplicate intervals under React StrictMode double-invoke
const activePolls = new Set<string>();

export function useFeedPolling({
  key,
  intervalMs = 30 * 60 * 1000,
  onPoll,
}: UseFeedPollingOptions): PollState & { refresh: () => void } {
  const storageKey = key + ':lastPolled';

  const [state, setState] = useState<PollState>(() => ({
    status: 'idle',
    lastUpdated: localStorage.getItem(storageKey),
    newCount: 0,
    error: null,
  }));

  // Always call the latest version of onPoll without restarting the interval
  const onPollRef = useRef(onPoll);
  useEffect(() => { onPollRef.current = onPoll; }, [onPoll]);

  const runPoll = useCallback(async () => {
    setState(s => ({ ...s, status: 'fetching', error: null }));
    try {
      const count = await onPollRef.current();
      const ts = now();
      localStorage.setItem(storageKey, ts);
      setState({ status: 'done', lastUpdated: ts, newCount: count, error: null });
    } catch (err) {
      console.warn('[useFeedPolling] poll failed:', err);
      setState(s => ({ ...s, status: 'error', error: String(err) }));
    }
  }, [storageKey]);

  useEffect(() => {
    if (activePolls.has(key)) return;
    activePolls.add(key);

    runPoll();
    const id = setInterval(runPoll, intervalMs);

    return () => {
      clearInterval(id);
      activePolls.delete(key);
    };
  }, [key, intervalMs, runPoll]);

  const refresh = useCallback(() => { runPoll(); }, [runPoll]);

  return { ...state, refresh };
}
