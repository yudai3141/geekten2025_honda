import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// 3Dモデルのパス
const modelUrl = '/assets/udemy_test.glb'

// カメラの最適な位置（既存Webアプリと同じ設定）
const OPTIMAL_CAMERA_POSITION = {
  position: { x: 0, y: 3.5, z: -7 },  // 顔全体が見えるよう少し上から
  target: { x: 0, y: 2.5, z: 0 }      // 顔の中心あたりを見る
}

/**
 * アニメーション付き3Dモデル
 */
function AnimatedModel({ onClick }: { onClick?: () => void }) {
  const { scene, animations } = useGLTF(modelUrl)
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const modelRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (scene && animations && animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene)
      
      // "Talk"アニメーションを探して再生
      const talkAnimation = animations.find(clip => clip.name === 'Talk')
      if (talkAnimation && mixer.current) {
        const action = mixer.current.clipAction(talkAnimation)
        action.play()
      }
    }
  }, [scene, animations])

  useFrame((_, delta) => {
    if (mixer.current) {
      mixer.current.update(delta)
    }
  })

  // ホバー時のカーソル変更とクリック可能状態の切り替え
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer'
      // キャラクターにホバー中はクリック可能に
      if (window.electronAPI) {
        window.electronAPI.setClickable(true)
      }
    } else {
      document.body.style.cursor = 'default'
      // ホバーが外れたらクリックスルーに戻す
      if (window.electronAPI) {
        window.electronAPI.setClickable(false)
      }
    }
  }, [hovered])

  const handleClick = (event: any) => {
    console.log('🎨 3Dモデルクリック検出', event.object)
    // クリックされたオブジェクトがあるか確認（透過部分ではない）
    if (event.object && onClick) {
      console.log('✅ 3Dオブジェクトに対するクリック確認')
      event.stopPropagation()
      onClick()
    }
  }

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      onClick={handleClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    />
  )
}

/**
 * デスクトップマスコット用の3Dキャラクター表示コンポーネント
 */
interface MascotCharacterProps {
  onCharacterClick?: () => void
}

export default function MascotCharacter({ onCharacterClick }: MascotCharacterProps) {
  const handleClick = () => {
    if (onCharacterClick) {
      onCharacterClick()
    }
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        background: 'transparent'
      }}
    >
      <Canvas 
        camera={{ 
          position: [
            OPTIMAL_CAMERA_POSITION.position.x,
            OPTIMAL_CAMERA_POSITION.position.y,
            OPTIMAL_CAMERA_POSITION.position.z
          ],
          fov: 60
        }}
        onCreated={({ camera }) => {
          camera.lookAt(
            OPTIMAL_CAMERA_POSITION.target.x,
            OPTIMAL_CAMERA_POSITION.target.y,
            OPTIMAL_CAMERA_POSITION.target.z
          )
        }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <AnimatedModel onClick={handleClick} />
      </Canvas>
    </div>
  )
}

// モデルのプリロード
useGLTF.preload(modelUrl)

