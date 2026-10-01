/**
 * Flatten generated magenta-backed frames onto a fixed transparent canvas.
 * Does not recolor the character. Magenta / near-magenta / corner flood → alpha 0.
 * Tiny disconnected islands (generation crumbs) are dropped.
 *
 *   node scripts/flatten-sprite-frames.mjs <srcDir> <dstDir> [size]
 */
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const srcDir = path.resolve(process.argv[2] ?? '')
const dstDir = path.resolve(process.argv[3] ?? '')
const size = Number(process.argv[4] ?? 512)

if (!srcDir || !dstDir || !fs.existsSync(srcDir)) {
  console.error('usage: node scripts/flatten-sprite-frames.mjs <srcDir> <dstDir> [size]')
  process.exit(1)
}

fs.mkdirSync(dstDir, { recursive: true })

function isChroma(r, g, b, a) {
  if (a < 8) {
    return true
  }
  if (r > 170 && b > 170 && g < 110 && r - g > 50 && b - g > 50) {
    return true
  }
  if (r > 248 && g > 248 && b > 248) {
    return true
  }
  return false
}

function at(data, w, x, y) {
  const i = (y * w + x) * 4
  return [data[i], data[i + 1], data[i + 2], data[i + 3], i]
}

function flattenOne(buf) {
  const src = PNG.sync.read(buf)
  const { width: w, height: h, data } = src
  for (let i = 0; i < data.length; i += 4) {
    if (isChroma(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 0
    }
  }

  const seen = new Uint8Array(w * h)
  const q = []
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
  for (const [sx, sy] of corners) {
    const [r, g, b, a] = at(data, w, sx, sy)
    if (a > 0 && isChroma(r, g, b, a)) {
      q.push([sx, sy])
    }
  }
  while (q.length) {
    const [x, y] = q.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) {
      continue
    }
    const id = y * w + x
    if (seen[id]) {
      continue
    }
    seen[id] = 1
    const [r, g, b, a, i] = at(data, w, x, y)
    if (a === 0) {
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
      continue
    }
    if (!isChroma(r, g, b, a)) {
      continue
    }
    data[i] = 0
    data[i + 1] = 0
    data[i + 2] = 0
    data[i + 3] = 0
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  const labels = new Int32Array(w * h).fill(-1)
  let label = 0
  const sizes = []
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const id = y * w + x
      if (data[id * 4 + 3] === 0 || labels[id] !== -1) {
        continue
      }
      const stack = [[x, y]]
      labels[id] = label
      let count = 0
      while (stack.length) {
        const [cx, cy] = stack.pop()
        count += 1
        const nbs = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]
        for (const [nx, ny] of nbs) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
            continue
          }
          const nid = ny * w + nx
          if (labels[nid] !== -1 || data[nid * 4 + 3] === 0) {
            continue
          }
          labels[nid] = label
          stack.push([nx, ny])
        }
      }
      sizes[label] = count
      label += 1
    }
  }
  const keep = Math.max(400, Math.floor(w * h * 0.01))
  for (let i = 0; i < w * h; i += 1) {
    const lab = labels[i]
    if (lab >= 0 && (sizes[lab] ?? 0) < keep) {
      const p = i * 4
      data[p] = 0
      data[p + 1] = 0
      data[p + 2] = 0
      data[p + 3] = 0
    }
  }

  return PNG.sync.write(src)
}

const files = fs.readdirSync(srcDir).filter((name) => name.toLowerCase().endsWith('.png')).sort((a, b) => {
  const na = Number((a.match(/(\d+)\.png$/i) ?? [])[1] ?? 0)
  const nb = Number((b.match(/(\d+)\.png$/i) ?? [])[1] ?? 0)
  return na - nb || a.localeCompare(b)
})
if (files.length === 0) {
  console.error('no png in', srcDir)
  process.exit(1)
}

const keyed = files.map((name) => {
  const buf = flattenOne(fs.readFileSync(path.join(srcDir, name)))
  const png = PNG.sync.read(buf)
  let minX = png.width
  let minY = png.height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  return { name, png, minX, minY, maxX, maxY }
})

let maxW = 1
let maxH = 1
for (const item of keyed) {
  maxW = Math.max(maxW, item.maxX - item.minX + 1)
  maxH = Math.max(maxH, item.maxY - item.minY + 1)
}
const scale = Math.min((size * 0.86) / maxW, (size * 0.90) / maxH)
const ground = size - Math.floor(size * 0.04)

for (const item of keyed) {
  const cw = item.maxX - item.minX + 1
  const ch = item.maxY - item.minY + 1
  const nw = Math.max(1, Math.round(cw * scale))
  const nh = Math.max(1, Math.round(ch * scale))
  const dx = Math.floor((size - nw) / 2)
  const dy = ground - nh
  const out = new PNG({ width: size, height: size })
  out.data.fill(0)
  for (let y = 0; y < nh; y += 1) {
    for (let x = 0; x < nw; x += 1) {
      const sx = item.minX + Math.min(cw - 1, Math.floor(x / scale))
      const sy = item.minY + Math.min(ch - 1, Math.floor(y / scale))
      const si = (sy * item.png.width + sx) * 4
      const di = ((dy + y) * size + (dx + x)) * 4
      out.data[di] = item.png.data[si]
      out.data[di + 1] = item.png.data[si + 1]
      out.data[di + 2] = item.png.data[si + 2]
      out.data[di + 3] = item.png.data[si + 3]
    }
  }
  const outName = item.name.replace(/^rimuru_water_blade_/, '').replace(/^rimuru_/, '')
  const fileName = /^\d+\.png$/i.test(outName)
    ? `${String(Number.parseInt(outName, 10)).padStart(3, '0')}.png`
    : item.name
  fs.writeFileSync(path.join(dstDir, fileName), PNG.sync.write(out))
  console.info(fileName)
}
