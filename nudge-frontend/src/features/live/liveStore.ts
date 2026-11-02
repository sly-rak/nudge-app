export interface LiveReplay {
  id: string;
  title: string;
  timestamp: number;
  duration: number; // in seconds
  poster?: string;
  videoUrl?: string;
}

const REPLAYS_KEY = 'nudge_live_replays';

export function getSavedReplays(): LiveReplay[] {
  try {
    const raw = localStorage.getItem(REPLAYS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReplay(replay: LiveReplay) {
  try {
    const replays = getSavedReplays();
    replays.unshift(replay);
    localStorage.setItem(REPLAYS_KEY, JSON.stringify(replays));
  } catch (err) {
    console.warn('Failed to save replay:', err);
  }
}

export function deleteReplay(id: string) {
  try {
    const replays = getSavedReplays().filter((r) => r.id !== id);
    localStorage.setItem(REPLAYS_KEY, JSON.stringify(replays));
  } catch (err) {
    console.warn('Failed to delete replay:', err);
  }
}
