import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

export type PoolStyle = 'rectangular' | 'lshape' | 'freeform' | 'infinity'
export type WaterStyle = 'crystal' | 'lagoon' | 'deep' | 'emerald'
export type LightingStyle = 'day' | 'sunset' | 'night'

export interface PoolSceneProps { style: PoolStyle; water: WaterStyle; lighting: LightingStyle; autoRotate: boolean }

const POOL_DEPTH = 1.6
const WATER_LEVEL = -0.12
const DECK_W = 11
const DECK_FRONT = -7
const DECK_BACK = 6.5

const WATER: Record<WaterStyle, { shallow: string; deep: string; tile: string }> = {
  crystal: { shallow: '#7fe3ef', deep: '#1a8fc4', tile: '#dff4f8' },
  lagoon: { shallow: '#8ff0d8', deep: '#14a89a', tile: '#e8f1e8' },
  deep: { shallow: '#3c7fb0', deep: '#0b2846', tile: '#2a3542' },
  emerald: { shallow: '#86d9b0', deep: '#127a63', tile: '#cfd8cf' },
}

const LIGHTING: Record<LightingStyle, { sky: string; ambient: number; sun: number; sunColor: string; sunPos: [number, number, number]; poolLights: number; deck: string; fog: string }> = {
  day: { sky: '#cfe7f3', ambient: 0.75, sun: 2.2, sunColor: '#fff6e8', sunPos: [8, 14, 6], poolLights: 0, deck: '#e9e3d8', fog: '#cfe7f3' },
  sunset: { sky: '#f3c39b', ambient: 0.5, sun: 1.8, sunColor: '#ffb070', sunPos: [-12, 5, -4], poolLights: 0.6, deck: '#e4d6c4', fog: '#e9b893' },
  night: { sky: '#0a1424', ambient: 0.32, sun: 0.4, sunColor: '#8fb1ff', sunPos: [4, 10, -6], poolLights: 3.2, deck: '#9aa0a8', fog: '#0a1424' },
}

/** Pool outlines in plan view (metres). x = width, y = length. */
function outline(style: PoolStyle): THREE.Shape {
  const s = new THREE.Shape()
  switch (style) {
    case 'lshape':
      s.moveTo(-4, -2.5); s.lineTo(4, -2.5); s.lineTo(4, 0.5); s.lineTo(-1, 0.5); s.lineTo(-1, 3.5); s.lineTo(-4, 3.5); s.closePath()
      break
    case 'freeform':
      s.moveTo(-4.2, 0)
      s.bezierCurveTo(-4.4, -2.6, -1.2, -3.0, 0.6, -2.2)
      s.bezierCurveTo(2.2, -1.5, 4.6, -2.4, 4.4, 0.2)
      s.bezierCurveTo(4.2, 2.6, 1.6, 2.2, 0.2, 1.8)
      s.bezierCurveTo(-1.4, 1.4, -4.0, 2.8, -4.2, 0)
      break
    case 'infinity':
      s.moveTo(-6, -2.2); s.lineTo(6, -2.2); s.lineTo(6, 2.2); s.lineTo(-6, 2.2); s.closePath()
      break
    default:
      s.moveTo(-5, -2); s.lineTo(5, -2); s.lineTo(5, 2); s.lineTo(-5, 2); s.closePath()
  }
  return s
}

const waterVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform float uGlow;
  uniform float uDim;
  varying vec3 vPos;
  float caustic(vec2 p) {
    float c = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      p += vec2(sin(p.y * 1.7 + uTime * (0.6 + fi * 0.2)), cos(p.x * 1.3 - uTime * (0.5 + fi * 0.15))) * 0.45;
      c += abs(sin(p.x * 2.1 + p.y * 1.6 + uTime * 0.8));
    }
    return c / 3.0;
  }
  void main() {
    float edge = clamp(length(vPos.xz) / 6.0, 0.0, 1.0);
    vec3 col = mix(uDeep, uShallow, 0.35 + edge * 0.5);
    float c = caustic(vPos.xz * 0.9);
    col += pow(1.0 - c, 6.0) * 0.55 * (1.0 - uDim * 0.6);
    col *= mix(1.0, 0.45, uDim);
    col += uShallow * uGlow * 0.35 * (0.7 + 0.3 * sin(uTime + vPos.x));
    gl_FragColor = vec4(col, 0.9);
  }
`

function Water({ shape, water, lighting, level }: { shape: THREE.Shape; water: WaterStyle; lighting: LightingStyle; level: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const geom = useMemo(() => new THREE.ShapeGeometry(shape, 48), [shape])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uShallow: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uGlow: { value: 0 }, uDim: { value: 0 } }),
    [],
  )
  uniforms.uShallow.value.set(WATER[water].shallow)
  uniforms.uDeep.value.set(WATER[water].deep)
  uniforms.uGlow.value = lighting === 'night' ? 1 : lighting === 'sunset' ? 0.25 : 0
  uniforms.uDim.value = lighting === 'night' ? 1 : lighting === 'sunset' ? 0.25 : 0
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime!.value += dt
  })
  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, level, 0]}>
      <shaderMaterial ref={mat} vertexShader={waterVertex} fragmentShader={waterFragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  )
}

function Basin({ shape, tile }: { shape: THREE.Shape; tile: string }) {
  const geom = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: POOL_DEPTH, bevelEnabled: false, curveSegments: 48 }), [shape])
  // Extruded prism rendered from the inside (BackSide) gives us walls + floor.
  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -POOL_DEPTH, 0]} receiveShadow>
      <meshStandardMaterial color={tile} side={THREE.BackSide} roughness={0.35} />
    </mesh>
  )
}

function Deck({ shape, color, infinity }: { shape: THREE.Shape; color: string; infinity: boolean }) {
  const geom = useMemo(() => {
    const outer = new THREE.Shape()
    const w = DECK_W, frontY = DECK_FRONT, backY = infinity ? 2.2 : DECK_BACK
    outer.moveTo(-w, frontY); outer.lineTo(w, frontY); outer.lineTo(w, backY); outer.lineTo(-w, backY); outer.closePath()
    if (infinity) {
      // Pool touches the far edge: cut the deck so it wraps three sides only.
      const notch = new THREE.Shape()
      notch.moveTo(-w, frontY); notch.lineTo(w, frontY); notch.lineTo(w, backY); notch.lineTo(6, backY); notch.lineTo(6, -2.2); notch.lineTo(-6, -2.2); notch.lineTo(-6, backY); notch.lineTo(-w, backY); notch.closePath()
      return new THREE.ShapeGeometry(notch)
    }
    outer.holes.push(new THREE.Path(shape.getPoints(64)))
    return new THREE.ShapeGeometry(outer, 64)
  }, [shape, infinity])
  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  )
}

/** Lawn surrounding the deck (a frame, so it never covers the pool). */
function Lawn({ color, infinity }: { color: string; infinity: boolean }) {
  const geom = useMemo(() => {
    const W = 40, w = DECK_W, f = DECK_FRONT, b = infinity ? 2.2 : DECK_BACK
    const s = new THREE.Shape()
    if (infinity) {
      // U-shape: nothing beyond the vanishing edge, the terrain drops away there.
      s.moveTo(-W, -W); s.lineTo(W, -W); s.lineTo(W, b); s.lineTo(w, b); s.lineTo(w, f); s.lineTo(-w, f); s.lineTo(-w, b); s.lineTo(-W, b); s.closePath()
    } else {
      s.moveTo(-W, -W); s.lineTo(W, -W); s.lineTo(W, W); s.lineTo(-W, W); s.closePath()
      const hole = new THREE.Path()
      hole.moveTo(-w, f); hole.lineTo(w, f); hole.lineTo(w, b); hole.lineTo(-w, b); hole.closePath()
      s.holes.push(hole)
    }
    return new THREE.ShapeGeometry(s)
  }, [infinity])
  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  )
}

function Lounger({ position, rotation = 0, night }: { position: [number, number, number]; rotation?: number; night: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.75, 0.1, 2]} />
        <meshStandardMaterial color={night ? '#5a5f66' : '#f4f1ea'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.48, -0.78]} rotation={[0.9, 0, 0]} castShadow>
        <boxGeometry args={[0.75, 0.08, 0.7]} />
        <meshStandardMaterial color={night ? '#5a5f66' : '#f4f1ea'} roughness={0.9} />
      </mesh>
      {[-0.3, 0.3].map((x) => [-0.85, 0.85].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.1, z]}>
          <boxGeometry args={[0.05, 0.2, 0.05]} />
          <meshStandardMaterial color="#2a2f36" />
        </mesh>
      )))}
    </group>
  )
}

function PoolLights({ shape, intensity }: { shape: THREE.Shape; intensity: number }) {
  const points = useMemo(() => shape.getSpacedPoints(8).slice(0, 8), [shape])
  if (intensity <= 0) return null
  return (
    <group>
      {points.map((p, i) => (
        <group key={i} position={[p.x * 0.96, -0.55, -p.y * 0.96]}>
          <mesh>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color="#c8fbff" />
          </mesh>
          {i % 2 === 0 && <pointLight color="#6fe7ff" intensity={intensity} distance={6} decay={1.4} />}
        </group>
      ))}
    </group>
  )
}

function Scene({ style, water, lighting, autoRotate }: PoolSceneProps) {
  const shape = useMemo(() => outline(style), [style])
  const L = LIGHTING[lighting]
  const night = lighting === 'night'
  const infinity = style === 'infinity'

  return (
    <>
      <color attach="background" args={[L.sky]} />
      <fog attach="fog" args={[L.fog, 26, 60]} />
      <ambientLight intensity={L.ambient} />
      <hemisphereLight args={[L.sky, '#3d4a3a', night ? 0.15 : 0.45]} />
      <directionalLight position={L.sunPos} intensity={L.sun} color={L.sunColor} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} />

      <group>
        <Deck shape={shape} color={L.deck} infinity={infinity} />
        <Basin shape={shape} tile={WATER[water].tile} />
        <Water shape={shape} water={water} lighting={lighting} level={infinity ? -0.02 : WATER_LEVEL} />
        <PoolLights shape={shape} intensity={L.poolLights} />

        {infinity && (
          <>
            {/* vanishing edge spill wall + catch basin */}
            <mesh position={[0, -0.8, -2.25]}>
              <boxGeometry args={[12, 1.6, 0.1]} />
              <meshStandardMaterial color={WATER[water].deep} roughness={0.15} metalness={0.2} />
            </mesh>
            <mesh position={[0, -1.62, -2.7]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[12, 0.9]} />
              <meshStandardMaterial color={WATER[water].shallow} roughness={0.1} />
            </mesh>
            <mesh position={[0, -1.7, -14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[60, 22]} />
              <meshStandardMaterial color={night ? '#1a2a22' : '#7f9d68'} roughness={1} />
            </mesh>
          </>
        )}

        <Lawn infinity={infinity} color={night ? '#16231b' : lighting === 'sunset' ? '#7a8a55' : '#8bab6f'} />

        <Lounger position={[-3, 0, 5]} night={night} />
        <Lounger position={[-1.6, 0, 5]} night={night} />
        <Lounger position={[3.5, 0, 5]} rotation={0.15} night={night} />

        {/* simple pool house to give scale */}
        {!infinity && (
          <group position={[-8.6, 0, -3]}>
            <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.5, 2.8, 4]} />
              <meshStandardMaterial color={night ? '#3b414a' : '#f2efe8'} roughness={0.9} />
            </mesh>
            <mesh position={[1.77, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[3, 2]} />
              <meshStandardMaterial color={night ? '#ffd9a0' : '#2d4157'} emissive={night ? '#ffb85c' : '#000000'} emissiveIntensity={night ? 0.9 : 0} roughness={0.2} />
            </mesh>
            <mesh position={[0, 2.9, 0]} castShadow>
              <boxGeometry args={[4.1, 0.2, 4.6]} />
              <meshStandardMaterial color="#2a2f36" />
            </mesh>
          </group>
        )}
      </group>

      <ContactShadows position={[0, 0.01, 0]} opacity={night ? 0.2 : 0.35} scale={30} blur={2.4} far={4} />
      <OrbitControls
        makeDefault
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={7}
        maxDistance={30}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, -0.3, 0]}
      />
    </>
  )
}

export default function PoolScene(props: PoolSceneProps & { cameraKey: number; view: 'perspective' | 'top' | 'side' }) {
  const cam = props.view === 'top' ? [0.01, 22, 0.01] : props.view === 'side' ? [0, 2.2, 14] : [11, 8, 12]
  return (
    <Canvas key={props.cameraKey} shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]} camera={{ position: cam as [number, number, number], fov: 42 }} gl={{ antialias: true }}>
      <Scene {...props} />
    </Canvas>
  )
}
