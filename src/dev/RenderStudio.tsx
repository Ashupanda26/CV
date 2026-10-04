/**
 * Dev-only "photo studio": renders architectural-visualisation stills of
 * pools, used as gallery imagery where external photos can't be loaded.
 * Open /__studio?shot=hero in `npm run dev`; scripts capture the canvas.
 */
import { useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, Sky } from '@react-three/drei'
import * as THREE from 'three'

type Style = 'rect' | 'lshape' | 'freeform' | 'infinity' | 'lap' | 'plunge'
type Light = 'day' | 'golden' | 'dusk'
type Water = 'crystal' | 'lagoon' | 'deep' | 'emerald'

interface Shot {
  style: Style
  light: Light
  water: Water
  cam: [number, number, number]
  target: [number, number, number]
  fov?: number
  house?: boolean
  seed?: number
}

export const SHOTS: Record<string, Shot> = {
  hero: { style: 'rect', light: 'dusk', water: 'crystal', cam: [-10, 2.4, 11], target: [1.5, 1.6, -5], house: true, fov: 52 },
  r01: { style: 'infinity', light: 'golden', water: 'lagoon', cam: [7, 3, 11], target: [-1, -0.5, -4], fov: 44 },
  r02: { style: 'rect', light: 'day', water: 'crystal', cam: [9, 3.6, 10], target: [0, 0.8, -3], house: true },
  r03: { style: 'freeform', light: 'golden', water: 'lagoon', cam: [-9, 3.2, 9], target: [0, 0.6, -2.5], house: true },
  r04: { style: 'lshape', light: 'day', water: 'crystal', cam: [2, 9, 13], target: [0, -0.2, -1], house: true },
  r05: { style: 'rect', light: 'dusk', water: 'crystal', cam: [-8, 2.2, 9.5], target: [0, 1.2, -4], house: true },
  r06: { style: 'lap', light: 'day', water: 'deep', cam: [7, 2.6, 11], target: [-1, 0.8, -3], house: true, fov: 44 },
  r07: { style: 'plunge', light: 'golden', water: 'emerald', cam: [6, 2.6, 7], target: [0, 0.6, -2], house: true },
  r08: { style: 'lap', light: 'dusk', water: 'deep', cam: [0, 2.6, 13], target: [0, 1, -4], house: true },
  r09: { style: 'freeform', light: 'day', water: 'crystal', cam: [0, 20, 2], target: [0, 0, 0], fov: 40, house: false },
  r10: { style: 'lshape', light: 'dusk', water: 'lagoon', cam: [9, 3, 8], target: [0, 0.6, -2.5], house: true },
  r11: { style: 'infinity', light: 'day', water: 'lagoon', cam: [0, 3.2, 13], target: [0, -0.5, -4], fov: 44 },
  r12: { style: 'rect', light: 'golden', water: 'emerald', cam: [-11, 4.5, 6], target: [0, 0.5, -2], house: true },
  design: { style: 'lshape', light: 'day', water: 'crystal', cam: [0, 19, 3], target: [0, 0, -1], fov: 50, house: true },
  about: { style: 'rect', light: 'golden', water: 'crystal', cam: [7, 2, 10], target: [-1, 1.6, -5], house: true, fov: 48 },
}

const WATER: Record<Water, { shallow: string; deep: string; tile: string }> = {
  crystal: { shallow: '#8fe6f0', deep: '#1683b8', tile: '#e6f5f8' },
  lagoon: { shallow: '#9af0dc', deep: '#11998e', tile: '#eef2ea' },
  deep: { shallow: '#4f8fbf', deep: '#0b2a4a', tile: '#3a4654' },
  emerald: { shallow: '#8ddbb4', deep: '#0f7560', tile: '#d4ddd4' },
}

const LIGHT: Record<Light, { sun: [number, number, number]; sunColor: string; sunI: number; amb: number; fog: string; dusk: boolean; exposure: number }> = {
  day: { sun: [18, 26, 10], sunColor: '#fff4e2', sunI: 2.6, amb: 0.55, fog: '#cfe2ee', dusk: false, exposure: 1 },
  golden: { sun: [-30, 7, -12], sunColor: '#ffb36b', sunI: 3.2, amb: 0.45, fog: '#f2c9a0', dusk: false, exposure: 1.05 },
  dusk: { sun: [-30, 6, -20], sunColor: '#c9a0ff', sunI: 0.5, amb: 0.28, fog: '#3a4470', dusk: true, exposure: 1.1 },
}

// ---------- procedural textures ----------
function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat: [number, number]) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d')!)
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function rand(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

const useTiles = () =>
  useMemo(
    () =>
      canvasTexture(1024, 512, (c) => {
        const r = rand(7)
        // 4 × 2 large-format porcelain slabs (1.2m × 0.6m each when repeated)
        for (let x = 0; x < 4; x++)
          for (let y = 0; y < 4; y++) {
            const v = 222 + Math.floor(r() * 12)
            c.fillStyle = `rgb(${v},${v - 4},${v - 12})`
            c.fillRect(x * 256, y * 128, 256, 128)
            for (let i = 0; i < 140; i++) {
              c.fillStyle = `rgba(120,110,95,${r() * 0.05})`
              c.fillRect(x * 256 + r() * 256, y * 128 + r() * 128, 2 + r() * 6, 2 + r() * 6)
            }
          }
        c.strokeStyle = 'rgba(120,112,100,0.55)'
        c.lineWidth = 3
        for (let x = 0; x <= 4; x++) { c.beginPath(); c.moveTo(x * 256, 0); c.lineTo(x * 256, 512); c.stroke() }
        for (let y = 0; y <= 4; y++) { c.beginPath(); c.moveTo(0, y * 128); c.lineTo(1024, y * 128); c.stroke() }
      }, [6, 12]),
    [],
  )

const useLawn = () =>
  useMemo(
    () =>
      canvasTexture(512, 512, (c) => {
        const r = rand(3)
        c.fillStyle = '#6f9150'
        c.fillRect(0, 0, 512, 512)
        for (let i = 0; i < 9000; i++) {
          const g = 110 + Math.floor(r() * 60)
          c.fillStyle = `rgba(${g - 50},${g},${g - 70},0.35)`
          c.fillRect(r() * 512, r() * 512, 1.5, 3 + r() * 4)
        }
        // mowing stripes
        for (let s = 0; s < 8; s++) {
          c.fillStyle = s % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)'
          c.fillRect(s * 64, 0, 64, 512)
        }
      }, [14, 14]),
    [],
  )

const useTimber = () =>
  useMemo(
    () =>
      canvasTexture(512, 512, (c) => {
        const r = rand(11)
        for (let x = 0; x < 16; x++) {
          const v = 120 + Math.floor(r() * 30)
          c.fillStyle = `rgb(${v},${Math.floor(v * 0.72)},${Math.floor(v * 0.48)})`
          c.fillRect(x * 32, 0, 30, 512)
          for (let i = 0; i < 30; i++) {
            c.fillStyle = `rgba(60,35,20,${r() * 0.18})`
            c.fillRect(x * 32 + r() * 30, 0, 1, 512)
          }
        }
      }, [3, 1]),
    [],
  )

// ---------- geometry helpers ----------
function poolShape(style: Style, inflate = 0): THREE.Shape {
  const s = new THREE.Shape()
  const rect = (w: number, l: number, cx = 0, cy = 0) => {
    const hw = w / 2 + inflate, hl = l / 2 + inflate
    s.moveTo(cx - hw, cy - hl); s.lineTo(cx + hw, cy - hl); s.lineTo(cx + hw, cy + hl); s.lineTo(cx - hw, cy + hl); s.closePath()
  }
  switch (style) {
    case 'lap': rect(16, 3.2); break
    case 'plunge': rect(4.5, 3); break
    case 'infinity': rect(12, 4.6); break
    case 'lshape': {
      const i = inflate
      s.moveTo(-4.5 - i, -2.5 - i); s.lineTo(4.5 + i, -2.5 - i); s.lineTo(4.5 + i, 0.6 + i); s.lineTo(-1.2 + i, 0.6 + i)
      s.lineTo(-1.2 + i, 3.6 + i); s.lineTo(-4.5 - i, 3.6 + i); s.closePath()
      break
    }
    case 'freeform': {
      const k = 1 + inflate / 3.2
      s.moveTo(-4.4 * k, 0)
      s.bezierCurveTo(-4.6 * k, -2.7 * k, -1.2 * k, -3.1 * k, 0.6 * k, -2.3 * k)
      s.bezierCurveTo(2.3 * k, -1.6 * k, 4.8 * k, -2.5 * k, 4.6 * k, 0.2 * k)
      s.bezierCurveTo(4.4 * k, 2.7 * k, 1.6 * k, 2.3 * k, 0.2 * k, 1.9 * k)
      s.bezierCurveTo(-1.5 * k, 1.5 * k, -4.2 * k, 2.9 * k, -4.4 * k, 0)
      break
    }
    default: rect(10, 4.2)
  }
  return s
}

const flat = [-Math.PI / 2, 0, 0] as [number, number, number]

const waterVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vPos = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const waterFragment = /* glsl */ `
  uniform float uTime; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSky; uniform float uGlow; uniform float uSpec;
  varying vec3 vPos;
  float ripple(vec2 p) {
    float c = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      p += vec2(sin(p.y * 1.3 + uTime * (0.6 + fi * 0.2) + fi), cos(p.x * 1.1 - uTime * (0.5 + fi * 0.15))) * 0.4;
      c += abs(sin(p.x * 2.3 + p.y * 1.7 + uTime * 0.8));
    }
    return c / 4.0;
  }
  void main() {
    vec3 V = normalize(cameraPosition - vPos);
    float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
    float depth = clamp(length(vPos.xz) / 7.0, 0.0, 1.0);
    vec3 col = mix(uDeep, uShallow, 0.15 + depth * 0.45);
    float c = ripple(vPos.xz * 0.8);
    col += pow(1.0 - c, 7.0) * 0.6;                     // caustic sparkle
    col = mix(col, uSky, 0.06 + fres * 0.38);           // sky reflection
    col += uSpec * pow(1.0 - c, 14.0);                   // sun glints
    col += uShallow * uGlow * 0.55;                      // underwater lights
    gl_FragColor = vec4(col, 0.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function Pool({ style, water, light, seed }: { style: Style; water: Water; light: Light; seed: number }) {
  const shape = useMemo(() => poolShape(style), [style])
  const W = WATER[water]
  const L = LIGHT[light]
  const depth = style === 'plunge' ? 1.4 : 1.6
  const level = style === 'infinity' ? -0.015 : -0.1
  const basin = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 }), [shape, depth])
  const surface = useMemo(() => new THREE.ShapeGeometry(shape, 64), [shape])
  const coping = useMemo(() => {
    const outer = poolShape(style, 0.4)
    outer.holes.push(new THREE.Path(shape.getPoints(96)))
    return new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: false, curveSegments: 64 })
  }, [shape, style])
  const lights = useMemo(() => shape.getSpacedPoints(10).slice(0, 10), [shape])
  const uniforms = useMemo(
    () => ({
      uTime: { value: seed * 3.7 },
      uShallow: { value: new THREE.Color(W.shallow) },
      uDeep: { value: new THREE.Color(W.deep) },
      uSky: { value: new THREE.Color(L.dusk ? '#2a3a5c' : light === 'golden' ? '#f7d2a8' : '#cfe6f6') },
      uGlow: { value: L.dusk ? 1 : 0 },
      uSpec: { value: light === 'golden' ? 0.7 : L.dusk ? 0.1 : 0.45 },
    }),
    [W, L, light, seed],
  )

  return (
    <group>
      <mesh geometry={basin} rotation={flat} position={[0, -depth, 0]} receiveShadow>
        <meshStandardMaterial color={W.tile} side={THREE.BackSide} roughness={0.3} />
      </mesh>
      <mesh geometry={surface} rotation={flat} position={[0, level, 0]}>
        <shaderMaterial vertexShader={waterVertex} fragmentShader={waterFragment} uniforms={uniforms} transparent depthWrite={false} />
      </mesh>
      {style !== 'infinity' && (
        <mesh geometry={coping} rotation={flat} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#efe9df" roughness={0.75} />
        </mesh>
      )}
      {L.dusk &&
        lights.map((p, i) => (
          <group key={i} position={[p.x * 0.97, -0.5, -p.y * 0.97]}>
            <mesh><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#d8fdff" /></mesh>
            {i % 2 === 0 && <pointLight color="#62e4ff" intensity={4} distance={7} decay={1.3} />}
          </group>
        ))}
      {style === 'infinity' && (
        <>
          <mesh position={[0, -0.85, -2.33]}>
            <boxGeometry args={[12, 1.7, 0.12]} />
            <meshStandardMaterial color={W.deep} roughness={0.08} metalness={0.25} />
          </mesh>
          <mesh rotation={flat} position={[0, -1.7, -2.9]}>
            <planeGeometry args={[12.4, 1.1]} />
            <meshStandardMaterial color={W.shallow} roughness={0.1} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Deck({ style, light }: { style: Style; light: Light }) {
  const tiles = useTiles()
  const lawn = useLawn()
  const infinity = style === 'infinity'
  const deckGeo = useMemo(() => {
    const w = 13, front = -8, back = infinity ? 2.3 : 7.5
    const s = new THREE.Shape()
    if (infinity) {
      s.moveTo(-w, front); s.lineTo(w, front); s.lineTo(w, back); s.lineTo(6, back); s.lineTo(6, -2.3); s.lineTo(-6, -2.3); s.lineTo(-6, back); s.lineTo(-w, back); s.closePath()
    } else {
      s.moveTo(-w, front); s.lineTo(w, front); s.lineTo(w, back); s.lineTo(-w, back); s.closePath()
      s.holes.push(new THREE.Path(poolShape(style, 0.4).getPoints(96)))
    }
    const g = new THREE.ShapeGeometry(s, 64)
    // planar UVs in metres so slabs keep their real size
    const pos = g.attributes.position!
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / 4.8; uv[i * 2 + 1] = pos.getY(i) / 2.4 }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    return g
  }, [style, infinity])
  tiles.repeat.set(1, 1)

  const lawnGeo = useMemo(() => {
    const W = 70, w = 13, f = -8, b = infinity ? 2.3 : 7.5
    const s = new THREE.Shape()
    if (infinity) {
      s.moveTo(-W, -W); s.lineTo(W, -W); s.lineTo(W, b); s.lineTo(w, b); s.lineTo(w, f); s.lineTo(-w, f); s.lineTo(-w, b); s.lineTo(-W, b); s.closePath()
    } else {
      s.moveTo(-W, -W); s.lineTo(W, -W); s.lineTo(W, W); s.lineTo(-W, W); s.closePath()
      const h = new THREE.Path(); h.moveTo(-w, f); h.lineTo(w, f); h.lineTo(w, b); h.lineTo(-w, b); h.closePath(); s.holes.push(h)
    }
    const g = new THREE.ShapeGeometry(s)
    const pos = g.attributes.position!
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / 10; uv[i * 2 + 1] = pos.getY(i) / 10 }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    return g
  }, [infinity])
  lawn.repeat.set(1, 1)

  const dusk = light === 'dusk'
  return (
    <>
      <mesh geometry={deckGeo} rotation={flat} receiveShadow>
        <meshStandardMaterial map={tiles} color={dusk ? '#8a8d96' : '#ffffff'} roughness={0.8} />
      </mesh>
      <mesh geometry={lawnGeo} rotation={flat} position={[0, -0.02, 0]} receiveShadow>
        <meshStandardMaterial map={lawn} color={dusk ? '#55605a' : '#ffffff'} roughness={1} />
      </mesh>
      {infinity && (
        <>
          <mesh rotation={flat} position={[0, -2.2, -40]} receiveShadow>
            <planeGeometry args={[200, 76]} />
            <meshStandardMaterial map={lawn} color={dusk ? '#3c4a45' : '#d8e6c8'} roughness={1} />
          </mesh>
          {/* distant hills */}
          {[[-40, -95, 30], [10, -110, 38], [55, -90, 26], [-80, -120, 34]].map(([x, z, r], i) => (
            <mesh key={i} position={[x, -2.2, z]} scale={[1.6, 0.32, 1]}>
              <sphereGeometry args={[r, 32, 16]} />
              <meshStandardMaterial color={dusk ? '#283548' : '#7f9a86'} roughness={1} />
            </mesh>
          ))}
        </>
      )}
    </>
  )
}

function Villa({ dusk }: { dusk: boolean }) {
  const timber = useTimber()
  const glass = (
    <meshPhysicalMaterial
      color={dusk ? '#2a2016' : '#5d7487'}
      emissive={dusk ? '#ffbe73' : '#000000'}
      emissiveIntensity={dusk ? 0.85 : 0}
      roughness={0.06}
      metalness={0.5}
      envMapIntensity={1.4}
      clearcoat={1}
    />
  )
  const white = <meshStandardMaterial color={dusk ? '#c9ccd4' : '#f6f4ef'} roughness={0.85} />
  return (
    <group position={[0, 0, -11]}>
      {/* ground floor */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow><boxGeometry args={[18, 3.2, 6]} />{white}</mesh>
      {/* full-height glazing */}
      {[-6, -2, 2].map((x) => (
        <mesh key={x} position={[x, 1.55, 3.02]}><planeGeometry args={[3.7, 2.8]} />{glass}</mesh>
      ))}
      {[-7.9, -4, 0, 4].map((x) => (
        <mesh key={`f${x}`} position={[x, 1.55, 3.04]}><boxGeometry args={[0.08, 2.8, 0.06]} /><meshStandardMaterial color="#2b2f35" /></mesh>
      ))}
      {/* timber clad block */}
      <mesh position={[6.5, 1.6, 3.03]}><planeGeometry args={[4.6, 3.2]} /><meshStandardMaterial map={timber} roughness={0.8} color={dusk ? '#8d8070' : '#ffffff'} /></mesh>
      {/* first floor, cantilevered */}
      <mesh position={[-2.5, 4.8, 0.8]} castShadow receiveShadow><boxGeometry args={[12, 3.1, 7.6]} />{white}</mesh>
      <mesh position={[-2.5, 4.75, 4.62]}><planeGeometry args={[9.5, 1.9]} />{glass}</mesh>
      {/* roof slabs */}
      <mesh position={[-2.5, 6.42, 1]} castShadow><boxGeometry args={[12.8, 0.18, 8.6]} /><meshStandardMaterial color="#2a2e34" roughness={0.6} /></mesh>
      <mesh position={[6, 3.28, 0.6]} castShadow><boxGeometry args={[6.6, 0.16, 7.4]} /><meshStandardMaterial color="#2a2e34" roughness={0.6} /></mesh>
      {dusk && <pointLight position={[-2, 2, 5]} color="#ffbb70" intensity={10} distance={14} decay={1.6} />}
    </group>
  )
}

function Planting({ dusk, style }: { dusk: boolean; style: Style }) {
  const leaf = dusk ? '#2c3a2c' : '#5d7347'
  const dark = dusk ? '#1e2a22' : '#36502e'
  const olive = (x: number, z: number, s = 1) => (
    <group key={`o${x}${z}`} position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.09, 0.14, 1.8, 8]} /><meshStandardMaterial color="#5b4a3a" /></mesh>
      {[[0, 2.1, 0, 0.9], [0.5, 1.9, 0.2, 0.7], [-0.45, 2.0, -0.2, 0.75], [0.1, 2.5, -0.1, 0.65]].map(([a, b, c, r], i) => (
        <mesh key={i} position={[a!, b!, c!]} castShadow><icosahedronGeometry args={[r!, 1]} /><meshStandardMaterial color={leaf} roughness={0.95} flatShading /></mesh>
      ))}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.5, 1.1]} /><meshStandardMaterial color="#3b3f45" roughness={0.6} /></mesh>
    </group>
  )
  const cypress = (x: number, z: number, h = 5) => (
    <mesh key={`c${x}${z}`} position={[x, h / 2, z]} castShadow><capsuleGeometry args={[0.45, h - 0.9, 6, 12]} /><meshStandardMaterial color={dark} roughness={1} /></mesh>
  )
  const hedge = (x: number, z: number, len: number, rot = 0) => (
    <RoundedBox key={`h${x}${z}`} args={[len, 0.8, 0.7]} radius={0.3} position={[x, 0.4, z]} rotation={[0, rot, 0]} castShadow>
      <meshStandardMaterial color={dark} roughness={1} />
    </RoundedBox>
  )
  if (style === 'infinity')
    return <>{olive(-9, 1, 1.1)}{olive(9.5, -0.5)}{cypress(-12, 0, 5.5)}{cypress(12.2, 1, 6)}</>
  return (
    <>
      {olive(-10, -5)}{olive(10, 4.5, 0.9)}{olive(-10.5, 5)}
      {cypress(-13.5, -7)}{cypress(13.5, -7, 6)}{cypress(-15, 3, 5.5)}{cypress(15, 2)}
      {hedge(-8, 7.2, 8)}{hedge(8, 7.2, 8)}{hedge(-12.6, 0, 12, Math.PI / 2)}{hedge(12.6, 0, 12, Math.PI / 2)}
    </>
  )
}

function Loungers({ style, dusk }: { style: Style; dusk: boolean }) {
  const fabric = dusk ? '#9a978f' : '#f3efe6'
  const z = style === 'lap' ? 3.2 : style === 'plunge' ? 3 : 4.2
  const xs = style === 'plunge' ? [-1.2, 1.2] : style === 'infinity' ? [-3.5, -2, 3, 4.5] : [-3, -1.6, 2.4]
  return (
    <>
      {xs.map((x) => (
        <group key={x} position={[x, 0.05, z + 1]}>
          <mesh position={[0, 0.28, 0.1]} castShadow><boxGeometry args={[0.72, 0.12, 1.9]} /><meshStandardMaterial color={fabric} roughness={0.95} /></mesh>
          <mesh position={[0, 0.55, -0.85]} rotation={[0.85, 0, 0]} castShadow><boxGeometry args={[0.72, 0.1, 0.72]} /><meshStandardMaterial color={fabric} roughness={0.95} /></mesh>
          <mesh position={[0, 0.12, 0.1]} castShadow><boxGeometry args={[0.6, 0.22, 1.7]} /><meshStandardMaterial color="#2c2f34" /></mesh>
        </group>
      ))}
      {style !== 'plunge' && (
        <group position={[0.4, 0, z + 1.3]}>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.03, 0.03, 2.4]} /><meshStandardMaterial color="#cfc7b8" /></mesh>
          <mesh position={[0, 2.35, 0]} castShadow><coneGeometry args={[1.5, 0.45, 8, 1, true]} /><meshStandardMaterial color={dusk ? '#8d877d' : '#ece4d4'} side={THREE.DoubleSide} roughness={1} /></mesh>
        </group>
      )}
    </>
  )
}

function DuskSky() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 512
    const g = c.getContext('2d')!
    const grad = g.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, '#0b1230')
    grad.addColorStop(0.45, '#26386a')
    grad.addColorStop(0.62, '#6a6f9a')
    grad.addColorStop(0.72, '#d49a7c')
    grad.addColorStop(1, '#2a2d3a')
    g.fillStyle = grad
    g.fillRect(0, 0, 4, 512)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return <primitive attach="background" object={tex} />
}

function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree()
  camera.lookAt(...target)
  return null
}

export default function RenderStudio() {
  const id = new URLSearchParams(location.search).get('shot') ?? 'hero'
  const shot = SHOTS[id] ?? SHOTS.hero!
  const L = LIGHT[shot.light]
  const house = shot.house ?? false
  const sunDir = new THREE.Vector3(...L.sun).normalize()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={1}
        camera={{ position: shot.cam, fov: shot.fov ?? 45, near: 0.1, far: 400 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMappingExposure: L.exposure }}
      >
        <CameraRig target={shot.target} />
        {L.dusk ? <DuskSky /> : <Sky sunPosition={sunDir.toArray()} turbidity={shot.light === 'golden' ? 6 : 3} rayleigh={shot.light === 'golden' ? 2.5 : 0.8} mieCoefficient={0.006} mieDirectionalG={0.85} distance={4000} />}
        <fog attach="fog" args={[L.fog, 60, 220]} />
        <ambientLight intensity={L.amb} />
        <hemisphereLight args={[L.dusk ? '#4a5c88' : '#dbeeff', L.dusk ? '#1a1f18' : '#5a6b48', L.dusk ? 0.35 : 0.6]} />
        <directionalLight
          position={L.sun}
          color={L.sunColor}
          intensity={L.sunI}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0004}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-far={120}
        />
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={L.dusk ? 0.6 : 2} position={[0, 8, 10]} scale={[30, 8, 1]} color={L.dusk ? '#5a6a99' : '#ffffff'} />
          <Lightformer intensity={L.dusk ? 0.3 : 1.2} position={[-12, 4, -6]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} color={shot.light === 'golden' ? '#ffcf9a' : '#dfeaff'} />
          <Lightformer intensity={0.6} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} color={L.dusk ? '#1a2030' : '#9fb38a'} />
        </Environment>

        <Deck style={shot.style} light={shot.light} />
        <Pool style={shot.style} water={shot.water} light={shot.light} seed={shot.seed ?? id.length + id.charCodeAt(id.length - 1)} />
        {house && shot.style !== 'infinity' && <Villa dusk={L.dusk} />}
        <Planting dusk={L.dusk} style={shot.style} />
        <Loungers style={shot.style} dusk={L.dusk} />
      </Canvas>
    </div>
  )
}
