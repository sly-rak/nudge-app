import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { usePresence } from '../../context/PresenceContext.js';
import { wsClient } from '../../services/websocket.js';
import { api } from '../../services/api.js';
import { playTone } from '../../services/soundEffects.js';
import {
  GM,
  GORDER,
  normalizeGameKey,
  tttEngine,
  tl,
  c4Engine,
  c4w,
  c4drop,
  checkersEngine,
  ckInit,
  ckMoves,
  chessEngine,
  chInit,
  chLegal,
  chCheck,
  chKing,
  CHG,
  initTriviaRound,
  initWordRound,
  rpsBeats,
  rpsTally,
  RPSE,
  oth,
} from '@nudge/shared';
import {
  Gamepad2,
  ChevronLeft,
  X,
  Plus,
  Users,
  Trophy,
  History,
  Swords,
  Radio,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface GamesCenterProps {
  onClose?: () => void;
  conversationId?: string;
  isEmbedded?: boolean;
  initialOpponent?: OpponentProfile;
  initialSessionId?: string;
}

export interface OpponentProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  isBot?: boolean;
  botPersona?: {
    relationship?: string;
    tone?: string;
  };
}

const DEFAULT_BOTS: OpponentProfile[] = [
  {
    id: 'tola',
    username: 'tola',
    displayName: 'Tola',
    bio: 'FIFA champ · Football, banter, street food',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isBot: true,
    botPersona: { relationship: 'Best friend / FIFA rival ⚽' },
  },
  {
    id: 'mum',
    username: 'mum',
    displayName: 'Mum',
    bio: 'Mother of three · Always asking if you have eaten',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isBot: true,
    botPersona: { relationship: 'Loving mother ❤️' },
  },
  {
    id: 'chidi',
    username: 'chidi',
    displayName: 'Chidi',
    bio: 'Backend Dev · Coffee first, deploy later',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isBot: true,
    botPersona: { relationship: 'Tech lead / Architect 💻' },
  },
  {
    id: 'amaka',
    username: 'amaka',
    displayName: 'Amaka',
    bio: 'Final year student · Past questions pro',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    isBot: true,
    botPersona: { relationship: 'Study partner 📚' },
  },
  {
    id: 'seyi',
    username: 'seyi',
    displayName: 'Seyi',
    bio: 'Big brother · Third Mainland veteran',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    isBot: true,
    botPersona: { relationship: 'Older brother 🚗' },
  },
  {
    id: 'jide',
    username: 'jide',
    displayName: 'Jide',
    bio: 'Gym at 5:55am · No excuses',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    isBot: true,
    botPersona: { relationship: 'Gym coach 🏋️‍♂️' },
  },
  {
    id: 'dami',
    username: 'dami',
    displayName: 'Dami',
    bio: 'Freelance designer · Figma tokens',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    isBot: true,
    botPersona: { relationship: 'Design colleague ✨' },
  },
];

type GCView = 'home' | 'find' | 'create' | 'mine' | 'chal' | 'active' | 'hist' | 'play';

export const GamesCenter: React.FC<GamesCenterProps> = ({
  onClose,
  conversationId,
  isEmbedded = false,
  initialOpponent,
  initialSessionId,
}) => {
  const { user } = useAuth();
  const { isOnline, getStatusLabel } = usePresence();

  // Navigation state (matching standalone gcV)
  const [view, setView] = useState<GCView>(initialSessionId ? 'play' : 'home');
  const [selectedGameKey, setSelectedGameKey] = useState<string>('c4');

  // Opponents & Chat Contacts
  const [opponents, setOpponents] = useState<OpponentProfile[]>(DEFAULT_BOTS);
  const [currentOpponent, setCurrentOpponent] = useState<OpponentProfile>(initialOpponent || DEFAULT_BOTS[0]);
  const [selectedTargetUser, setSelectedTargetUser] = useState<string | null>(null);

  // Active game session state
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [gameState, setGameState] = useState<Record<string, any>>({});
  const [gameStatus, setGameStatus] = useState<string>('in_progress');
  const [gameWinnerId, setGameWinnerId] = useState<string | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [selectedBoardSquare, setSelectedBoardSquare] = useState<number | null>(null);
  const [wordGuessInput, setWordGuessInput] = useState('');

  // LFG Posts & Invites
  const [lfgPosts, setLfgPosts] = useState<any[]>([]);
  const [showLfgModal, setShowLfgModal] = useState(false);
  const [lfgForm, setLfgForm] = useState({ gid: 'chess', mode: '1v1', need: 1, note: '' });
  const [floatingNotification, setFloatingNotification] = useState<{
    text: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Challenges, Matches & History
  const [challenges, setChallenges] = useState<any[]>([]);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  // Stats per game (saved in localStorage and updated on game complete)
  const [gameStats, setGameStats] = useState<Record<string, { w: number; l: number; d: number }>>(() => {
    try {
      const s = localStorage.getItem('nudge_game_stats_v1');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  // Sync initialOpponent
  useEffect(() => {
    if (initialOpponent) {
      setCurrentOpponent(initialOpponent);
    }
  }, [initialOpponent?.id]);

  // Load opponents from server
  useEffect(() => {
    api.searchUsers('')
      .then((res) => {
        if (res.users && res.users.length > 0) {
          const list = res.users.filter((u: any) => u.id !== user?.id);
          if (list.length > 0) {
            setOpponents(list);
            if (!initialOpponent) {
              const tola = list.find((b: any) => b.username === 'tola') || list[0];
              setCurrentOpponent(tola);
            }
          }
        }
      })
      .catch(() => {});
  }, [user, initialOpponent]);

  // Load LFG posts
  const loadLFG = () => {
    api.getLFGPosts()
      .then((res) => {
        if (res.posts) setLfgPosts(res.posts);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadLFG();
  }, []);

  // Save stats to localStorage
  const recordResult = (gid: string, res: 'win' | 'loss' | 'draw') => {
    setGameStats((prev) => {
      const cur = prev[gid] || { w: 0, l: 0, d: 0 };
      const updated = {
        ...prev,
        [gid]: {
          w: cur.w + (res === 'win' ? 1 : 0),
          l: cur.l + (res === 'loss' ? 1 : 0),
          d: cur.d + (res === 'draw' ? 1 : 0),
        },
      };
      try {
        localStorage.setItem('nudge_game_stats_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setGameHistory((prev) => [
      {
        id: 'hist_' + Date.now(),
        gid,
        res,
        opponentName: currentOpponent.displayName,
        time: Date.now(),
      },
      ...prev,
    ]);
  };

  // Launch a game session
  const startMatch = async (gid: string, opp: OpponentProfile) => {
    setSelectedGameKey(gid);
    setCurrentOpponent(opp);
    setSelectedBoardSquare(null);
    setWordGuessInput('');
    setIsBotThinking(false);
    setView('play');

    try {
      const res = await api.createGameSession(gid, conversationId, opp.id);
      setSessionId(res.session.id);
      setGameState(res.session.state || {});
      setGameStatus(res.session.status || 'in_progress');
      setGameWinnerId(res.session.winnerId || null);
      playTone('bop');
    } catch (err) {
      console.error('Failed to create match session:', err);
    }
  };

  // Open existing game session
  const openSession = async (sessId: string, gid: string, oppName: string) => {
    setSelectedGameKey(gid);
    setSelectedBoardSquare(null);
    setWordGuessInput('');
    setIsBotThinking(false);
    setSessionId(sessId);
    setView('play');

    try {
      const res = await api.getGameSession(sessId);
      setGameState(res.session.state || {});
      setGameStatus(res.session.status || 'in_progress');
      setGameWinnerId(res.session.winnerId || null);
      if (res.opponent) {
        setCurrentOpponent(res.opponent);
      }
    } catch (err) {
      console.error('Failed to fetch game session:', err);
    }
  };

  // WebSocket game.state subscription
  useEffect(() => {
    const unsub = wsClient.on('game.state', (data: any) => {
      if (sessionId && data.sessionId === sessionId) {
        setGameState(data.state);
        setGameStatus(data.status);
        setGameWinnerId(data.winnerId);
        setIsBotThinking(false);

        if (data.status === 'completed') {
          const isUser = data.winnerId === user?.id;
          const res = data.winnerId ? (isUser ? 'win' : 'loss') : 'draw';
          playTone(isUser ? 'chime' : 'drop');
          recordResult(selectedGameKey, res);
        } else {
          playTone('pop');
        }
      }
    });

    return () => unsub();
  }, [sessionId, user, selectedGameKey]);

  // Make move via API
  const makeMove = async (action: any) => {
    if (!sessionId || gameStatus === 'completed') return;

    // Optimistic local update
    setIsBotThinking(true);
    playTone('pop');

    try {
      const res = await api.makeGameMove(sessionId, { action }, 'me');
      setGameState(res.session.state);
      setGameStatus(res.session.status);
      setGameWinnerId(res.session.winnerId || null);

      if (res.session.status === 'completed') {
        setIsBotThinking(false);
        const isUser = res.session.winnerId === user?.id;
        const result = res.session.winnerId ? (isUser ? 'win' : 'loss') : 'draw';
        playTone(isUser ? 'chime' : 'drop');
        recordResult(selectedGameKey, result);
      }
    } catch (err) {
      setIsBotThinking(false);
      console.error('Move execution failed:', err);
    }
  };

  // Status label
  const getStatusOfGame = () => {
    if (gameStatus === 'completed') {
      if (!gameWinnerId) return 'Match drawn!';
      return gameWinnerId === user?.id ? '🎉 You won!' : `${currentOpponent.displayName} won!`;
    }
    const isMyTurn = gameState.turn === 'me' || gameState.turn === 'X' || gameState.turn === 'red' || gameState.turn === 'w';
    if (isBotThinking) return `${currentOpponent.displayName} is thinking…`;
    return isMyTurn ? 'Your turn' : `${currentOpponent.displayName} is thinking…`;
  };

  // ===================================================================
  // RENDER GAMEPLAY ENGINES
  // ===================================================================

  // 1. Tic-Tac-Toe
  const renderTicTacToe = () => {
    const b: string[] = gameState.b || gameState.board || Array(9).fill('');
    const isMyTurn = (gameState.turn === 'me' || gameState.turn === 'X') && gameStatus === 'in_progress';

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 300, margin: '20px auto' }}>
        {b.map((val, idx) => {
          const displayChar = val === 'me' || val === 'X' ? 'X' : val === 'them' || val === 'O' ? 'O' : '';
          return (
            <button
              key={idx}
              type="button"
              disabled={Boolean(val) || !isMyTurn}
              onClick={() => makeMove(idx)}
              style={{
                aspectRatio: '1',
                borderRadius: 14,
                border: '1px solid var(--line)',
                backgroundColor: 'var(--panel)',
                color: displayChar === 'X' ? 'var(--accent)' : '#F2B134',
                fontSize: 34,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                cursor: val || !isMyTurn ? 'default' : 'pointer',
                transition: 'background 0.15s, transform 0.1s',
              }}
            >
              {displayChar}
            </button>
          );
        })}
      </div>
    );
  };

  // 2. Connect Four (7 columns x 6 rows)
  const renderConnectFour = () => {
    const b: string[] = gameState.b || gameState.board || Array(42).fill('');
    const lastMove = gameState.last;
    const isMyTurn = (gameState.turn === 'me' || gameState.turn === 'red') && gameStatus === 'in_progress';

    return (
      <div className="c4" role="group" aria-label="Connect Four board">
        {Array.from({ length: 7 }).map((_, c) => {
          const colFull = Boolean(b[c]);
          return (
            <button
              key={c}
              type="button"
              disabled={colFull || !isMyTurn}
              onClick={() => makeMove(c)}
              aria-label={`Drop in column ${c + 1}`}
            >
              {Array.from({ length: 6 }).map((_, r) => {
                const cellIdx = r * 7 + c;
                const cellVal = b[cellIdx];
                const isLast = lastMove === cellIdx;
                const discClass = cellVal === 'me' || cellVal === 'red' ? 'dc me' : cellVal === 'them' || cellVal === 'yellow' ? 'dc them' : 'dc';

                return (
                  <i
                    key={r}
                    className={`${discClass} ${isLast ? 'lm' : ''}`}
                  />
                );
              })}
            </button>
          );
        })}
      </div>
    );
  };

  // 3. Checkers (8x8 board)
  const renderCheckers = () => {
    const b: string[] = gameState.b || ckInit();
    const isMyTurn = gameState.turn === 'me' && gameStatus === 'in_progress';
    const validMoves = isMyTurn ? ckMoves(b, 'me', gameState.cont || null) : [];
    const validDests = new Set(
      validMoves
        .filter((mv) => selectedBoardSquare !== null && mv.f === selectedBoardSquare)
        .map((mv) => mv.t)
    );

    const handleSquareClick = (idx: number) => {
      if (!isMyTurn) return;
      if (selectedBoardSquare !== null && validDests.has(idx)) {
        const moveStr = `${selectedBoardSquare}:${idx}`;
        setSelectedBoardSquare(null);
        makeMove(moveStr);
      } else if (validMoves.some((mv) => mv.f === idx)) {
        setSelectedBoardSquare(idx);
      } else {
        setSelectedBoardSquare(null);
      }
    };

    return (
      <div className="ckb" role="grid" aria-label="Checkers board">
        {Array.from({ length: 64 }).map((_, i) => {
          const r = i >> 3, cc = i & 7;
          const isDark = (r + cc) % 2 === 1;
          const p = b[i];
          const isSelected = selectedBoardSquare === i;
          const isDest = validDests.has(i);
          const isLast = gameState.last && (gameState.last[0] === i || gameState.last[1] === i);

          if (!isDark) {
            return <span key={i} className="csq l" />;
          }

          return (
            <button
              key={i}
              type="button"
              className={`csq d ${isSelected ? 'sel' : ''} ${isDest ? 'mv' : ''} ${isLast ? 'lm' : ''}`}
              disabled={!isMyTurn}
              onClick={() => handleSquareClick(i)}
            >
              {p && (
                <span className={`pc ${p.toLowerCase()}`}>
                  {p === p.toUpperCase() ? '♛' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // 4. Chess (8x8 board)
  const renderChess = () => {
    const b: string[] = gameState.b || chInit();
    const isMyTurn = (gameState.turn === 'me' || gameState.turn === 'w') && gameStatus === 'in_progress';
    const legalMoves = isMyTurn ? chLegal(b, 'w') : [];
    const validDests = new Set(
      legalMoves
        .filter((mv) => selectedBoardSquare !== null && mv.f === selectedBoardSquare)
        .map((mv) => mv.t)
    );
    const inCheck = chCheck(b, 'w') ? chKing(b, 'w') : chCheck(b, 'b') ? chKing(b, 'b') : -1;

    const handleSquareClick = (idx: number) => {
      if (!isMyTurn) return;
      if (selectedBoardSquare !== null && validDests.has(idx)) {
        const moveStr = `${selectedBoardSquare}:${idx}`;
        setSelectedBoardSquare(null);
        makeMove(moveStr);
      } else if (legalMoves.some((mv) => mv.f === idx)) {
        setSelectedBoardSquare(idx);
      } else {
        setSelectedBoardSquare(null);
      }
    };

    return (
      <div>
        <div className="chb" role="grid" aria-label="Chess board">
          {Array.from({ length: 64 }).map((_, i) => {
            const r = i >> 3, cc = i & 7;
            const isDark = (r + cc) % 2 === 1;
            const p = b[i];
            const isSelected = selectedBoardSquare === i;
            const isDest = validDests.has(i);
            const isCheckSquare = inCheck === i;
            const isLast = gameState.last && (gameState.last[0] === i || gameState.last[1] === i);

            return (
              <button
                key={i}
                type="button"
                className={`csq ${isDark ? 'd' : 'l'} ${isSelected ? 'sel' : ''} ${isDest ? 'mv' : ''} ${isCheckSquare ? 'chk' : ''} ${isLast ? 'lm' : ''}`}
                disabled={!isMyTurn}
                onClick={() => handleSquareClick(i)}
              >
                {p && (
                  <span className={p[0] === 'w' ? 'pw' : 'pb'}>
                    {CHG[p[1]] || '♟'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>
          You play white. Pawns auto-promote to Queen.
        </p>
      </div>
    );
  };

  // 5. Rock Paper Scissors
  const renderRPS = () => {
    const rounds = gameState.rd || [];
    const tally = rpsTally(rounds);
    const last = rounds[rounds.length - 1];

    return (
      <div style={{ padding: '16px 0', textAlign: 'center' }}>
        <div className="rpsr">
          {(['r', 'p', 's'] as const).map((k) => (
            <button
              key={k}
              type="button"
              disabled={gameStatus === 'completed'}
              onClick={() => makeMove(k)}
              aria-label={k === 'r' ? 'Rock' : k === 'p' ? 'Paper' : 'Scissors'}
            >
              {RPSE[k]}
            </button>
          ))}
        </div>

        <div className="rpsx">
          You {tally.me} · {tally.them} {currentOpponent.displayName}
        </div>

        {last && (
          <div className="rpsl">
            Last round: {RPSE[last.me]} vs {RPSE[last.them]} ·{' '}
            {rpsBeats(last.me, last.them)
              ? 'you win it!'
              : rpsBeats(last.them, last.me)
              ? `${currentOpponent.displayName} wins it`
              : 'draw, go again!'}
          </div>
        )}
      </div>
    );
  };

  // 6. Trivia Quiz
  const renderTrivia = () => {
    const qs = gameState.qs || [];
    const i = gameState.i || 0;
    const score = gameState.score || 0;
    const fb = gameState.fb;
    const currentQ = qs[i];

    if (gameStatus === 'completed') {
      return (
        <div className="lbd">
          <h3 style={{ textAlign: 'center', margin: '0 0 12px' }}>Trivia Results</h3>
          <div className="lbr you">
            <span>1</span>
            <b>You</b>
            <i>{score} / 5</i>
          </div>
          <div className="lbr">
            <span>2</span>
            <b>{currentOpponent.displayName}</b>
            <i>{Math.min(5, Math.max(1, score + (Math.random() > 0.5 ? 1 : -1)))} / 5</i>
          </div>
        </div>
      );
    }

    if (!currentQ) return null;

    return (
      <div style={{ padding: '8px 4px' }}>
        <div className="trn">
          Question {i + 1} of 5 · Score {score}
        </div>
        <div className="trq">{currentQ.q}</div>

        <div className="tro">
          {currentQ.o.map((opt: string, optIdx: number) => {
            let optClass = 'trop';
            if (fb) {
              if (optIdx === currentQ.a) optClass += ' ok';
              else if (optIdx === fb.p) optClass += ' bad';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={Boolean(fb)}
                className={optClass}
                onClick={() => makeMove(optIdx)}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {fb && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button
              className="gcwide"
              type="button"
              onClick={() => makeMove('next')}
            >
              {i >= 4 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // 7. Word Scramble
  const renderWordScramble = () => {
    const ws = gameState.ws || [];
    const i = gameState.i || 0;
    const solved = gameState.solved || 0;
    const msg = gameState.msg || '';
    const currentW = ws[i];

    if (gameStatus === 'completed') {
      return (
        <div className="lbd">
          <h3 style={{ textAlign: 'center', margin: '0 0 12px' }}>Word Scramble Final Score</h3>
          <div className="lbr you">
            <span>1</span>
            <b>You</b>
            <i>{solved} / 5 solved</i>
          </div>
          <div className="lbr">
            <span>2</span>
            <b>{currentOpponent.displayName}</b>
            <i>{Math.min(5, Math.max(1, solved + (Math.random() > 0.5 ? 1 : -1)))} / 5 solved</i>
          </div>
        </div>
      );
    }

    if (!currentW) return null;

    return (
      <div style={{ padding: '8px 4px' }}>
        <div className="trn">
          Word {i + 1} of 5 · Solved {solved}
        </div>

        <div className="wsc" aria-label="Scrambled letters">
          {currentW.s.split('').map((l: string, idx: number) => (
            <i key={idx}>{l}</i>
          ))}
        </div>

        <form
          className="wsf"
          onSubmit={(e) => {
            e.preventDefault();
            if (wordGuessInput.trim()) {
              makeMove(`g:${wordGuessInput}`);
              setWordGuessInput('');
            }
          }}
        >
          <input
            id="wgi"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            aria-label="Your answer"
            placeholder="TYPE THE WORD"
            value={wordGuessInput}
            onChange={(e) => setWordGuessInput(e.target.value.toUpperCase())}
          />
          <button className="postb" type="submit" style={{ padding: '0 16px', borderRadius: 12 }}>
            Check
          </button>
        </form>

        <div className="wsm" aria-live="polite">
          {msg}
        </div>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            className="outb"
            type="button"
            onClick={() => makeMove('skip')}
            style={{ padding: '6px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
          >
            Skip Word
          </button>
        </div>
      </div>
    );
  };

  // ===================================================================
  // MAIN VIEW RENDERER
  // ===================================================================

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Floating LFG Notification Banner (#lfpop) */}
      {floatingNotification && (
        <div className="lfpop">
          <span className="lpe">🎮</span>
          <span className="lpt">{floatingNotification.text}</span>
          {floatingNotification.actionLabel && (
            <button
              className="postb"
              onClick={() => {
                floatingNotification.onAction?.();
                setFloatingNotification(null);
              }}
            >
              {floatingNotification.actionLabel}
            </button>
          )}
          <button
            onClick={() => setFloatingNotification(null)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'grid', placeItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--panel)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {view !== 'home' && (
            <button
              onClick={() => setView('home')}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--hover)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            {view === 'home' && 'Games'}
            {view === 'find' && 'Find a Player'}
            {view === 'create' && 'Create a Game'}
            {view === 'mine' && 'My Games'}
            {view === 'chal' && 'Challenges'}
            {view === 'active' && 'Active Matches'}
            {view === 'hist' && 'Game History'}
            {view === 'play' && `${GM[selectedGameKey]?.n || 'Match'} · ${currentOpponent.displayName}`}
          </h2>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--hover)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--muted)',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Body Views */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* 1. HOME VIEW (Hub with 6 Navigation Rows) */}
        {view === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="gcrow" onClick={() => { setView('find'); loadLFG(); }}>
              <span className="gce">
                <Radio size={20} />
              </span>
              <span className="gct">
                <b>Find a Player</b>
                <small>{lfgPosts.length ? `${lfgPosts.length} open games right now` : 'Post when you want a game'}</small>
              </span>
              {lfgPosts.length > 0 && <span className="gcb2 hot">{lfgPosts.length}</span>}
            </button>

            <button className="gcrow" onClick={() => setView('create')}>
              <span className="gce">
                <Swords size={20} />
              </span>
              <span className="gct">
                <b>Create a Game</b>
                <small>Challenge a friend or a group</small>
              </span>
            </button>

            <button className="gcrow" onClick={() => setView('mine')}>
              <span className="gce">
                <Gamepad2 size={20} />
              </span>
              <span className="gct">
                <b>My Games</b>
                <small>Your records and favorite games</small>
              </span>
            </button>

            <button className="gcrow" onClick={() => setView('chal')}>
              <span className="gce">
                <Trophy size={20} />
              </span>
              <span className="gct">
                <b>Challenges</b>
                <small>{challenges.length ? `${challenges.length} waiting for answer` : 'Sent and received'}</small>
              </span>
              {challenges.length > 0 && <span className="gcb2 hot">{challenges.length}</span>}
            </button>

            <button className="gcrow" onClick={() => setView('active')}>
              <span className="gce">
                <CheckCircle2 size={20} />
              </span>
              <span className="gct">
                <b>Active Matches</b>
                <small>{activeMatches.length ? `${activeMatches.length} in progress` : 'Nothing in progress'}</small>
              </span>
            </button>

            <button className="gcrow" onClick={() => setView('hist')}>
              <span className="gce">
                <History size={20} />
              </span>
              <span className="gct">
                <b>Game History</b>
                <small>{gameHistory.length ? `${gameHistory.length} matches played` : 'Finished matches'}</small>
              </span>
            </button>
          </div>
        )}

        {/* 2. FIND A PLAYER (LFG Feed) */}
        {view === 'find' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="gcwide" onClick={() => setShowLfgModal(true)}>
              + Looking for a Player
            </button>

            <div className="gch">Open Games</div>
            {lfgPosts.filter((p) => p.status === 'open' && p.by !== user?.id).length === 0 ? (
              <div className="gcempty">
                <b>No open posts right now</b>
                <span>Tap "Looking for a Player" to invite friends and bot rivals.</span>
              </div>
            ) : (
              lfgPosts
                .filter((p) => p.status === 'open' && p.by !== user?.id)
                .map((p) => {
                  const g = GM[p.gameKey] || { n: 'Game', e: '🎮' };
                  const isJoined = (p.joined || []).some((j: any) => j.id === user?.id);
                  return (
                    <div key={p.id} className="mrow">
                      <span className="gic">{g.e}</span>
                      <span className="gtx">
                        <b>{p.byUser?.displayName || 'Friend'} is looking for {g.n}</b>
                        <small>
                          {p.mode === 'party' ? 'Party' : '1v1'} · {p.playersNeeded} needed
                          {p.note ? ` · "${p.note}"` : ''}
                        </small>
                      </span>
                      <span className="mbt">
                        {isJoined ? (
                          <span className="lfst">Joined</span>
                        ) : (
                          <button
                            type="button"
                            className="postb"
                            onClick={async () => {
                              try {
                                const res = await api.joinLFGPost(p.id);
                                if (res.post?.matchSessionId) {
                                  openSession(res.post.matchSessionId, p.gameKey, p.byUser?.displayName || 'Friend');
                                } else {
                                  loadLFG();
                                }
                              } catch (err) {
                                console.error('Join LFG error:', err);
                              }
                            }}
                          >
                            Join Game
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })
            )}

            <div className="gch">Your Posts</div>
            {lfgPosts.filter((p) => p.by === user?.id).length === 0 ? (
              <div className="gcempty">
                <b>No active posts yet</b>
              </div>
            ) : (
              lfgPosts
                .filter((p) => p.by === user?.id)
                .map((p) => {
                  const g = GM[p.gameKey] || { n: 'Game', e: '🎮' };
                  return (
                    <div key={p.id} className="mrow">
                      <span className="gic">{g.e}</span>
                      <span className="gtx">
                        <b>{g.n} · {p.mode}</b>
                        <small>Status: {p.status}</small>
                      </span>
                      <span className="mbt">
                        {p.status === 'open' ? (
                          <button
                            type="button"
                            className="outb"
                            onClick={async () => {
                              await api.closeLFGPost(p.id);
                              loadLFG();
                            }}
                          >
                            Close
                          </button>
                        ) : p.matchSessionId ? (
                          <button
                            type="button"
                            className="postb"
                            onClick={() => openSession(p.matchSessionId, p.gameKey, 'Opponent')}
                          >
                            Play
                          </button>
                        ) : null}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* 3. CREATE A GAME */}
        {view === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="gch">1. Pick a Game</div>
            <div className="gpick">
              {GORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={selectedGameKey === k}
                  onClick={() => setSelectedGameKey(k)}
                >
                  <span className="gic">{GM[k].e}</span>
                  <span>
                    <b>{GM[k].n}</b>
                    <small>{GM[k].d}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="gch">2. Pick Opponent</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {opponents.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setSelectedTargetUser(opp.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 12,
                    border: selectedTargetUser === opp.id ? '2px solid var(--accent)' : '1px solid var(--line)',
                    background: 'var(--panel)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Avatar url={opp.avatarUrl} name={opp.displayName} size={36} online={isOnline(opp.id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 13.5, color: 'var(--ink)' }}>{opp.displayName}</b>
                    <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {opp.isBot ? 'Bot Rival' : isOnline(opp.id) ? 'Online' : 'Offline'}
                    </small>
                  </div>
                </button>
              ))}
            </div>

            <button
              className="gcwide"
              disabled={!selectedTargetUser}
              onClick={() => {
                const target = opponents.find((o) => o.id === selectedTargetUser);
                if (target) {
                  startMatch(selectedGameKey, target);
                }
              }}
            >
              Start Duel
            </button>
          </div>
        )}

        {/* 4. MY GAMES */}
        {view === 'mine' && (
          <div className="gmg">
            {GORDER.map((k) => {
              const s = gameStats[k] || { w: 0, l: 0, d: 0 };
              const total = s.w + s.l + s.d;
              return (
                <div key={k} className="gmc">
                  <span className="gic">{GM[k].e}</span>
                  <b style={{ color: 'var(--ink)', fontSize: 14 }}>{GM[k].n}</b>
                  <small>
                    {total ? `${total} played · ${s.w}W ${s.l}L ${s.d}D` : 'Not played yet'}
                  </small>
                  <div className="gbt2">
                    <button
                      type="button"
                      className="postb"
                      onClick={() => {
                        setSelectedGameKey(k);
                        setView('create');
                      }}
                    >
                      Challenge
                    </button>
                    <button
                      type="button"
                      className="outb"
                      onClick={() => {
                        setLfgForm((prev) => ({ ...prev, gid: k }));
                        setShowLfgModal(true);
                      }}
                    >
                      Find
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. CHALLENGES */}
        {view === 'chal' && (
          <div>
            <div className="gch">Received</div>
            <div className="gcempty">
              <b>No challenges waiting</b>
              <span>When a friend or rival challenges you, it shows up here.</span>
            </div>

            <div className="gch" style={{ marginTop: 16 }}>Sent</div>
            <div className="gcempty">
              <b>Nothing pending</b>
              <span>Challenges you send wait here for an answer.</span>
            </div>
          </div>
        )}

        {/* 6. ACTIVE MATCHES */}
        {view === 'active' && (
          <div>
            {sessionId ? (
              <div className="mrow">
                <span className="gic">{GM[selectedGameKey]?.e || '🎮'}</span>
                <span className="gtx">
                  <b>{GM[selectedGameKey]?.n || 'Match'} · {currentOpponent.displayName}</b>
                  <small>{getStatusOfGame()}</small>
                </span>
                <span className="mbt">
                  <button className="postb" onClick={() => setView('play')}>
                    Continue
                  </button>
                </span>
              </div>
            ) : (
              <div className="gcempty">
                <b>No active matches</b>
                <span>Accept a challenge or create a game to duel.</span>
              </div>
            )}
          </div>
        )}

        {/* 7. GAME HISTORY */}
        {view === 'hist' && (
          <div>
            <div className="gsum">
              <div>
                <b>{Object.values(gameStats).reduce((acc, s) => acc + s.w, 0)}</b>
                <small>Won</small>
              </div>
              <div>
                <b>{Object.values(gameStats).reduce((acc, s) => acc + s.l, 0)}</b>
                <small>Lost</small>
              </div>
              <div>
                <b>{Object.values(gameStats).reduce((acc, s) => acc + s.d, 0)}</b>
                <small>Draws</small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['all', 'win', 'loss', 'draw'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHistoryFilter(f)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    background: historyFilter === f ? 'var(--accent)' : 'var(--panel)',
                    color: historyFilter === f ? 'var(--accent-ink)' : 'var(--ink)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {f === 'all' ? 'All' : f === 'win' ? 'Wins' : f === 'loss' ? 'Losses' : 'Draws'}
                </button>
              ))}
            </div>

            {gameHistory.length === 0 ? (
              <div className="gcempty">
                <b>Nothing here yet</b>
                <span>Finished matches are recorded here.</span>
              </div>
            ) : (
              gameHistory
                .filter((h) => historyFilter === 'all' || h.res === historyFilter)
                .map((h) => (
                  <div key={h.id} className="mrow">
                    <span className="gic">{GM[h.gid]?.e || '🎮'}</span>
                    <span className="gtx">
                      <b>{GM[h.gid]?.n || 'Game'} · {h.opponentName}</b>
                      <small>{new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </span>
                    <span className={`res ${h.res}`}>
                      {h.res === 'win' ? 'Won' : h.res === 'loss' ? 'Lost' : 'Draw'}
                    </span>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 8. MATCH PLAY VIEW */}
        {view === 'play' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 2 }}>
                {getStatusOfGame()}
              </div>
            </div>

            {/* Render respective engine */}
            {selectedGameKey === 'ttt' && renderTicTacToe()}
            {selectedGameKey === 'c4' && renderConnectFour()}
            {selectedGameKey === 'checkers' && renderCheckers()}
            {selectedGameKey === 'chess' && renderChess()}
            {selectedGameKey === 'rps' && renderRPS()}
            {selectedGameKey === 'trivia' && renderTrivia()}
            {selectedGameKey === 'word' && renderWordScramble()}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
              {gameStatus === 'in_progress' ? (
                <button
                  type="button"
                  className="outb"
                  onClick={() => {
                    setGameStatus('completed');
                    setGameWinnerId(currentOpponent.id);
                    recordResult(selectedGameKey, 'loss');
                    playTone('drop');
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    border: '1px solid #e5472b',
                    background: 'none',
                    color: '#e5472b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Resign
                </button>
              ) : (
                <button
                  type="button"
                  className="gcwide"
                  onClick={() => startMatch(selectedGameKey, currentOpponent)}
                >
                  Rematch
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LFG Modal (#lfPostModal) */}
      {showLfgModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              border: '1px solid var(--line)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Looking for a Player</h2>
              <button
                onClick={() => setShowLfgModal(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--hover)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="gch">Game</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 12px' }}>
              {GORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    const isPar = Boolean(GM[k].par);
                    setLfgForm((prev) => ({
                      ...prev,
                      gid: k,
                      mode: isPar ? prev.mode : '1v1',
                      need: isPar && prev.mode === 'party' ? 3 : 1,
                    }));
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: lfgForm.gid === k ? 'var(--accent)' : 'var(--panel)',
                    color: lfgForm.gid === k ? 'var(--accent-ink)' : 'var(--ink)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {GM[k].n}
                </button>
              ))}
            </div>

            <div className="gch">Mode</div>
            <div style={{ display: 'flex', gap: 8, margin: '6px 0 12px' }}>
              <button
                type="button"
                onClick={() => setLfgForm((prev) => ({ ...prev, mode: '1v1', need: 1 }))}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: lfgForm.mode === '1v1' ? 'var(--accent)' : 'var(--panel)',
                  color: lfgForm.mode === '1v1' ? 'var(--accent-ink)' : 'var(--ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                1v1
              </button>
              <button
                type="button"
                disabled={!GM[lfgForm.gid]?.par}
                onClick={() => setLfgForm((prev) => ({ ...prev, mode: 'party', need: 3 }))}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: lfgForm.mode === 'party' ? 'var(--accent)' : 'var(--panel)',
                  color: lfgForm.mode === 'party' ? 'var(--accent-ink)' : 'var(--ink)',
                  fontWeight: 600,
                  opacity: GM[lfgForm.gid]?.par ? 1 : 0.4,
                  cursor: GM[lfgForm.gid]?.par ? 'pointer' : 'not-allowed',
                }}
              >
                Party
              </button>
            </div>

            <div className="gch">Players Needed</div>
            <div className="stp" style={{ margin: '8px 0 14px' }}>
              <button
                type="button"
                className="outb"
                disabled={lfgForm.mode === '1v1' || lfgForm.need <= 2}
                onClick={() => setLfgForm((prev) => ({ ...prev, need: Math.max(2, prev.need - 1) }))}
              >
                −
              </button>
              <b>{lfgForm.need}</b>
              <button
                type="button"
                className="outb"
                disabled={lfgForm.mode === '1v1' || lfgForm.need >= 5}
                onClick={() => setLfgForm((prev) => ({ ...prev, need: Math.min(5, prev.need + 1) }))}
              >
                +
              </button>
            </div>

            <input
              className="din"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--panel)',
                color: 'var(--ink)',
                fontSize: 14,
                marginBottom: 12,
              }}
              maxLength={60}
              placeholder="Add a note (optional)"
              value={lfgForm.note}
              onChange={(e) => setLfgForm((prev) => ({ ...prev, note: e.target.value }))}
            />

            <div className="lfprev">
              <span className="lpe">🎮</span>
              <span>
                <b>{user?.displayName || 'You'} is looking for someone to play {GM[lfgForm.gid]?.n}.</b>
                <small>Status: Looking for opponent</small>
              </span>
              <i className="postb">Join Game</i>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="outb"
                onClick={() => setShowLfgModal(false)}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="postb"
                onClick={async () => {
                  try {
                    await api.createLFGPost({
                      gameKey: lfgForm.gid,
                      mode: lfgForm.mode,
                      playersNeeded: lfgForm.need,
                      note: lfgForm.note,
                    });
                    setShowLfgModal(false);
                    loadLFG();
                    setView('find');
                    playTone('pop');
                  } catch (err) {
                    console.error('Failed to post LFG:', err);
                  }
                }}
                style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
