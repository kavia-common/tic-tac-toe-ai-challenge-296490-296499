# Tic-Tac-Toe React SPA with AI

A lightweight React single-page app to play Tic-Tac-Toe against an AI opponent.

## How to Play

- You play as X by default. The AI plays as O.
- Click a square (or focus a square with arrow keys and press Enter/Space) to place your mark.
- The first to align three marks horizontally, vertically, or diagonally wins.
- The current status appears above the board. Winning lines are highlighted.

## Controls

- New Game: Starts a new round while keeping scores.
- Reset: Resets scores and clears the board.
- First: Toggle who starts first (Human or AI).
- Difficulty: Toggle between Easy (random + block + simple priorities) and Hard (optimal using minimax with alpha-beta pruning).

## Accessibility

- The board uses role="grid" and cells use role="gridcell".
- Full keyboard navigation with arrow keys and Enter/Space.
- Clear focus outlines and ARIA labels.

## Tech/Notes

- Pure React and CSS, no additional dependencies.
- Scores persist for the session via sessionStorage.
- Theme: modern light palette using:
  - Primary #3b82f6, Secondary #64748b, Success #06b6d4, Error #EF4444,
  - Background #f9fafb, Surface #ffffff, Text #111827.

Run locally:
- `npm start` then open http://localhost:3000
- `npm test` for tests
- `npm run build` for production build
