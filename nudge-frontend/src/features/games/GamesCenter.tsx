import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { wsClient } from '../../services/websocket.js';
import { api } from '../../services/api.js';
import { Gamepad2, RotateCcw, X, Award, Sparkles, ChevronDown, Users, Flame, Shield, Trophy } from 'lucide-react';

interface GamesCenterProps {
  onClose?: () => void;
  conversationId?: string;
  isEmbedded?: boolean;
  initialOpponent?: OpponentProfile;
}

interface OpponentProfile {
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

export const GamesCenter: React.FC<GamesCenterProps> = ({ onClose, conversationId, isEmbedded = false, initialOpponent }) => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<'tictactoe' | 'c4' | 'rps' | 'wordguess'>('tictactoe');

  // Opponent management
  const [availableOpponents, setAvailableOpponents] = useState<OpponentProfile[]>(DEFAULT_BOTS);
  const [currentOpponent, setCurrentOpponent] = useState<OpponentProfile>(initialOpponent || DEFAULT_BOTS[0]);
  const [showOpponentPicker, setShowOpponentPicker] = useState(false);
  const [opponentBanter, setOpponentBanter] = useState<string>('Ready for a duel? Make your move!');

  // Match statistics (W / L / D against current opponent)
  const [scores, setScores] = useState<Record<string, { w: number; l: number; d: number }>>({});

  // Tic-Tac-Toe state
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Connect 4 state
  const [c4Board, setC4Board] = useState<(string | null)[]>(Array(42).fill(null)); // 7 cols x 6 rows
  const [c4Turn, setC4Turn] = useState<'red' | 'yellow'>('red');
  const [c4Winner, setC4Winner] = useState<string | null>(null);

  // Rock Paper Scissors state
  const [rpsRounds, setRpsRounds] = useState<{ user: string; opp: string; winner: string }[]>([]);
  const [rpsStatus, setRpsStatus] = useState<string | null>(null);

  // Word Guess state
  const [wordGuesses, setWordGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [targetWord] = useState('NUDGE');
  const [wordStatus, setWordStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  // Load opponents from server
  useEffect(() => {
    api.searchUsers('')
      .then((res) => {
        if (res.users && res.users.length > 0) {
          const bots = res.users.filter((u: any) => u.isBot || u.id !== user?.id);
          if (bots.length > 0) {
            setAvailableOpponents(bots);
            // Default to first bot or tola
            const tola = bots.find((b: any) => b.username === 'tola') || bots[0];
            setCurrentOpponent(tola);
          }
        }
      })
      .catch(() => {});
  }, [user]);

  // Load or create game session when selectedGame or currentOpponent changes
  useEffect(() => {
    setBoard(Array(9).fill(null));
    setC4Board(Array(42).fill(null));
    setRpsRounds([]);
    setRpsStatus(null);
    setTurn('X');
    setC4Turn('red');
    setWinner(null);
    setC4Winner(null);
    setIsBotThinking(false);

    // Initial greeting banter based on persona
    const greetings: Record<string, string> = {
      tola: "Let's see if your skills match your mouth! Game on ⚽🎮",
      mum: "Come and play with your mother, my dear! Remember to sit up straight ❤️",
      chidi: "Minimax decision tree loaded. Let's see your move logic 💻",
      amaka: "Quick study break match! Let's make it count 📚",
      seyi: "Big bro always wins. Ready to get schooled? 😂",
      jide: "Focus and reflexes! Lock in 🏋️‍♂️",
      dami: "Let's reboot the creative juices with a duel! ✨",
    };
    setOpponentBanter(greetings[currentOpponent.username.toLowerCase()] || `Ready to duel! Make your move.`);

    // Initialize session with backend
    const backendKey = selectedGame === 'c4' ? 'connect4' : selectedGame;
    api.createGameSession(backendKey, conversationId, currentOpponent.id)
      .then((res) => {
        setSessionId(res.session.id);
        if (res.session.state?.board) {
          setBoard(res.session.state.board);
          setTurn(res.session.state.turn || 'X');
        }
      })
      .catch((err) => console.error('Failed to init game session:', err));

    const unsub = wsClient.on('game.state', (data: any) => {
      if (data.state?.board && selectedGame === 'tictactoe') {
        setBoard(data.state.board);
        setTurn(data.state.turn || 'X');
        setIsBotThinking(false);
      }
      if (data.winnerId) {
        const isUser = data.winnerId === user?.id;
        setWinner(isUser ? 'You' : currentOpponent.displayName);
        recordResult(isUser ? 'w' : 'l');
        handleGameEndBanter(isUser ? 'loss' : 'win');
      } else if (data.status === 'completed') {
        setWinner('Draw');
        recordResult('d');
        handleGameEndBanter('draw');
      }
    });

    return () => unsub();
  }, [selectedGame, currentOpponent, conversationId, user]);

  const recordResult = (res: 'w' | 'l' | 'd') => {
    setScores((prev) => {
      const oppKey = currentOpponent.username.toLowerCase();
      const cur = prev[oppKey] || { w: 0, l: 0, d: 0 };
      return {
        ...prev,
        [oppKey]: {
          w: cur.w + (res === 'w' ? 1 : 0),
          l: cur.l + (res === 'l' ? 1 : 0),
          d: cur.d + (res === 'd' ? 1 : 0),
        },
      };
    });
  };

  const handleGameEndBanter = (botOutcome: 'win' | 'loss' | 'draw') => {
    const un = currentOpponent.username.toLowerCase();
    if (un === 'tola') {
      if (botOutcome === 'win') setOpponentBanter("Hahaha 3-0!! I told you I've been training! Rematch? 🎮😎");
      else if (botOutcome === 'loss') setOpponentBanter("Ah no way! Lucky diagonal bro, that doesn't count! Rematch right now 😂");
      else setOpponentBanter("A draw! We are evenly matched bro. One more round to break the tie? 🤝");
    } else if (un === 'mum') {
      if (botOutcome === 'win') setOpponentBanter("Haha! Never underestimate your mother! Now go and drink water and eat some food ❤️");
      else if (botOutcome === 'loss') setOpponentBanter("Very sharp, Dayo! You have always been clever. I'm proud of you 😊");
      else setOpponentBanter("A draw! We are both smart in this family. God bless you my dear!");
    } else if (un === 'chidi') {
      if (botOutcome === 'win') setOpponentBanter("Minimax depth 3 evaluated the win. Clean placement 💻");
      else if (botOutcome === 'loss') setOpponentBanter("Unhandled edge case! Impressive move, merge that win 🚀");
      else setOpponentBanter("Deadlock detected. Zero memory leaks though. Well played 🤝");
    } else {
      if (botOutcome === 'win') setOpponentBanter(`Good game! That was close! Ready for a rematch?`);
      else if (botOutcome === 'loss') setOpponentBanter(`Well played!! You got me this time 👏`);
      else setOpponentBanter(`Evenly matched! Let's run it back 🤝`);
    }
  };

  // --- TIC TAC TOE LOGIC ---
  const handleTicTacToeClick = (index: number) => {
    if (board[index] || winner || turn !== 'X') return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    // Check human win
    const winningLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    let foundWinner: string | null = null;
    for (const [a, b, c] of winningLines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        foundWinner = 'You';
        break;
      }
    }

    if (foundWinner) {
      setWinner('You');
      recordResult('w');
      handleGameEndBanter('loss');
      if (sessionId) {
        api.makeGameMove(sessionId, { index, symbol: 'X' }).catch(() => {});
      }
      return;
    }

    if (newBoard.every((cell) => cell !== null)) {
      setWinner('Draw');
      recordResult('d');
      handleGameEndBanter('draw');
      if (sessionId) {
        api.makeGameMove(sessionId, { index, symbol: 'X' }).catch(() => {});
      }
      return;
    }

    setTurn('O');
    setIsBotThinking(true);
    setOpponentBanter(`${currentOpponent.displayName} is calculating their counter-move...`);

    // Sync human move to backend to trigger AI move
    if (sessionId) {
      api.makeGameMove(sessionId, { index, symbol: 'X' }).catch(() => {});
    }

    // Local simulated AI move if backend delay or standalone mode
    setTimeout(() => {
      // Find empty slots
      const emptySlots: number[] = [];
      newBoard.forEach((val, idx) => {
        if (!val) emptySlots.push(idx);
      });

      if (emptySlots.length > 0 && !winner) {
        // AI: try to win or block
        let aiPick = -1;
        // Try win
        for (const idx of emptySlots) {
          const test = [...newBoard];
          test[idx] = 'O';
          if (winningLines.some(([a, b, c]) => test[a] === 'O' && test[b] === 'O' && test[c] === 'O')) {
            aiPick = idx;
            break;
          }
        }
        // Try block
        if (aiPick < 0) {
          for (const idx of emptySlots) {
            const test = [...newBoard];
            test[idx] = 'X';
            if (winningLines.some(([a, b, c]) => test[a] === 'X' && test[b] === 'X' && test[c] === 'X')) {
              aiPick = idx;
              break;
            }
          }
        }
        // Center
        if (aiPick < 0 && !newBoard[4]) aiPick = 4;
        // Random
        if (aiPick < 0) {
          aiPick = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        }

        newBoard[aiPick] = 'O';
        setBoard(newBoard);
        setIsBotThinking(false);

        // Check bot win
        if (winningLines.some(([a, b, c]) => newBoard[a] === 'O' && newBoard[b] === 'O' && newBoard[c] === 'O')) {
          setWinner(currentOpponent.displayName);
          recordResult('l');
          handleGameEndBanter('win');
        } else if (newBoard.every((cell) => cell !== null)) {
          setWinner('Draw');
          recordResult('d');
          handleGameEndBanter('draw');
        } else {
          setTurn('X');
          setOpponentBanter(`Placed at ${['top-left', 'top', 'top-right', 'mid-left', 'center', 'mid-right', 'bot-left', 'bottom', 'bot-right'][aiPick]}! Your turn.`);
        }
      }
    }, 750);
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    setIsBotThinking(false);
    setOpponentBanter(`Fresh board! Let's go again.`);
    if (sessionId) {
      api.createGameSession('tictactoe', conversationId, currentOpponent.id)
        .then((res) => setSessionId(res.session.id))
        .catch(() => {});
    }
  };

  // --- CONNECT 4 LOGIC ---
  const handleC4ColumnClick = (col: number) => {
    if (c4Winner || c4Turn !== 'red') return;

    // Find lowest empty slot in this column (from bottom row 5 to 0)
    let dropRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (!c4Board[r * 7 + col]) {
        dropRow = r;
        break;
      }
    }
    if (dropRow < 0) return; // column full

    const newBoard = [...c4Board];
    const placedIndex = dropRow * 7 + col;
    newBoard[placedIndex] = 'red';
    setC4Board(newBoard);

    // Check win for red
    if (checkC4Win(newBoard, 'red')) {
      setC4Winner('You');
      recordResult('w');
      handleGameEndBanter('loss');
      return;
    }

    if (newBoard.every((c) => c !== null)) {
      setC4Winner('Draw');
      recordResult('d');
      handleGameEndBanter('draw');
      return;
    }

    setC4Turn('yellow');
    setIsBotThinking(true);
    setOpponentBanter(`${currentOpponent.displayName} is calculating column drops...`);

    // Bot move
    setTimeout(() => {
      // Find valid columns
      const validCols: number[] = [];
      for (let c = 0; c < 7; c++) {
        if (!newBoard[c]) validCols.push(c);
      }

      if (validCols.length > 0 && !c4Winner) {
        const botCol = validCols[Math.floor(Math.random() * validCols.length)];
        let botRow = -1;
        for (let r = 5; r >= 0; r--) {
          if (!newBoard[r * 7 + botCol]) {
            botRow = r;
            break;
          }
        }

        if (botRow >= 0) {
          newBoard[botRow * 7 + botCol] = 'yellow';
          setC4Board(newBoard);
          setIsBotThinking(false);

          if (checkC4Win(newBoard, 'yellow')) {
            setC4Winner(currentOpponent.displayName);
            recordResult('l');
            handleGameEndBanter('win');
          } else if (newBoard.every((c) => c !== null)) {
            setC4Winner('Draw');
            recordResult('d');
            handleGameEndBanter('draw');
          } else {
            setC4Turn('red');
            setOpponentBanter(`Dropped in column ${botCol + 1}! Your turn.`);
          }
        }
      }
    }, 750);
  };

  const checkC4Win = (b: (string | null)[], symbol: string): boolean => {
    // Horizontal
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 7 + c;
        if (b[i] === symbol && b[i + 1] === symbol && b[i + 2] === symbol && b[i + 3] === symbol) return true;
      }
    }
    // Vertical
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        if (b[i] === symbol && b[i + 7] === symbol && b[i + 14] === symbol && b[i + 21] === symbol) return true;
      }
    }
    // Diagonal down-right
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 7 + c;
        if (b[i] === symbol && b[i + 8] === symbol && b[i + 16] === symbol && b[i + 24] === symbol) return true;
      }
    }
    // Diagonal up-right
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 7 + c;
        if (b[i] === symbol && b[i - 6] === symbol && b[i - 12] === symbol && b[i - 18] === symbol) return true;
      }
    }
    return false;
  };

  // --- ROCK PAPER SCISSORS LOGIC ---
  const handleRpsPick = (choice: 'rock' | 'paper' | 'scissors') => {
    if (rpsStatus) return;

    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
    const oppChoice = choices[Math.floor(Math.random() * choices.length)];

    let res = 'draw';
    if (
      (choice === 'rock' && oppChoice === 'scissors') ||
      (choice === 'paper' && oppChoice === 'rock') ||
      (choice === 'scissors' && oppChoice === 'paper')
    ) {
      res = 'user';
    } else if (choice !== oppChoice) {
      res = 'opponent';
    }

    const updated = [...rpsRounds, { user: choice, opp: oppChoice, winner: res }];
    setRpsRounds(updated);

    const userW = updated.filter((r) => r.winner === 'user').length;
    const oppW = updated.filter((r) => r.winner === 'opponent').length;

    if (userW >= 2) {
      setRpsStatus('You won the match! 🎉');
      recordResult('w');
      handleGameEndBanter('loss');
    } else if (oppW >= 2) {
      setRpsStatus(`${currentOpponent.displayName} won the match!`);
      recordResult('l');
      handleGameEndBanter('win');
    } else {
      setOpponentBanter(
        res === 'user'
          ? `You took round ${updated.length}! ${choice.toUpperCase()} beats ${oppChoice.toUpperCase()}`
          : res === 'opponent'
          ? `I took round ${updated.length}! ${oppChoice.toUpperCase()} beats ${choice.toUpperCase()}`
          : `Tie round! Both chose ${choice.toUpperCase()}`
      );
    }
  };

  // --- WORD GUESS LOGIC ---
  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGuess.length !== 5 || wordStatus !== 'playing') return;

    const guessUpper = currentGuess.toUpperCase();
    const newGuesses = [...wordGuesses, guessUpper];
    setWordGuesses(newGuesses);
    setCurrentGuess('');

    if (guessUpper === targetWord) {
      setWordStatus('won');
      recordResult('w');
      handleGameEndBanter('loss');
    } else if (newGuesses.length >= 6) {
      setWordStatus('lost');
      recordResult('l');
      handleGameEndBanter('win');
    }
  };

  const oppStats = scores[currentOpponent.username.toLowerCase()] || { w: 0, l: 0, d: 0 };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--panel)',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: 'rgba(235, 193, 94, 0.16)',
              color: 'var(--gold)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Gamepad2 size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Play & Games</h3>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Turn-based duels with friends</span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Opponent Card & Selector */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 14,
          backgroundColor: 'var(--side)',
          border: '1px solid var(--line)',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar with live dot */}
          <div style={{ position: 'relative' }}>
            {currentOpponent.avatarUrl ? (
              <img
                src={currentOpponent.avatarUrl}
                alt={currentOpponent.displayName}
                style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {currentOpponent.displayName[0]}
              </div>
            )}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 11,
                height: 11,
                borderRadius: '50%',
                backgroundColor: 'var(--ok)',
                border: '2px solid var(--side)',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                Opponent
              </span>
              <span style={{ fontSize: 11, backgroundColor: 'rgba(37, 160, 108, 0.15)', color: 'var(--ok)', padding: '1px 6px', borderRadius: 6, fontWeight: 600 }}>
                Online
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <b style={{ fontSize: 15, color: 'var(--ink)' }}>{currentOpponent.displayName}</b>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                ({currentOpponent.botPersona?.relationship || currentOpponent.bio?.slice(0, 24) || 'Bot'})
              </span>
            </div>
          </div>
        </div>

        {/* Change Opponent Button */}
        <button
          onClick={() => setShowOpponentPicker(!showOpponentPicker)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 20,
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink)',
            cursor: 'pointer',
          }}
        >
          <span>Change</span>
          <ChevronDown size={14} />
        </button>

        {/* Dropdown Opponent Picker */}
        {showOpponentPicker && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 14,
              marginTop: 6,
              zIndex: 30,
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
              padding: 8,
              minWidth: 260,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', padding: '4px 8px 8px', textTransform: 'uppercase' }}>
              Choose Opponent
            </div>
            {availableOpponents.map((bot) => (
              <button
                key={bot.id || bot.username}
                onClick={() => {
                  setCurrentOpponent(bot);
                  setShowOpponentPicker(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  backgroundColor: currentOpponent.username === bot.username ? 'var(--hover)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {bot.displayName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{bot.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {bot.botPersona?.relationship || bot.bio || 'Player'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Head-to-Head Record Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: 'var(--hover)',
          borderRadius: 10,
          padding: '6px 12px',
          marginBottom: 14,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
        }}
      >
        <span>
          You: <b style={{ color: 'var(--ok)' }}>{oppStats.w}W</b>
        </span>
        <span>•</span>
        <span>
          {currentOpponent.displayName}: <b style={{ color: 'var(--vanish)' }}>{oppStats.l}W</b>
        </span>
        <span>•</span>
        <span>
          Draws: <b style={{ color: 'var(--ink)' }}>{oppStats.d}</b>
        </span>
      </div>

      {/* Game Selector Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {[
          { key: 'tictactoe', label: 'Tic-Tac-Toe' },
          { key: 'c4', label: 'Connect 4' },
          { key: 'rps', label: 'Rock Paper Scissors' },
          { key: 'wordguess', label: 'Word Guess' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedGame(tab.key as any)}
            style={{
              flex: 1,
              whiteSpace: 'nowrap',
              padding: '7px 10px',
              borderRadius: 10,
              backgroundColor: selectedGame === tab.key ? 'var(--accent)' : 'var(--hover)',
              color: selectedGame === tab.key ? '#fff' : 'var(--ink)',
              fontWeight: 600,
              fontSize: 12.5,
              transition: 'background-color 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Opponent In-Game Banter Bubble */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 12,
          backgroundColor: 'var(--panel)',
          border: '1px dashed var(--line)',
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 18 }}>💬</span>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.35 }}>
          <b>{currentOpponent.displayName}:</b> "{opponentBanter}"
        </div>
      </div>

      {/* Game Arena Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--side)',
          borderRadius: 16,
          padding: 18,
          border: '1px solid var(--line)',
          minHeight: 320,
        }}
      >
        {/* 1. TIC TAC TOE */}
        {selectedGame === 'tictactoe' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Status & Turn */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {winner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
                  <Award size={20} />
                  <span>{winner === 'Draw' ? "It's a Draw!" : `${winner} Won! 🎉`}</span>
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  {turn === 'X' ? (
                    <span>👉 Your turn (<b style={{ color: 'var(--accent)' }}>X</b>)</span>
                  ) : (
                    <span>
                      ⏳ {currentOpponent.displayName} is thinking... (<b style={{ color: 'var(--gold)' }}>O</b>)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Board */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 76px)',
                gridTemplateRows: 'repeat(3, 76px)',
                gap: 8,
              }}
            >
              {board.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTicTacToeClick(idx)}
                  disabled={!!cell || !!winner || turn !== 'X'}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 12,
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--line)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 32,
                    fontWeight: 700,
                    color: cell === 'X' ? 'var(--accent)' : cell === 'O' ? 'var(--gold)' : 'transparent',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    cursor: !cell && !winner && turn === 'X' ? 'pointer' : 'default',
                    transition: 'transform 0.1s, background-color 0.15s',
                  }}
                >
                  {cell}
                </button>
              ))}
            </div>

            {/* Rematch */}
            <button
              onClick={resetTicTacToe}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 20,
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>Rematch</span>
            </button>
          </div>
        )}

        {/* 2. CONNECT 4 */}
        {selectedGame === 'c4' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {c4Winner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
                  <Award size={20} />
                  <span>{c4Winner === 'Draw' ? "It's a Draw!" : `${c4Winner} Won Connect 4! 🎉`}</span>
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  {c4Turn === 'red' ? (
                    <span>👉 Your turn (🔴 Red)</span>
                  ) : (
                    <span>⏳ {currentOpponent.displayName} is dropping a disc... (🟡 Yellow)</span>
                  )}
                </div>
              )}
            </div>

            {/* Column Drop Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: 5 }}>
              {Array.from({ length: 7 }).map((_, c) => (
                <button
                  key={c}
                  onClick={() => handleC4ColumnClick(c)}
                  disabled={!!c4Winner || c4Turn !== 'red' || !!c4Board[c]}
                  style={{
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: 'var(--hover)',
                    border: '1px solid var(--line)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    cursor: !c4Winner && c4Turn === 'red' && !c4Board[c] ? 'pointer' : 'default',
                  }}
                >
                  ↓
                </button>
              ))}
            </div>

            {/* 7x6 Board */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 36px)',
                gridTemplateRows: 'repeat(6, 36px)',
                gap: 5,
                backgroundColor: 'rgba(15, 107, 88, 0.25)',
                padding: 8,
                borderRadius: 14,
                border: '1px solid var(--line)',
              }}
            >
              {c4Board.map((disc, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: disc === 'red' ? '#DF4B2F' : disc === 'yellow' ? '#EBC15E' : 'var(--panel)',
                    boxShadow: disc ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'none',
                    border: '1px solid var(--line)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => {
                setC4Board(Array(42).fill(null));
                setC4Turn('red');
                setC4Winner(null);
                setOpponentBanter("New Connect 4 board! Drop your first disc.");
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 20,
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>Reset Game</span>
            </button>
          </div>
        )}

        {/* 3. ROCK PAPER SCISSORS */}
        {selectedGame === 'rps' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>
              Best of 3 Duel vs {currentOpponent.displayName}
            </div>

            {/* Score tally */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ink)',
              }}
            >
              <span>You: <b style={{ color: 'var(--ok)' }}>{rpsRounds.filter((r) => r.winner === 'user').length}</b></span>
              <span>•</span>
              <span>{currentOpponent.displayName}: <b style={{ color: 'var(--vanish)' }}>{rpsRounds.filter((r) => r.winner === 'opponent').length}</b></span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {[
                { key: 'rock', emoji: '✊', label: 'Rock' },
                { key: 'paper', emoji: '✋', label: 'Paper' },
                { key: 'scissors', emoji: '✌️', label: 'Scissors' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleRpsPick(item.key as any)}
                  disabled={!!rpsStatus}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 14,
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--line)',
                    cursor: !rpsStatus ? 'pointer' : 'default',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  }}
                >
                  <span style={{ fontSize: 30 }}>{item.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Round History */}
            {rpsRounds.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rpsRounds.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 12px',
                      borderRadius: 8,
                      backgroundColor: 'var(--panel)',
                      fontSize: 13,
                    }}
                  >
                    <span>Round {i + 1}: You ({r.user}) vs {currentOpponent.displayName} ({r.opp})</span>
                    <b style={{ color: r.winner === 'user' ? 'var(--ok)' : r.winner === 'opponent' ? 'var(--vanish)' : 'var(--muted)' }}>
                      {r.winner === 'user' ? 'You Won' : r.winner === 'opponent' ? 'They Won' : 'Draw'}
                    </b>
                  </div>
                ))}
              </div>
            )}

            {rpsStatus && (
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>
                {rpsStatus}
              </div>
            )}

            <button
              onClick={() => {
                setRpsRounds([]);
                setRpsStatus(null);
                setOpponentBanter("Rock, paper, scissors — shoot!");
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 20,
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>New Match</span>
            </button>
          </div>
        )}

        {/* 4. WORD GUESS */}
        {selectedGame === 'wordguess' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
              Guess the 5-letter word ({6 - wordGuesses.length} tries left)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: 6 }).map((_, rowIdx) => {
                const guess = wordGuesses[rowIdx] || (rowIdx === wordGuesses.length ? currentGuess.padEnd(5, ' ') : '     ');

                return (
                  <div key={rowIdx} style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: 5 }).map((_, colIdx) => {
                      const letter = guess[colIdx] || '';
                      const isSubmitted = rowIdx < wordGuesses.length;
                      let bg = 'var(--panel)';
                      let color = 'var(--ink)';

                      if (isSubmitted) {
                        if (targetWord[colIdx] === letter) {
                          bg = 'var(--ok)';
                          color = '#fff';
                        } else if (targetWord.includes(letter)) {
                          bg = 'var(--gold)';
                          color = '#fff';
                        } else {
                          bg = 'var(--muted)';
                          color = '#fff';
                        }
                      }

                      return (
                        <div
                          key={colIdx}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            backgroundColor: bg,
                            border: isSubmitted ? 'none' : '1px solid var(--line)',
                            color,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 18,
                            fontWeight: 700,
                          }}
                        >
                          {letter.trim()}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {wordStatus === 'playing' ? (
              <form onSubmit={handleWordSubmit} style={{ display: 'flex', gap: 8, width: '100%' }}>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="5 letters"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--line)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: 15,
                    textAlign: 'center',
                    letterSpacing: 2,
                    color: 'var(--ink)',
                  }}
                />
                <button
                  type="submit"
                  disabled={currentGuess.length !== 5}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    backgroundColor: currentGuess.length === 5 ? 'var(--accent)' : 'var(--hover)',
                    color: currentGuess.length === 5 ? '#fff' : 'var(--muted)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: currentGuess.length === 5 ? 'pointer' : 'default',
                  }}
                >
                  Guess
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', color: wordStatus === 'won' ? 'var(--ok)' : 'var(--vanish)', fontWeight: 700, fontSize: 15 }}>
                {wordStatus === 'won' ? '🎉 Brilliant! You cracked it!' : `Game Over! The word was ${targetWord}.`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
