// Exact game definitions, engines, and AI ported from docs/design-reference/nudge-standalone.html (Lines 4050-4324)

export interface GameMeta {
  n: string;
  e: string;
  d: string;
  par: number; // 0 = 1v1 only, 1 = party / group enabled
}

export const GM: Record<string, GameMeta> = {
  chess: { n: 'Chess', e: '♟️', d: 'The classic. 1v1.', par: 0 },
  checkers: { n: 'Checkers', e: '🔴', d: 'Jump and capture. 1v1.', par: 0 },
  c4: { n: 'Connect Four', e: '🟡', d: 'Line up four. 1v1.', par: 0 },
  ttt: { n: 'Tic-Tac-Toe', e: '❌', d: 'Quick three in a row. 1v1.', par: 0 },
  rps: { n: 'Rock Paper Scissors', e: '✊', d: 'Best of three. 1v1.', par: 0 },
  trivia: { n: 'Trivia', e: '🧠', d: 'Five questions. Solo vs friends or a group.', par: 1 },
  word: { n: 'Word Scramble', e: '🔤', d: 'Unscramble five words. Groups welcome.', par: 1 },
};

// Aliases for backward compatibility
export const GAME_KEY_ALIASES: Record<string, string> = {
  tictactoe: 'ttt',
  connect4: 'c4',
  wordguess: 'word',
  rps: 'rps',
  chess: 'chess',
  checkers: 'checkers',
  trivia: 'trivia',
  word: 'word',
  c4: 'c4',
  ttt: 'ttt',
};

export function normalizeGameKey(key: string): string {
  return GAME_KEY_ALIASES[key] || key;
}

export const GORDER = ['chess', 'checkers', 'c4', 'ttt', 'rps', 'trivia', 'word'];

export function oth(w: 'me' | 'them' | string): 'me' | 'them' {
  return w === 'me' ? 'them' : 'me';
}

export function shuf<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

export function rnd<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

/* ===================================================================
   1. TIC-TAC-TOE (Lines 4068-4082)
   =================================================================== */
export const TTT_WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export function tl(b: string[]): string | null {
  for (let i = 0; i < 8; i++) {
    const w = TTT_WINS[i];
    if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) {
      return b[w[0]];
    }
  }
  return b.indexOf('') < 0 ? 'draw' : null;
}

export const tttEngine = {
  init: () => ({ b: ['', '', '', '', '', '', '', '', ''] }),
  act: (b: string[], who: 'me' | 'them', a: number | string) => {
    const i = +a;
    if (b[i]) return null;
    b[i] = who;
    const r = tl(b);
    return r ? { end: r } : {};
  },
  ai: (b: string[]) => {
    let mv = -1;
    // 1. Win
    for (let i = 0; i < 9 && mv < 0; i++) {
      if (!b[i]) {
        b[i] = 'them';
        if (tl(b) === 'them') mv = i;
        b[i] = '';
      }
    }
    // 2. Block
    for (let i = 0; i < 9 && mv < 0; i++) {
      if (!b[i]) {
        b[i] = 'me';
        if (tl(b) === 'me') mv = i;
        b[i] = '';
      }
    }
    // 3. Center
    if (mv < 0 && !b[4]) mv = 4;
    // 4. Corners
    if (mv < 0) {
      const t = [0, 2, 6, 8].filter((k) => !b[k]);
      if (t.length) mv = rnd(t);
    }
    // 5. Edges
    if (mv < 0) {
      const t = [1, 3, 5, 7].filter((k) => !b[k]);
      if (t.length) mv = t[0];
    }
    return String(mv >= 0 ? mv : 0);
  }
};

/* ===================================================================
   2. CONNECT FOUR (Lines 4085-4115)
   =================================================================== */
export const C4_DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

export function c4w(b: string[]): string | null {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const v = b[r * 7 + c];
      if (!v) continue;
      for (let k = 0; k < 4; k++) {
        const dr = C4_DIRS[k][0], dc = C4_DIRS[k][1];
        let n = 1;
        while (n < 4) {
          const rr = r + dr * n, cc = c + dc * n;
          if (rr < 0 || rr > 5 || cc < 0 || cc > 6 || b[rr * 7 + cc] !== v) break;
          n++;
        }
        if (n === 4) return v;
      }
    }
  }
  return b.indexOf('') < 0 ? 'draw' : null;
}

export function c4drop(b: string[], c: number, w: string): number {
  for (let r = 5; r >= 0; r--) {
    if (!b[r * 7 + c]) {
      b[r * 7 + c] = w;
      return r * 7 + c;
    }
  }
  return -1;
}

export const c4Engine = {
  init: () => ({ b: Array(42).fill(''), last: -1 }),
  act: (b: string[], who: string, a: number | string) => {
    const c = +a;
    if (c < 0 || c > 6) return null;
    const i = c4drop(b, c, who);
    if (i < 0) return null;
    const r = c4w(b);
    return { last: i, end: r };
  },
  ai: (b: string[]) => {
    const v: number[] = [];
    for (let c = 0; c < 7; c++) if (!b[c]) v.push(c);
    function wins(col: number, w: string) {
      const t = b.slice();
      c4drop(t, col, w);
      return c4w(t) === w;
    }
    for (let i = 0; i < v.length; i++) if (wins(v[i], 'them')) return String(v[i]);
    for (let i = 0; i < v.length; i++) if (wins(v[i], 'me')) return String(v[i]);
    const safe = v.filter((col) => {
      const t = b.slice();
      const p = c4drop(t, col, 'them');
      if (p < 7) return true;
      const t2 = t.slice();
      c4drop(t2, col, 'me');
      return c4w(t2) !== 'me';
    });
    const pool = safe.length ? safe : v;
    const W = [1, 2, 3, 5, 3, 2, 1];
    let best = -1;
    let pick: number[] = [pool[0] ?? 3];
    pool.forEach((col) => {
      const s = W[col] + Math.random() * 2;
      if (s > best) {
        best = s;
        pick = [col];
      }
    });
    return String(pick[0]);
  }
};

/* ===================================================================
   3. ROCK PAPER SCISSORS (Lines 4117-4136)
   =================================================================== */
export const RPSE: Record<string, string> = { r: '✊', p: '✋', s: '✌️' };

export function rpsBeats(a: string, b: string): boolean {
  return (a === 'r' && b === 's') || (a === 's' && b === 'p') || (a === 'p' && b === 'r');
}

export function rpsTally(rd: { me: string; them: string }[]): { me: number; them: number } {
  const w = { me: 0, them: 0 };
  rd.forEach((r) => {
    if (rpsBeats(r.me, r.them)) w.me++;
    else if (rpsBeats(r.them, r.me)) w.them++;
  });
  return w;
}

/* ===================================================================
   4. TRIVIA QUIZ (Lines 4139-4178)
   =================================================================== */
export const TQ: [string, string, string[]][] = [
  ['What is the capital of Nigeria?', 'Abuja', ['Lagos', 'Kano', 'Ibadan']],
  ['Which is the largest planet?', 'Jupiter', ['Saturn', 'Earth', 'Neptune']],
  ['How many players does a football team have on the pitch?', '11', ['9', '10', '12']],
  ['What is the chemical symbol for gold?', 'Au', ['Ag', 'Gd', 'Go']],
  ['Who wrote “Things Fall Apart”?', 'Chinua Achebe', ['Wole Soyinka', 'Chimamanda Adichie', 'Ben Okri']],
  ['Which is the largest ocean?', 'Pacific', ['Atlantic', 'Indian', 'Arctic']],
  ['What does HTML stand for?', 'HyperText Markup Language', ['High Tech Modern Language', 'Hyper Transfer Markup Link', 'Home Tool Markup Language']],
  ['How many continents are there?', '7', ['5', '6', '8']],
  ['Which is the fastest land animal?', 'Cheetah', ['Lion', 'Horse', 'Leopard']],
  ['In which year did Nigeria gain independence?', '1960', ['1957', '1963', '1970']],
  ['What is the square root of 144?', '12', ['14', '11', '13']],
  ['Which is the longest river in Africa?', 'Nile', ['Niger', 'Congo', 'Zambezi']],
  ['Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Mercury', 'Saturn']],
  ['Who painted the Mona Lisa?', 'Leonardo da Vinci', ['Michelangelo', 'Raphael', 'Picasso']],
  ['What is 5 in binary?', '101', ['110', '011', '111']],
  ['What is the currency of Japan?', 'Yen', ['Won', 'Yuan', 'Ringgit']],
  ['Which gas do plants absorb?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium']],
  ['What is the smallest prime number?', '2', ['0', '1', '3']],
  ['What language is mainly spoken in Brazil?', 'Portuguese', ['Spanish', 'French', 'English']],
  ['How many minutes are in a regular football match?', '90', ['80', '100', '120']]
];

export function initTriviaRound() {
  const qs = shuf(TQ).slice(0, 5).map((q) => {
    const o = shuf([q[1], ...q[2]]);
    return { q: q[0], o, a: o.indexOf(q[1]) };
  });
  return { qs, i: 0, score: 0, fb: null as { p: number } | null };
}

/* ===================================================================
   5. WORD SCRAMBLE (Lines 4150-4151, 4179-4196)
   =================================================================== */
export const WL = [
  'PLANET', 'GUITAR', 'JOLLOF', 'BRIDGE', 'ORANGE',
  'FOOTBALL', 'MARKET', 'WINDOW', 'CAMERA', 'DOCTOR',
  'SCHOOL', 'SUMMER', 'COFFEE', 'TICKET', 'SILVER',
  'ISLAND', 'POCKET', 'FRIEND', 'LAPTOP', 'CHARGER'
];

export function scrambleWord(w: string): string {
  let s = '', n = 0;
  do {
    s = shuf(w.split('')).join('');
  } while (s === w && n++ < 9);
  return s;
}

export function initWordRound() {
  const ws = shuf(WL).slice(0, 5).map((w) => ({ w, s: scrambleWord(w) }));
  return { ws, i: 0, solved: 0, msg: '' };
}

/* ===================================================================
   6. CHECKERS (Lines 4198-4251)
   =================================================================== */
export function ckInit(): string[] {
  const b = Array(64).fill('');
  for (let i = 0; i < 64; i++) {
    const r = i >> 3, c = i & 7;
    if ((r + c) % 2 === 1) {
      if (r < 3) b[i] = 't';
      else if (r > 4) b[i] = 'm';
    }
  }
  return b;
}

export function ckOwn(p: string, w: string): boolean {
  if (!p) return false;
  return w === 'me' ? p === 'm' || p === 'M' : p === 't' || p === 'T';
}

export interface CkMove {
  f: number;
  t: number;
  x?: number; // captured square
}

export function ckMoves(b: string[], w: string, cont: number | null): CkMove[] {
  const caps: CkMove[] = [];
  const steps: CkMove[] = [];
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (!ckOwn(p, w) || (cont != null && i !== cont)) continue;
    const king = p === p.toUpperCase();
    const dirs = king
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : w === 'me'
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];
    const r = i >> 3, c = i & 7;
    dirs.forEach((d) => {
      const r2 = r + d[0], c2 = c + d[1];
      if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) return;
      const t = r2 * 8 + c2;
      if (!b[t]) {
        steps.push({ f: i, t });
      } else if (ckOwn(b[t], oth(w))) {
        const r3 = r + 2 * d[0], c3 = c + 2 * d[1];
        if (r3 >= 0 && r3 <= 7 && c3 >= 0 && c3 <= 7 && !b[r3 * 8 + c3]) {
          caps.push({ f: i, t: r3 * 8 + c3, x: t });
        }
      }
    });
  }
  return caps.length ? caps : (cont != null ? [] : steps);
}

export const checkersEngine = {
  init: () => ({ b: ckInit(), cont: null as number | null, nc: 0, last: null as [number, number] | null }),
  act: (S: { b: string[]; cont: number | null; nc: number; last: any }, who: string, a: string) => {
    const parts = String(a).split(':');
    const f = +parts[0], t = +parts[1];
    const mv = ckMoves(S.b, who, S.cont).find((x) => x.f === f && x.t === t);
    if (!mv) return null;
    const pc = S.b[f];
    S.b[t] = pc;
    S.b[f] = '';
    if (mv.x != null) S.b[mv.x] = '';
    let promoted = false;
    const tr = t >> 3;
    if (pc === 'm' && tr === 0) {
      S.b[t] = 'M';
      promoted = true;
    } else if (pc === 't' && tr === 7) {
      S.b[t] = 'T';
      promoted = true;
    }
    S.last = [f, t];
    S.nc = mv.x != null ? 0 : S.nc + 1;
    if (mv.x != null && !promoted && ckMoves(S.b, who, t).length) {
      S.cont = t;
      return {};
    }
    S.cont = null;
    const opp = oth(who);
    if (!ckMoves(S.b, opp, null).length) return { end: who };
    if (S.nc >= 80) return { end: 'draw' };
    return {};
  },
  ai: (S: { b: string[]; cont: number | null }) => {
    const mv = ckMoves(S.b, 'them', S.cont);
    if (!mv.length) return null;
    const caps = mv.filter((x) => x.x != null);
    const pool = caps.length ? caps : mv;
    const good = pool.filter((x) => {
      if (x.x != null) return true;
      const b = S.b.slice();
      b[x.t] = b[x.f];
      b[x.f] = '';
      return !ckMoves(b, 'me', null).some((y) => y.x === x.t);
    });
    const pick = rnd(good.length ? good : pool);
    return pick.f + ':' + pick.t;
  }
};

/* ===================================================================
   7. CHESS (Lines 4253-4324)
   =================================================================== */
export const CHG: Record<string, string> = { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' };
export const CHV: Record<string, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

export function chInit(): string[] {
  const b = Array(64).fill('');
  const bk = 'RNBQKBNR';
  for (let c = 0; c < 8; c++) {
    b[c] = 'b' + bk[c];
    b[8 + c] = 'bP';
    b[48 + c] = 'wP';
    b[56 + c] = 'w' + bk[c];
  }
  return b;
}

export interface ChMove {
  f: number;
  t: number;
}

export function chGen(b: string[], col: 'w' | 'b'): ChMove[] {
  const out: ChMove[] = [];
  const en = col === 'w' ? 'b' : 'w';
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (!p || p[0] !== col) continue;
    const ty = p[1], r = i >> 3, c = i & 7;
    if (ty === 'P') {
      const d = col === 'w' ? -1 : 1;
      const st = col === 'w' ? 6 : 1;
      const rr = r + d;
      if (rr >= 0 && rr <= 7) {
        if (!b[rr * 8 + c]) {
          out.push({ f: i, t: rr * 8 + c });
          if (r === st && !b[(r + 2 * d) * 8 + c]) {
            out.push({ f: i, t: (r + 2 * d) * 8 + c });
          }
        }
        [-1, 1].forEach((dc) => {
          const c2 = c + dc;
          if (c2 >= 0 && c2 < 8 && b[rr * 8 + c2] && b[rr * 8 + c2][0] === en) {
            out.push({ f: i, t: rr * 8 + c2 });
          }
        });
      }
    } else if (ty === 'N' || ty === 'K') {
      const offs = ty === 'N'
        ? [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
        : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      offs.forEach((o) => {
        const r2 = r + o[0], c2 = c + o[1];
        if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) return;
        const q = b[r2 * 8 + c2];
        if (!q || q[0] === en) out.push({ f: i, t: r2 * 8 + c2 });
      });
    } else {
      const dirs = ty === 'B'
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : ty === 'R'
        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
        : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
      dirs.forEach((d) => {
        let r2 = r + d[0], c2 = c + d[1];
        while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
          const q = b[r2 * 8 + c2];
          if (!q) {
            out.push({ f: i, t: r2 * 8 + c2 });
          } else {
            if (q[0] === en) out.push({ f: i, t: r2 * 8 + c2 });
            break;
          }
          r2 += d[0];
          c2 += d[1];
        }
      });
    }
  }
  return out;
}

export function chApply(b: string[], mv: ChMove): string[] {
  const nb = b.slice();
  const p = nb[mv.f];
  nb[mv.t] = p;
  nb[mv.f] = '';
  // Pawns auto-promote to queen
  if (p[1] === 'P' && ((mv.t >> 3) === 0 || (mv.t >> 3) === 7)) {
    nb[mv.t] = p[0] + 'Q';
  }
  return nb;
}

export function chKing(b: string[], col: 'w' | 'b'): number {
  return b.indexOf(col + 'K');
}

export function chCheck(b: string[], col: 'w' | 'b'): boolean {
  const k = chKing(b, col);
  if (k < 0) return true;
  return chGen(b, col === 'w' ? 'b' : 'w').some((x) => x.t === k);
}

export function chLegal(b: string[], col: 'w' | 'b'): ChMove[] {
  return chGen(b, col).filter((mv) => !chCheck(chApply(b, mv), col));
}

export function chEval(b: string[], col: 'w' | 'b'): number {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (!p) continue;
    const r = i >> 3, c = i & 7;
    let v = CHV[p[1]] + ((p[1] === 'P' || p[1] === 'K') ? 0 : (3.5 - Math.abs(c - 3.5) + 3.5 - Math.abs(r - 3.5)) * 4);
    if (p[1] === 'P') {
      v += (p[0] === 'w' ? 6 - r : r - 1) * 4 + (3.5 - Math.abs(c - 3.5)) * 2;
    }
    s += p[0] === col ? v : -v;
  }
  return s;
}

export function chInsuf(b: string[]): boolean {
  let n = 0;
  for (let i = 0; i < 64; i++) {
    const p = b[i];
    if (p && p[1] !== 'K') {
      if (p[1] === 'P' || p[1] === 'R' || p[1] === 'Q') return false;
      n++;
    }
  }
  return n <= 1;
}

export const chessEngine = {
  init: (firstCol: 'w' | 'b' = 'w') => ({ b: chInit(), w: firstCol, last: null as [number, number] | null, half: 0 }),
  act: (S: { b: string[]; w: string; last: any; half: number }, whoCol: 'w' | 'b', a: string) => {
    const parts = String(a).split(':');
    const f = +parts[0], t = +parts[1];
    const mv = chLegal(S.b, whoCol).find((x) => x.f === f && x.t === t);
    if (!mv) return null;
    const cap = !!S.b[t] || S.b[f][1] === 'P';
    S.b = chApply(S.b, mv);
    S.last = [f, t];
    S.half = cap ? 0 : S.half + 1;
    const oc = whoCol === 'w' ? 'b' : 'w';
    const rep = chLegal(S.b, oc);
    if (!rep.length) return { end: chCheck(S.b, oc) ? whoCol : 'draw' };
    if (chInsuf(S.b) || S.half >= 100) return { end: 'draw' };
    return {};
  },
  ai: (S: { b: string[] }, col: 'w' | 'b' = 'b') => {
    const oc = col === 'w' ? 'b' : 'w';
    const mvs = chLegal(S.b, col);
    if (!mvs.length) return null;
    let best = -1e9;
    let pick = mvs[0];
    mvs.forEach((mv) => {
      const nb = chApply(S.b, mv);
      const rep = chLegal(nb, oc);
      let sc: number;
      if (!rep.length) {
        sc = chCheck(nb, oc) ? 1e6 : 0;
      } else {
        sc = 1e9;
        rep.forEach((r2) => {
          const v = chEval(chApply(nb, r2), col);
          if (v < sc) sc = v;
        });
      }
      sc += Math.random() * 6;
      if (sc > best) {
        best = sc;
        pick = mv;
      }
    });
    return pick.f + ':' + pick.t;
  }
};
