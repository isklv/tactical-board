# Board - Interactive Tactical Board

Interactive tactical board for coaches and teams to create and share sports plays.

## Features

- **Multiple sports**: Football (soccer), Ice Hockey, Basketball
- **Interactive editor**: Drag-and-drop players, draw arrows for passes and movements
- **Real-time collaboration**: Share boards via token-based URLs
- **Export capability**: Save combinations with canvas data

## Tech Stack

- **Backend**: Go 1.21, Chi router, GORM, SQLite
- **Frontend**: React 18, TypeScript, Vite, Konva.js (canvas)

## Setup

### Prerequisites

- Go 1.21+
- Node.js 18+
- Make (optional, for convenience)

### Backend Setup

```bash
cd backend

# Install dependencies
go mod download

# Run the server
make run
# or: go run main.go
```

The backend runs on `http://localhost:8080`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The frontend runs on `http://localhost:5173` (or `http://localhost:3000` if configured)

## Usage

1. **Create a board**: Go to `/create`, select sport (football/hockey/basketball) and optional title
2. **Add combinations**: Click "+ Add Combination" on your board
3. **Draw your play**:
   - Select "Home" or "Away" to place players
   - Select "Arrow" to draw passes (click start point, click end point)
   - Drag players to reposition them
   - Use "Select" mode to move around
4. **Save and share**: Click "Save" to store the combination, use "Share" to get a link

## API Endpoints

### Boards
- `POST /api/v1/boards` - Create new board (body: `{"sport": "football", "title": "My Board"}`)
- `GET /api/v1/boards` - List all boards
- `GET /api/v1/boards/:token` - Get board by token
- `DELETE /api/v1/boards/:token` - Delete board

### Combinations
- `POST /api/v1/boards/:token/combos` - Create combination (body: `{"title": "Play 1", "content": "..."}`)
- `GET /api/v1/boards/:token/combos` - List combinations
- `DELETE /api/v1/boards/:token/combos/:comboId` - Delete combination
- `PUT /api/v1/boards/:token/combos/:comboId` - Update combination

### Canvas
- `POST /api/v1/render/canvas` - Render canvas to image (for thumbnails)

## Canvas Data Format

The `content` field in combinations stores JSON:

```json
{
  "players": [
    {"x": 525, "y": 340, "number": 10, "color": "#e94560", "label": "Messi"}
  ],
  "arrows": [
    {"points": [{"x": 525, "y": 340}, {"x": 700, "y": 200}], "color": "#fff", "width": 3, "type": "pass"}
  ]
}
```

## Development

### Backend (Chi Router)

The backend uses Chi router instead of Gin for better performance and simpler routing:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(cors.Handler(...))

r.Post("/api/v1/boards", createBoard)
r.Get("/api/v1/boards/{token}", getBoard)
```

### Frontend (Konva Canvas)

The editor uses React-Konva for high-performance canvas rendering:

- Supports zoom (scroll) and pan (drag background)
- Player selection with transformer handles
- Arrow drawing mode with temporary preview
- Sport-specific court dimensions

## Makefile Commands

```bash
make setup    # Install Go dependencies
make run      # Run backend server
make test     # Run tests
make build    # Build binary
```

## License

MIT
