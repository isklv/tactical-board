import React, { useRef } from 'react'
import { Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom'
import { Rect, Circle, Line, Text, Stage, Layer } from 'react-konva'
import './index.css'
import { BoardEditor } from './components/BoardEditor'

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
  const { token } = useParams()
  const navigate = useNavigate()
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

  const handleSaveCombination = async (content: any, title: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/v1/boards/${token}/combos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: JSON.stringify(content),
        }),
      })
      if (res.ok) {
        // Refresh board data
        const updatedBoard = await fetch(`/api/v1/boards/${token}`).then(r => r.json())
        setBoard(updatedBoard)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>
  if (!board) return <div className="container"><p>Board not found</p></div>

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{board.title || 'Board'}</h1>
        <div>
          <button className="btn btn-secondary" onClick={() => {
            const url = `${window.location.origin}/board/${token}`
            navigator.clipboard.writeText(url)
            alert('Link copied to clipboard!')
          }}>Share</button>
          <button 
            className="btn btn-primary" 
            style={{ marginLeft: '1rem' }}
            onClick={() => {
              const title = prompt('Enter combination title:')
              if (title) {
                navigate(`/board/${token}/editor`, { state: { title, onSave: handleSaveCombination } })
              }
            }}
          >
            + Add Combination
          </button>
        </div>
      </div>
      
      <div className="grid">
        {board.combinations.map(combo => (
          <div key={combo.id} className="card" onClick={() => navigate(`/board/${token}/editor/${combo.id}`)}>
            <div className="card-title">{combo.title}</div>
            <div className="card-meta">Click to view/edit</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewCombination() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const handleSave = (content: any) => {
    setSaving(true)
    const saveTitle = prompt('Enter combination title:')
    if (!saveTitle) {
      setSaving(false)
      return
    }
    
    fetch(`/api/v1/boards/${token}/combos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: saveTitle,
        content: JSON.stringify(content),
      }),
    }).then(() => {
      navigate(`/board/${token}`)
    }).catch(err => {
      console.error(err)
      alert('Failed to save')
      setSaving(false)
    })
  }

  return (
    <div>
      <div style={{ padding: '1rem', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>New Combination</h2>
        <button 
          onClick={() => navigate(`/board/${token}`)}
          style={{ padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
      <BoardEditor sport={board?.sport || 'football'} onSave={handleSave} />
    </div>
  )
}

function ViewCombination() {
  const { token, comboId } = useParams()
  const navigate = useNavigate()
  const [combo, setCombo] = React.useState<Combination | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!token || !comboId) return
    fetch(`/api/v1/boards/${token}/combos`) // API should return specific combo or we filter client-side
      .then(res => res.json())
      .then((combos: Combination[]) => {
        const found = combos.find(c => c.id === comboId)
        setCombo(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, comboId])

  if (loading) return <div>Loading...</div>
  if (!combo) return <div>Combination not found</div>

  const content = JSON.parse(combo.content)

  return (
    <div>
      <div style={{ padding: '1rem', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>{combo.title}</h2>
        <div>
          <button 
            onClick={() => navigate(`/board/${token}`)}
            style={{ padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}
          >
            Back
          </button>
          <button 
            onClick={() => navigate(`/board/${token}/editor/new`)}
            style={{ padding: '0.5rem 1rem', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            New Combination
          </button>
        </div>
      </div>
      <ViewOnlyCanvas content={content} />
    </div>
  )
}

function ViewOnlyCanvas({ content }: { content: any }) {
  const stageRef = useRef<Stage>(null)
  
  return (
    <div style={{ flex: 1, background: '#0f172a' }}>
      <Stage ref={stageRef} width={window.innerWidth} height={window.innerHeight - 60}>
        <Layer>
          {/* Court background */}
          <Rect x={50} y={50} width={1050} height={680} fill="#2d5a27" stroke="#fff" strokeWidth={2} />
          {/* Center line */}
          <Line points={[1100, 50, 1100, 730]} stroke="#fff" strokeWidth={2} />
          {/* Center circle */}
          <Circle x={1100} y={365} radius={60} stroke="#fff" strokeWidth={2} fill="transparent" />
          
          {/* Render players */}
          {content?.players?.map((player: Player, idx: number) => (
            <React.Fragment key={idx}>
              <Circle x={player.x} y={player.y} radius={12} fill={player.color} stroke="#fff" strokeWidth={1} />
              <Text x={player.x - 5} y={player.y - 5} text={String(player.number)} fontSize={10} fill="#fff" />
            </React.Fragment>
          ))}
          
          {/* Render arrows */}
          {content?.arrows?.map((arrow: Arrow, idx: number) => (
            <Line
              key={idx}
              points={arrow.points.flatMap(p => [p.x, p.y])}
              stroke={arrow.color || '#fff'}
              strokeWidth={arrow.width || 3}
              lineCap="round"
            />
          ))}
        </Layer>
      </Stage>
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
        <Route path="/board/:token/editor/new" element={<NewCombination />} />
        <Route path="/board/:token/editor/:comboId" element={<NewCombination />} />
        <Route path="/board/:token/view/:comboId" element={<ViewCombination />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
