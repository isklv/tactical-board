import React, { useRef, useState } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Transformer } from 'react-konva';

interface Player {
  x: number
  y: number
  number: number
  color: string
  label?: string
}

interface Arrow {
  points: { x: number; y: number }[]
  color?: string
  width?: number
  type?: 'pass' | 'movement' | 'shoot'
}

interface BoardEditorProps {
  sport: 'football' | 'hockey' | 'basketball'
  onSave: (content: { players: Player[]; arrows: Arrow[] }) => void
}

const COURT_CONFIG = {
  football: { width: 1050, height: 680, color: '#2d5a27', lineColor: '#fff' },
  hockey: { width: 600, height: 1000, color: '#c8d6e4', lineColor: '#003366' },
  basketball: { width: 500, height: 940, color: '#d2691e', lineColor: '#fff' },
}

export function BoardEditor({ sport, onSave }: BoardEditorProps) {
  const stageRef = useRef<Stage>(null)
  const transformerRef = useRef<Transformer>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [arrows, setArrows] = useState<Arrow[]>([])
  const [currentTool, setCurrentTool] = useState<'select' | 'player-home' | 'player-away' | 'arrow'>('select')
  const [tempArrowPoints, setTempArrowPoints] = useState<{ x: number; y: number }[]>([])
  const [zoom, setZoom] = useState(1)

  const court = COURT_CONFIG[sport]
  const homeColor = '#e94560'
  const awayColor = '#00d9ff'

  const addPlayer = (x: number, y: number, team: 'home' | 'away') => {
    const id = `player-${Date.now()}`
    const newPlayer: Player = {
      x,
      y,
      number: players.filter(p => p.color === (team === 'home' ? homeColor : awayColor)).length + 1,
      color: team === 'home' ? homeColor : awayColor,
      label: '',
    }
    setPlayers([...players, newPlayer])
  }

  const handleStageClick = (e: any) => {
    if (currentTool === 'select') {
      setSelectedId(null)
      transformerRef.current?.nodes([])
      return
    }

    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return

    if (currentTool === 'player-home') {
      addPlayer(pos.x, pos.y, 'home')
      setCurrentTool('select')
    } else if (currentTool === 'player-away') {
      addPlayer(pos.x, pos.y, 'away')
      setCurrentTool('select')
    } else if (currentTool === 'arrow') {
      if (tempArrowPoints.length === 0) {
        setTempArrowPoints([{ x: pos.x, y: pos.y }])
      } else {
        const newArrow: Arrow = {
          points: [...tempArrowPoints, { x: pos.x, y: pos.y }],
          color: '#ffffff',
          width: 3,
          type: 'pass',
        }
        setArrows([...arrows, newArrow])
        setTempArrowPoints([])
        setCurrentTool('select')
      }
    }
  }

  const selectPlayer = (id: string, player: Player) => {
    setSelectedId(id)
    const node = stageRef.current?.findOne(`#${id}`)
    if (node && transformerRef.current) {
      transformerRef.current.nodes([node])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }

  const updatePlayerPosition = (id: string, newPos: { x: number; y: number }) => {
    setPlayers(players.map(p => p.x === id.split('-')[1] ? { ...p, x: newPos.x, y: newPos.y } : p))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    const playerId = selectedId.replace('player-', '')
    setPlayers(players.filter(p => `${p.x}` !== playerId))
    setSelectedId(null)
    transformerRef.current?.nodes([])
  }

  const clearBoard = () => {
    setPlayers([])
    setArrows([])
    setSelectedId(null)
  }

  const exportBoard = () => {
    onSave({ players, arrows })
  }

  const renderCourt = () => (
    <Layer>
      {/* Court background */}
      <Rect
        x={(window.innerWidth - court.width) / 2}
        y={(window.innerHeight - court.height) / 2}
        width={court.width}
        height={court.height}
        fill={court.color}
        stroke={court.lineColor}
        strokeWidth={2}
      />
      
      {/* Center line */}
      <Line
        points={[
          (window.innerWidth + court.width) / 2, (window.innerHeight - court.height) / 2,
          (window.innerWidth + court.width) / 2, (window.innerHeight + court.height) / 2
        ]}
        stroke={court.lineColor}
        strokeWidth={2}
      />

      {/* Center circle */}
      <Circle
        x={(window.innerWidth + court.width) / 2}
        y={(window.innerHeight + court.height) / 2}
        radius={60}
        stroke={court.lineColor}
        strokeWidth={2}
        fill="transparent"
      />

      {/* Goal areas (simplified) */}
      <Rect
        x={(window.innerWidth - court.width) / 2}
        y={(window.innerHeight - court.height) / 2 + 60}
        width={140}
        height={40}
        stroke={court.lineColor}
        strokeWidth={2}
        fill="transparent"
      />
      <Rect
        x={(window.innerWidth + court.width) / 2 - 140}
        y={(window.innerHeight - court.height) / 2 + 60}
        width={140}
        height={40}
        stroke={court.lineColor}
        strokeWidth={2}
        fill="transparent"
      />
    </Layer>
  )

  const renderPlayers = () => (
    <Layer>
      {players.map((player, index) => {
        const id = `player-${index}`
        const isSelected = selectedId === id
        
        return (
          <React.Fragment key={id}>
            <Circle
              id={id}
              x={player.x}
              y={player.y}
              radius={12}
              fill={player.color}
              stroke={isSelected ? '#ffffff' : 'transparent'}
              strokeWidth={2}
              onClick={() => selectPlayer(id, player)}
              onTap={() => selectPlayer(id, player)}
            />
            <Text
              x={player.x - 5}
              y={player.y - 5}
              text={String(player.number)}
              fontSize={10}
              fill="#fff"
              fontStyle="bold"
            />
            {isSelected && transformerRef.current}
          </React.Fragment>
        )
      })}
      
      {/* Transformer for selected player */}
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
          // limit resize
          if (newBox.width < 5 || newBox.height < 5) {
            return oldBox
          }
          return newBox
        }}
      />
    </Layer>
  )

  const renderArrows = () => (
    <Layer>
      {arrows.map((arrow, index) => (
        <Line
          key={`arrow-${index}`}
          points={arrow.points.flatMap(p => [p.x, p.y])}
          stroke={arrow.color || '#fff'}
          strokeWidth={arrow.width || 3}
          lineCap="round"
          lineJoin="round"
        />
      ))}
      
      {/* Temporary arrow being drawn */}
      {tempArrowPoints.length > 0 && (
        <Line
          points={tempArrowPoints.flatMap(p => [p.x, p.y])}
          stroke="#fff"
          strokeWidth={3}
          dash={[5, 5]}
          lineCap="round"
        />
      )}
    </Layer>
  )

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '10px',
        background: '#1e293b',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setCurrentTool('select')}
          style={{
            padding: '8px 16px',
            background: currentTool === 'select' ? '#e94560' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🖱️ Select
        </button>
        
        <button
          onClick={() => setCurrentTool('player-home')}
          style={{
            padding: '8px 16px',
            background: currentTool === 'player-home' ? homeColor : '#334155',
            color: '#fff',
            border: `2px solid ${homeColor}`,
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⚽ Home
        </button>
        
        <button
          onClick={() => setCurrentTool('player-away')}
          style={{
            padding: '8px 16px',
            background: currentTool === 'player-away' ? awayColor : '#334155',
            color: '#fff',
            border: `2px solid ${awayColor}`,
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⚽ Away
        </button>
        
        <button
          onClick={() => setCurrentTool('arrow')}
          style={{
            padding: '8px 16px',
            background: currentTool === 'arrow' ? '#fff' : '#334155',
            color: currentTool === 'arrow' ? '#000' : '#fff',
            border: currentTool === 'arrow' ? '2px solid #fff' : 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ➡️ Arrow
        </button>

        <div style={{ flex: 1 }} />
        
        <button onClick={deleteSelected} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🗑️ Delete
        </button>
        <button onClick={clearBoard} style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          🔄 Clear
        </button>
        <button onClick={exportBoard} style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          💾 Save
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          onClick={handleStageClick}
          onWheel={(e) => {
            e.evt.preventDefault()
            const scaleBy = 1.05
            const stage = stageRef.current
            if (!stage) return
            const oldZoom = stage.scaleX()
            const pointer = stage.getPointerPosition()
            const mousePointTo = {
              x: (pointer.x - stage.x()) / oldZoom,
              y: (pointer.y - stage.y()) / oldZoom,
            }
            const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy
            stage.scale({ x: newZoom, y: newZoom })
            stage.position({
              x: pointer.x - mousePointTo.x * newZoom,
              y: pointer.y - mousePointTo.y * newZoom,
            })
            setZoom(newZoom)
          }}
        >
          {renderCourt()}
          {renderPlayers()}
          {renderArrows()}
        </Stage>
        
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Zoom: {Math.round(zoom * 100)}% | Click and drag to move, scroll to zoom
        </div>
      </div>
    </div>
  )
}
