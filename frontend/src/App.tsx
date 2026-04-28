import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import './index.css'

interface Board {
  id: string
  token: string
  sport: 'football' | 'hockey' | 'basketball'
  title: string
  combinations: Combination[]
}

interface Combination {
  id: string
  title: string
  content: string
}

function Dashboard() {
  const [boards, setBoards] = React.useState<Board[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Placeholder - will implement real API calls
    fetch('/api/v1/boards')
      .then(res => res.json())
      .then(data => {
        setBoards(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <h1>Tactical Boards</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Create and share tactical combinations with your team</p>
      
      <Link to="/create" className="btn btn-primary">
        + Create New Board
      </Link>
      
      {loading ? (
        <p>Loading...</p>
      ) : boards.length === 0 ? (
        <p style={{ color: '#666', marginTop: '2rem' }}>No boards yet. Create your first one!</p>
      ) : (
        <div className="grid">
          {boards.map(board => (
            <Link to={`/board/${board.token}`} key={board.id} className="card">
              <div className="card-title">{board.title || 'Untitled Board'}</div>
              <div className="card-meta">
                {board.sport} • {board.combinations.length} combinations
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateBoard() {
  const [sport, setSport] = React.useState('football')
  const [title, setTitle] = React.useState('')
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, title }),
      })
      if (!res.ok) throw new Error('Failed to create board')
      const data = await res.json()
      window.location.href = `/board/${data.token}`
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <h1>Create New Board</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sport</label>
          <select 
            className="input" 
            value={sport} 
            onChange={e => setSport(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="football">Football (Soccer)</option>
            <option value="hockey">Ice Hockey</option>
            <option value="basketball">Basketball</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title (optional)</label>
          <input 
            className="input" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Attack Strategies"
            style={{ width: '100%' }}
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Create Board
        </button>
      </form>
    </div>
  )
}

function BoardView() {
  const { pathname } = window.location
  const token = pathname.split('/').pop()
  const [board, setBoard] = React.useState<Board | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!token) return
    fetch(`/api/v1/boards/${token}`)
      .then(res => res.json())
      .then(data => {
        setBoard(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  if (loading) return <div className="container"><p>Loading...</p></div>
  if (!board) return <div className="container"><p>Board not found</p></div>

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{board.title || 'Board'}</h1>
        <div>
          <button className="btn btn-secondary">Share</button>
          <button className="btn btn-primary" style={{ marginLeft: '1rem' }}>+ Add Combination</button>
        </div>
      </div>
      
      <div className="grid">
        {board.combinations.map(combo => (
          <div key={combo.id} className="card">
            <div className="card-title">{combo.title}</div>
            <div className="card-meta">Click to view</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚽ Board</div>
        <Link to="/" style={{ color: '#e94560', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateBoard />} />
        <Route path="/board/:token" element={<BoardView />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
