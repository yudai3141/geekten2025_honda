import { Suspense, useRef, useEffect } from 'react'
import './App.css'
import MascotCharacter from './components/MascotCharacter'

function App() {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  const handleCharacterClick = () => {
    console.log('🖱️ キャラクタークリック検出')
    // メインアプリウィンドウを開く
    if (window.electronAPI) {
      console.log('📡 openHome を送信')
      window.electronAPI.openHome()
    } else {
      console.log('🌐 ブラウザモード: 新しいタブで開く')
      // ブラウザモードの場合は通常のウィンドウで開く
      window.open('http://localhost:5173', '_blank')
    }
  }

  // 初期状態でクリックスルーを有効化
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setClickable(false)
    }
  }, [])

  // ドラッグ機能の実装
  useEffect(() => {
    const dragHandle = dragHandleRef.current
    if (!dragHandle) return

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      offsetRef.current = {
        x: e.clientX,
        y: e.clientY
      }
      // ドラッグ開始時は確実にクリック可能に
      if (window.electronAPI) {
        window.electronAPI.setClickable(true)
      }
      e.preventDefault()
      e.stopPropagation()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      
      const deltaX = e.clientX - offsetRef.current.x
      const deltaY = e.clientY - offsetRef.current.y
      
      // 小さすぎる移動は無視（ブレ防止）
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return
      
      offsetRef.current = {
        x: e.clientX,
        y: e.clientY
      }

      // 直接移動（シンプルで確実）
      if (window.electronAPI) {
        window.electronAPI.moveWindow(deltaX, deltaY)
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      // ドラッグ終了後はクリックスルーに戻す
      if (window.electronAPI) {
        window.electronAPI.setClickable(false)
      }
    }

    // ドラッグハンドルにホバーした時はクリック可能に
    const handleMouseEnter = () => {
      if (window.electronAPI && !isDraggingRef.current) {
        window.electronAPI.setClickable(true)
      }
    }

    const handleMouseLeave = () => {
      if (window.electronAPI && !isDraggingRef.current) {
        window.electronAPI.setClickable(false)
      }
    }

    dragHandle.addEventListener('mousedown', handleMouseDown)
    dragHandle.addEventListener('mouseenter', handleMouseEnter)
    dragHandle.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      dragHandle.removeEventListener('mousedown', handleMouseDown)
      dragHandle.removeEventListener('mouseenter', handleMouseEnter)
      dragHandle.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="app">
      {/* キャラクター表示 - 最背面 */}
      <Suspense fallback={
        <div className="loading">
          <h2>読み込み中...</h2>
          <p>3Dモデルを準備しています</p>
        </div>
      }>
        <div className="character-container">
          <MascotCharacter onCharacterClick={handleCharacterClick} />
        </div>
      </Suspense>
      
      {/* ドラッグハンドル - 上部 */}
      <div ref={dragHandleRef} className="drag-handle drag-handle-top">
        <div className="drag-icon">☰</div>
      </div>
    </div>
  )
}

export default App

