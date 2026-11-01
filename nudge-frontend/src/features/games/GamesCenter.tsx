import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { wsClient } from '../../services/websocket.js';
import { api } from '../../services/api.js';
import { Gamepad2, RotateCcw, X, Award, Sparkles } from 'lucide-react';

interface GamesCenterProps {
  onClose?: () => void;
  conversationId?: string;
}

export const GamesCenter: React.FC<GamesCenterProps> = ({ onClose, conversationId }) => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<'tictactoe' | 'wordguess'>('tictactoe');

  // Tic-Tac-Toe state
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Word Guess state
  const [wordGuesses, setWordGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [targetWord] = useState('NUDGE');
  const [wordStatus, setWordStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  // Initialize or listen to game sessions
  useEffect(() => {
    // Create or load session
    api.createGameSession(selectedGame, conversationId)
      .then((res) => {
        setSessionId(res.session.id);
        if (res.session.state?.board) {
          setBoard(res.session.state.board);
          setTurn(res.session.state.turn || 'X');
        }
      })
      .catch((err) => console.error('Failed to init game session:', err));

    const unsub = wsClient.on('game.state', (data: any) => {
      if (data.state?.board) {
        setBoard(data.state.board);
        setTurn(data.state.turn || 'X');
      }
      if (data.winnerId) {
        setWinner(data.winnerId === user?.id ? 'You' : 'Opponent');
      } else if (data.status === 'completed') {
        setWinner('Draw');
      }
    });

    return () => unsub();
  }, [selectedGame, conversationId]);

  // Tic-Tac-Toe move
  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    // Check winning conditions
    const winningLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    let foundWinner: string | null = null;
    for (const [a, b, c] of winningLines) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        foundWinner = newBoard[a] === 'X' ? 'You' : 'Opponent';
        break;
      }
    }

    if (foundWinner) {
      setWinner(foundWinner);
    } else if (newBoard.every((cell) => cell !== null)) {
      setWinner('Draw');
    }

    const nextTurn = turn === 'X' ? 'O' : 'X';
    setTurn(nextTurn);

    // Sync over WebSocket if session exists
    if (sessionId) {
      wsClient.send({
        t: 'game.move',
        d: {
          sessionId,
          move: { index, symbol: turn },
        },
      });
    }
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    if (sessionId) {
      wsClient.send({
        t: 'game.move',
        d: {
          sessionId,
          move: { board: Array(9).fill(null), turn: 'X' },
        },
      });
    }
  };

  // Word Guess submit
  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGuess.length !== 5 || wordStatus !== 'playing') return;

    const guessUpper = currentGuess.toUpperCase();
    const newGuesses = [...wordGuesses, guessUpper];
    setWordGuesses(newGuesses);
    setCurrentGuess('');

    if (guessUpper === targetWord) {
      setWordStatus('won');
    } else if (newGuesses.length >= 6) {
      setWordStatus('lost');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--panel)',
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(235, 193, 94, 0.15)',
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

      {/* Game Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setSelectedGame('tictactoe')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 10,
            backgroundColor: selectedGame === 'tictactoe' ? 'var(--accent)' : 'var(--hover)',
            color: selectedGame === 'tictactoe' ? '#fff' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            transition: 'background-color 0.15s ease',
          }}
        >
          Tic-Tac-Toe
        </button>
        <button
          onClick={() => setSelectedGame('wordguess')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 10,
            backgroundColor: selectedGame === 'wordguess' ? 'var(--accent)' : 'var(--hover)',
            color: selectedGame === 'wordguess' ? '#fff' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            transition: 'background-color 0.15s ease',
          }}
        >
          Word Guess
        </button>
      </div>

      {/* Game Arena */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--side)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid var(--line)',
        }}
      >
        {selectedGame === 'tictactoe' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Turn & Status info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {winner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
                  <Award size={20} />
                  <span>{winner === 'Draw' ? "It's a Draw!" : `${winner} Won! 🎉`}</span>
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  Current Turn: <b style={{ color: 'var(--accent)' }}>{turn}</b>
                </div>
              )}
            </div>

            {/* 3x3 Board */}
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
                  onClick={() => handleCellClick(idx)}
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
                    transition: 'transform 0.1s, background-color 0.15s',
                  }}
                >
                  {cell}
                </button>
              ))}
            </div>

            {/* Rematch Button */}
            <button
              onClick={resetTicTacToe}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 20,
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                marginTop: 8,
              }}
            >
              <RotateCcw size={15} />
              <span>Rematch</span>
            </button>
          </div>
        ) : (
          /* Word Guess */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
              Guess the 5-letter word ({6 - wordGuesses.length} tries left)
            </div>

            {/* Word Grid */}
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

            {/* Input Form */}
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
