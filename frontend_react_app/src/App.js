import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Tic-Tac-Toe with AI (minimax) and modern light theme styling.
 * - Accessible grid (role="grid", role="gridcell"), keyboard navigable.
 * - Optimal AI (hard) using minimax with pruning; easy mode does random+block.
 * - Controls: New Game, Reset Scores, First Player toggle, Difficulty toggle.
 * - Scores persist in session via sessionStorage.
 * - Winning line highlighted; immediate AI response after user's move.
 */

const PRIMARY = '#3b82f6';
const SECONDARY = '#64748b';
const SUCCESS = '#06b6d4';
const ERROR = '#EF4444';
const BG = '#f9fafb';
const SURFACE = '#ffffff';
const TEXT = '#111827';

// Utility: Winning lines
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

function calculateWinner(squares) {
  for (let i = 0; i < LINES.length; i++) {
    const [a, b, c] = LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function isDraw(squares) {
  return squares.every(Boolean) && !calculateWinner(squares);
}

// Minimax with alpha-beta pruning for optimal play (O is AI by default)
function minimax(board, isMaximizing, ai, human, alpha, beta) {
  const winner = calculateWinner(board);
  if (winner) {
    // Score: AI win +10, human win -10, scaled by remaining moves for faster wins
    const remaining = board.filter(v => !v).length;
    if (winner.player === ai) return 10 + remaining;
    if (winner.player === human) return -10 - remaining;
  }
  if (board.every(Boolean)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = ai;
        const score = minimax(board, false, ai, human, alpha, beta);
        board[i] = null;
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = human;
        const score = minimax(board, true, ai, human, alpha, beta);
        board[i] = null;
        best = Math.min(best, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function bestMove(board, ai = 'O', human = 'X') {
  let move = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      const score = minimax(board, false, ai, human, -Infinity, Infinity);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function easyMove(board, ai = 'O', human = 'X') {
  // 1) Immediate win if possible
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      if (calculateWinner(board)?.player === ai) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  // 2) Block human immediate win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = human;
      if (calculateWinner(board)?.player === human) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  // 3) Prefer center, then corners, then sides
  const prefs = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (const p of prefs) {
    if (!board[p]) return p;
  }
  // 4) Fallback random
  const empties = board.map((v, idx) => (v ? null : idx)).filter(v => v !== null);
  if (empties.length === 0) return -1;
  return empties[Math.floor(Math.random() * empties.length)];
}

// PUBLIC_INTERFACE
export default function App() {
  // Theme setup (respect default light theme)
  const [theme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [current, setCurrent] = useState('X'); // User is X by default
  const [aiPlays, setAiPlays] = useState('O');
  const [humanPlays, setHumanPlays] = useState('X');
  const [firstPlayer, setFirstPlayer] = useState('Human'); // or 'AI'
  const [difficulty, setDifficulty] = useState('hard'); // 'easy' | 'hard'
  const [winner, setWinner] = useState(null); // { player, line }
  const [draw, setDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });

  // Focus management for keyboard nav
  const cellsRef = useRef([]);

  // Load scores from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('ttt_scores');
      if (saved) {
        setScores(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist scores
  useEffect(() => {
    try {
      sessionStorage.setItem('ttt_scores', JSON.stringify(scores));
    } catch {
      // ignore
    }
  }, [scores]);

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner.player}`;
    if (draw) return 'Draw';
    return `Turn: ${current}`;
  }, [winner, draw, current]);

  // AI turn effect
  useEffect(() => {
    if (winner || draw) return;
    // AI moves when it's AI's turn
    if (current === aiPlays) {
      const timer = setTimeout(() => {
        const b = [...board];
        const move = difficulty === 'hard' ? bestMove(b, aiPlays, humanPlays) : easyMove(b, aiPlays, humanPlays);
        if (move >= 0 && !b[move]) {
          b[move] = aiPlays;
          const w = calculateWinner(b);
          const d = isDraw(b);
          setBoard(b);
          if (w) {
            setWinner(w);
            setScores(prev => ({ ...prev, [w.player]: prev[w.player] + 1 }));
          } else if (d) {
            setDraw(true);
            setScores(prev => ({ ...prev, Draws: prev.Draws + 1 }));
          } else {
            setCurrent(humanPlays);
          }
        }
      }, 150); // small delay for UX
      return () => clearTimeout(timer);
    }
  }, [board, current, difficulty, aiPlays, humanPlays, winner, draw]);

  // Start a new round, keep scores
  const newGame = () => {
    const nextFirst = firstPlayer;
    const human = humanPlays;
    const ai = aiPlays;
    const start = nextFirst === 'Human' ? human : ai;
    setBoard(Array(9).fill(null));
    setWinner(null);
    setDraw(false);
    setCurrent(start);
  };

  // Reset scores and board
  const resetAll = () => {
    setScores({ X: 0, O: 0, Draws: 0 });
    setBoard(Array(9).fill(null));
    setWinner(null);
    setDraw(false);
    setCurrent(firstPlayer === 'Human' ? humanPlays : aiPlays);
  };

  const toggleFirstPlayer = () => {
    const next = firstPlayer === 'Human' ? 'AI' : 'Human';
    setFirstPlayer(next);
    // Recompute who starts for new round
    const start = next === 'Human' ? humanPlays : aiPlays;
    setBoard(Array(9).fill(null));
    setWinner(null);
    setDraw(false);
    setCurrent(start);
  };

  const toggleDifficulty = () => {
    setDifficulty(prev => (prev === 'hard' ? 'easy' : 'hard'));
  };

  // PUBLIC_INTERFACE
  const handleCellClick = (idx) => {
    if (winner || draw) return;
    if (board[idx] || current !== humanPlays) return;
    const b = [...board];
    b[idx] = humanPlays;
    const w = calculateWinner(b);
    const d = isDraw(b);
    setBoard(b);
    if (w) {
      setWinner(w);
      setScores(prev => ({ ...prev, [w.player]: prev[w.player] + 1 }));
    } else if (d) {
      setDraw(true);
      setScores(prev => ({ ...prev, Draws: prev.Draws + 1 }));
    } else {
      setCurrent(aiPlays);
    }
  };

  const handleKeyDown = (e, idx) => {
    // Keyboard navigation: arrows move focus, Enter/Space to place mark
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = row * 3 + ((col + 1) % 3);
      cellsRef.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = row * 3 + ((col + 2) % 3);
      cellsRef.current[next]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = ((row + 1) % 3) * 3 + col;
      cellsRef.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = ((row + 2) % 3) * 3 + col;
      cellsRef.current[next]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(idx);
    }
  };

  // If AI should start and board is empty, trigger AI move immediately
  useEffect(() => {
    if (firstPlayer === 'AI' && board.every(v => v === null)) {
      setCurrent(aiPlays);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPlayer]);

  const isWinningCell = (idx) => {
    if (!winner?.line) return false;
    return winner.line.includes(idx);
  };

  return (
    <div className="app-root" style={styles.appRoot}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title} aria-label="Tic Tac Toe Game">
            Tic-Tac-Toe
          </h1>
          <p style={styles.subtitle}>
            Play against an intelligent AI. First to line up three wins!
          </p>
        </header>

        <section style={styles.statusBar} aria-live="polite">
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Status:</span>
            <span style={{ ...styles.statusValue, color: winner ? SUCCESS : draw ? SECONDARY : PRIMARY }}>
              {statusText}
            </span>
          </div>
          <div style={styles.scoreRow} aria-label="Scores">
            <span style={{ ...styles.badge, background: '#e0ecff', color: PRIMARY }}>X: {scores.X}</span>
            <span style={{ ...styles.badge, background: '#dff6f6', color: SUCCESS }}>O: {scores.O}</span>
            <span style={{ ...styles.badge, background: '#f3f4f6', color: SECONDARY }}>Draws: {scores.Draws}</span>
          </div>
        </section>

        <section
          role="grid"
          aria-label="Tic Tac Toe Board"
          aria-describedby="board-help"
          style={styles.board}
        >
          {board.map((val, idx) => {
            const isDisabled = Boolean(val) || Boolean(winner) || Boolean(draw) || current !== humanPlays;
            return (
              <button
                key={idx}
                ref={el => (cellsRef.current[idx] = el)}
                role="gridcell"
                aria-label={`Cell ${idx + 1}, ${val ? val : 'empty'}`}
                aria-disabled={isDisabled}
                onClick={() => handleCellClick(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                style={{
                  ...styles.cell,
                  borderColor: isWinningCell(idx) ? SUCCESS : '#e5e7eb',
                  boxShadow: isWinningCell(idx) ? `inset 0 0 0 2px ${SUCCESS}` : 'none',
                  color: val === 'X' ? PRIMARY : val === 'O' ? SECONDARY : TEXT,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
                disabled={isDisabled}
              >
                <span style={styles.cellValue}>
                  {val || ''}
                </span>
              </button>
            );
          })}
        </section>
        <p id="board-help" style={styles.helpText}>
          Use arrow keys to move between cells. Press Enter or Space to place your mark.
        </p>

        <section style={styles.controls}>
          <div style={styles.toggleRow}>
            <button
              onClick={toggleFirstPlayer}
              style={styles.button}
              aria-label="Toggle who plays first"
              title="Toggle who plays first"
            >
              First: {firstPlayer}
            </button>
            <button
              onClick={toggleDifficulty}
              style={styles.button}
              aria-label="Toggle difficulty"
              title="Toggle difficulty"
            >
              Difficulty: {difficulty === 'hard' ? 'Hard (Optimal)' : 'Easy'}
            </button>
          </div>
          <div style={styles.actionRow}>
            <button onClick={newGame} style={{ ...styles.button, background: PRIMARY, color: '#fff' }} aria-label="Start a new game">
              New Game
            </button>
            <button onClick={resetAll} style={{ ...styles.button, background: ERROR, color: '#fff' }} aria-label="Reset scores and board">
              Reset
            </button>
          </div>
          <div style={styles.legend}>
            <span style={styles.legendItem}><b>You:</b> {humanPlays}</span>
            <span style={styles.legendItem}><b>AI:</b> {aiPlays}</span>
          </div>
        </section>

        <footer style={styles.footer}>
          <small style={{ color: SECONDARY }}>
            Theme: Light · No external services used
          </small>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  appRoot: {
    minHeight: '100vh',
    background: BG,
    color: TEXT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 640,
    background: SURFACE,
    borderRadius: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    padding: 24,
    border: '1px solid #e5e7eb',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: TEXT,
  },
  subtitle: {
    marginTop: 6,
    color: SECONDARY,
    fontSize: 14,
  },
  statusBar: {
    marginTop: 8,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    color: SECONDARY,
    fontWeight: 600,
  },
  statusValue: {
    fontWeight: 700,
  },
  scoreRow: {
    display: 'flex',
    gap: 8,
  },
  badge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 12,
  },
  board: {
    marginTop: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    width: '100%',
  },
  cell: {
    aspectRatio: '1 / 1',
    borderRadius: 12,
    border: '2px solid #e5e7eb',
    background: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    fontWeight: 800,
    transition: 'transform .06s ease, background .15s ease, box-shadow .15s ease',
    outline: 'none',
  },
  cellValue: {
    transform: 'translateY(-2px)',
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: SECONDARY,
    textAlign: 'center',
  },
  controls: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  toggleRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    background: '#eef2ff',
    color: PRIMARY,
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform .06s ease, background .15s ease, box-shadow .15s ease',
  },
  legend: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    color: SECONDARY,
    marginTop: 2,
    fontSize: 13,
  },
  legendItem: {
    padding: '2px 6px',
    background: '#f3f4f6',
    borderRadius: 6,
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
  },
};
