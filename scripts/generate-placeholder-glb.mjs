import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = join(root, 'public', 'models')

const CHARACTERS = [
  ['rimuru', [0.31, 0.76, 0.97]],
  ['milim', [1, 0.42, 0.62]],
  ['diablo', [0.42, 0.11, 0.6]],
  ['benimaru', [1, 0.34, 0.13]],
  ['shion', [0.49, 0.34, 0.76]],
  ['veldora', [0.15, 0.78, 0.85]],
  ['hinata', [0.93, 0.25, 0.48]],
  ['guy', [0.94, 0.33, 0.31]],
  ['shuna', [0.97, 0.73, 0.82]],
  ['souei', [0.27, 0.35, 0.39]],
  ['hakurou', [0.69, 0.75, 0.77]],
]

function pad4(n) {
  return (n + 3) & ~3
}

function boxMesh() {
  const hx = 0.28
  const hy = 0.8
  const hz = 0.18
  const positions = new Float32Array([
    -hx, 0, -hz, hx, 0, -hz, hx, hy * 2, -hz, -hx, hy * 2, -hz,
    -hx, 0, hz, hx, 0, hz, hx, hy * 2, hz, -hx, hy * 2, hz,
  ])
  const normals = new Float32Array([
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ])
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 3, 7, 0, 7, 4,
    1, 5, 6, 1, 6, 2,
    3, 2, 6, 3, 6, 7,
    0, 4, 5, 0, 5, 1,
  ])
  const head = new Float32Array([
    -0.16, hy * 2, -0.16, 0.16, hy * 2, -0.16, 0.16, hy * 2 + 0.36, -0.16, -0.16, hy * 2 + 0.36, -0.16,
    -0.16, hy * 2, 0.16, 0.16, hy * 2, 0.16, 0.16, hy * 2 + 0.36, 0.16, -0.16, hy * 2 + 0.36, 0.16,
  ])
  const headN = new Float32Array(24)
  for (let i = 0; i < 8; i += 1) {
    headN[i * 3 + 1] = 1
  }
  const headI = new Uint16Array([
    8, 9, 10, 8, 10, 11,
    12, 14, 13, 12, 15, 14,
    8, 11, 15, 8, 15, 12,
    9, 13, 14, 9, 14, 10,
    11, 10, 14, 11, 14, 15,
    8, 12, 13, 8, 13, 9,
  ])
  const pos = new Float32Array(positions.length + head.length)
  pos.set(positions)
  pos.set(head, positions.length)
  const nrm = new Float32Array(normals.length + headN.length)
  nrm.set(normals)
  nrm.set(headN, normals.length)
  const idx = new Uint16Array(indices.length + headI.length)
  idx.set(indices)
  idx.set(headI, indices.length)
  return { pos, nrm, idx }
}

function buildGlb(color) {
  const { pos, nrm, idx } = boxMesh()
  const posBytes = Buffer.from(pos.buffer)
  const nrmBytes = Buffer.from(nrm.buffer)
  const idxPad = Buffer.alloc(pad4(idx.byteLength))
  Buffer.from(idx.buffer).copy(idxPad)
  const bin = Buffer.concat([posBytes, nrmBytes, idxPad])
  const nrmOffset = posBytes.length
  const idxOffset = nrmOffset + nrmBytes.length
  const json = {
    asset: { version: '2.0', generator: 'tensura-fan-placeholder' },
    scene: 0,
    scenes: [{ nodes: [0], name: 'FightReady' }],
    nodes: [{ mesh: 0, name: 'Root' }],
    meshes: [{
      name: 'Body',
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
      }],
    }],
    materials: [{
      name: 'Body',
      pbrMetallicRoughness: {
        baseColorFactor: [...color, 1],
        metallicFactor: 0.08,
        roughnessFactor: 0.48,
      },
      extras: { slot: 'Body' },
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: pos.length / 3, type: 'VEC3', min: [-0.28, 0, -0.18], max: [0.28, 1.96, 0.18] },
      { bufferView: 1, componentType: 5126, count: nrm.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: idx.length, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes.length, target: 34962 },
      { buffer: 0, byteOffset: nrmOffset, byteLength: nrmBytes.length, target: 34962 },
      { buffer: 0, byteOffset: idxOffset, byteLength: idx.byteLength, target: 34963 },
    ],
    buffers: [{ byteLength: bin.length }],
  }
  let jsonBuf = Buffer.from(JSON.stringify(json))
  const jsonPad = pad4(jsonBuf.length) - jsonBuf.length
  if (jsonPad) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)])
  }
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546C67, 0)
  header.writeUInt32LE(2, 4)
  const jsonChunkHeader = Buffer.alloc(8)
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0)
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4)
  const binChunkHeader = Buffer.alloc(8)
  binChunkHeader.writeUInt32LE(bin.length, 0)
  binChunkHeader.writeUInt32LE(0x004E4942, 4)
  const glb = Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, bin])
  glb.writeUInt32LE(glb.length, 8)
  return glb
}

for (const [id, color] of CHARACTERS) {
  const dir = join(outRoot, id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'lod1.glb'), buildGlb(color))
  writeFileSync(join(dir, 'lod0.glb'), buildGlb(color))
  writeFileSync(join(dir, 'lod2.glb'), buildGlb(color.map((c) => c * 0.85)))
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
    fighterId: id,
    source: 'placeholder',
    format: 'glb',
    lod: { lod1: 'lod1.glb', lod2: 'lod2.glb', lod0: 'lod0.glb' },
    scale: 78,
    yOffset: -66,
    facing: 1,
    skeleton: 'Root',
    materials: ['Body'],
    animations: {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      dash: 'Dash',
      jump: 'Jump',
      fall: 'Fall',
      attack: 'LightAttack',
      skill: 'Skill1',
      hit: 'Hit',
      block: 'Block',
      knockdown: 'Knockdown',
      transform: 'Transform',
      ultimate: 'Ultimate',
      victory: 'Victory',
      defeat: 'Defeat',
    },
    meshy: {
      dropIn: `Replace lod0.glb / lod1.glb with a Meshy export (Y-up, meters, origin at feet). Keep this manifest.`,
    },
  }, null, 2))
}

console.log(`Wrote GLB placeholders to ${outRoot}`)
