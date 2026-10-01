import type Phaser from 'phaser'

const WHITE_FILL = 248
const WHITE_FRINGE = 232

export type PunchMode = 'white' | 'studio'

export function isNearWhite(r: number, g: number, b: number, min: number): boolean {
  return r >= min && g >= min && b >= min
}

function isDarkStudio(r: number, g: number, b: number): boolean {
  const luma = (r + g + b) / 3
  return luma < 56 && b + 14 >= r && b + 14 >= g
}

export function isBackdropPixel(r: number, g: number, b: number, a: number, mode: PunchMode = 'white'): boolean {
  if (a < 16) {
    return true
  }
  if (mode === 'studio') {
    return isDarkStudio(r, g, b)
  }
  return isNearWhite(r, g, b, WHITE_FILL)
}

function lumaOf(r: number, g: number, b: number): number {
  return (r + g + b) / 3
}

function isCharacterCore(r: number, g: number, b: number, a: number, mode: PunchMode = 'white'): boolean {
  if (a < 16) {
    return false
  }
  if (mode === 'studio' && isDarkStudio(r, g, b)) {
    return false
  }
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return lumaOf(r, g, b) < 205 || (max - min) > 28
}

export function punchBackdrop(data: Uint8ClampedArray, width: number, height: number, mode: PunchMode = 'white'): boolean {
  if (width < 2 || height < 2) {
    return false
  }

  const visited = new Uint8Array(width * height)
  const stack: number[] = []

  const adjacentToCore = (x: number, y: number): boolean => {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue
      }
      const o = (ny * width + nx) * 4
      if (isCharacterCore(data[o] ?? 0, data[o + 1] ?? 0, data[o + 2] ?? 0, data[o + 3] ?? 0, mode)) {
        return true
      }
    }
    return false
  }

  const consider = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return
    }
    const i = y * width + x
    if (visited[i] === 1) {
      return
    }
    visited[i] = 1
    const o = i * 4
    const r = data[o] ?? 0
    const g = data[o + 1] ?? 0
    const b = data[o + 2] ?? 0
    const a = data[o + 3] ?? 0
    if (!isBackdropPixel(r, g, b, a, mode)) {
      return
    }
    if (adjacentToCore(x, y)) {
      data[o] = 0
      data[o + 1] = 0
      data[o + 2] = 0
      data[o + 3] = 0
      return
    }
    stack.push(i)
  }

  for (let x = 0; x < width; x += 1) {
    consider(x, 0)
    consider(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    consider(0, y)
    consider(width - 1, y)
  }

  while (stack.length > 0) {
    const i = stack.pop() ?? 0
    const o = i * 4
    data[o] = 0
    data[o + 1] = 0
    data[o + 2] = 0
    data[o + 3] = 0
    const x = i % width
    const y = (i / width) | 0
    consider(x + 1, y)
    consider(x - 1, y)
    consider(x, y + 1)
    consider(x, y - 1)
  }

  if (mode === 'white') {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4
        const a = data[o + 3] ?? 0
        if (a === 0) {
          continue
        }
        const r = data[o] ?? 0
        const g = data[o + 1] ?? 0
        const b = data[o + 2] ?? 0
        if (!isNearWhite(r, g, b, WHITE_FRINGE)) {
          continue
        }
        const up = y > 0 && (data[((y - 1) * width + x) * 4 + 3] ?? 0) >= 16
        const down = y < height - 1 && (data[((y + 1) * width + x) * 4 + 3] ?? 0) >= 16
        const left = x > 0 && (data[(y * width + x - 1) * 4 + 3] ?? 0) >= 16
        const right = x < width - 1 && (data[(y * width + x + 1) * 4 + 3] ?? 0) >= 16
        if ((up && down) || (left && right)) {
          continue
        }
        const transparentNeighbor = !up || !down || !left || !right
          || x === 0 || y === 0 || x === width - 1 || y === height - 1
        if (transparentNeighbor && (!up || !down) && (!left || !right)) {
          data[o] = 0
          data[o + 1] = 0
          data[o + 2] = 0
          data[o + 3] = 0
        }
      }
    }
    defringeHalo(data, width, height, 205, 1)
    defringeGreyCrust(data, width, height, 1)
  }

  return true
}

/** Retire le halo blanc d'anti-aliasing colle au contour, sans manger les vetements clairs a l'interieur. */
export function defringeHalo(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minWhite = 188,
  passes = 3,
): void {
  const alphaAt = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return 0
    }
    return data[(y * width + x) * 4 + 3] ?? 0
  }
  for (let pass = 0; pass < passes; pass += 1) {
    const kill: number[] = []
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4
        const a = data[o + 3] ?? 0
        if (a < 16) {
          continue
        }
        const r = data[o] ?? 0
        const g = data[o + 1] ?? 0
        const b = data[o + 2] ?? 0
        const pale = r >= minWhite && g >= minWhite && b >= minWhite
        const bright = (r + g + b) / 3 >= minWhite + 16
        if (!pale && !bright) {
          continue
        }
        const open =
          alphaAt(x - 1, y) < 16
          || alphaAt(x + 1, y) < 16
          || alphaAt(x, y - 1) < 16
          || alphaAt(x, y + 1) < 16
          || alphaAt(x - 1, y - 1) < 16
          || alphaAt(x + 1, y - 1) < 16
          || alphaAt(x - 1, y + 1) < 16
          || alphaAt(x + 1, y + 1) < 16
        const up = alphaAt(x, y - 1) >= 16
        const down = alphaAt(x, y + 1) >= 16
        const left = alphaAt(x - 1, y) >= 16
        const right = alphaAt(x + 1, y) >= 16
        if ((up && down) || (left && right)) {
          continue
        }
        if (open || a < 96) {
          kill.push(o)
        }
      }
    }
    for (const o of kill) {
      data[o] = 0
      data[o + 1] = 0
      data[o + 2] = 0
      data[o + 3] = 0
    }
  }
}

/** Liseré gris d'anti-alias (fond blanc) : sat basse + valeur moyenne, uniquement au contour. */
export function defringeGreyCrust(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  passes = 2,
): void {
  const alphaAt = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return 0
    }
    return data[(y * width + x) * 4 + 3] ?? 0
  }
  const neighborLuma = (x: number, y: number): number => {
    const o = (y * width + x) * 4
    return ((data[o] ?? 0) + (data[o + 1] ?? 0) + (data[o + 2] ?? 0)) / 3
  }
  const isGreyHalo = (r: number, g: number, b: number): boolean => {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max < 105) {
      return false
    }
    return (max - min) <= max * 0.22
  }
  for (let pass = 0; pass < passes; pass += 1) {
    const kill: number[] = []
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4
        const a = data[o + 3] ?? 0
        if (a < 16) {
          continue
        }
        const r = data[o] ?? 0
        const g = data[o + 1] ?? 0
        const b = data[o + 2] ?? 0
        if (!isGreyHalo(r, g, b)) {
          continue
        }
        const luma = (r + g + b) / 3
        const open =
          alphaAt(x - 1, y) < 16
          || alphaAt(x + 1, y) < 16
          || alphaAt(x, y - 1) < 16
          || alphaAt(x, y + 1) < 16
        if (!open) {
          continue
        }
        const darkerInside =
          (x > 0 && alphaAt(x - 1, y) >= 16 && neighborLuma(x - 1, y) < luma - 24)
          || (x < width - 1 && alphaAt(x + 1, y) >= 16 && neighborLuma(x + 1, y) < luma - 24)
          || (y > 0 && alphaAt(x, y - 1) >= 16 && neighborLuma(x, y - 1) < luma - 24)
          || (y < height - 1 && alphaAt(x, y + 1) >= 16 && neighborLuma(x, y + 1) < luma - 24)
        if (darkerInside) {
          kill.push(o)
        }
      }
    }
    for (const o of kill) {
      data[o] = 0
      data[o + 1] = 0
      data[o + 2] = 0
      data[o + 3] = 0
    }
  }
}

/** Remplace le liseré blanc par la couleur du trait voisin, sans ronger le volume. */
export function despillWhiteMatte(data: Uint8ClampedArray, width: number, height: number): void {
  const src = new Uint8ClampedArray(data)
  const at = (x: number, y: number): number => (y * width + x) * 4
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = at(x, y)
      const a = src[o + 3] ?? 0
      if (a < 16) {
        continue
      }
      const r = src[o] ?? 0
      const g = src[o + 1] ?? 0
      const b = src[o + 2] ?? 0
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const luma = (r + g + b) / 3
      const lowSat = (max - min) <= Math.max(18, max * 0.2)
      if (!lowSat || luma < 120) {
        continue
      }
      let open = false
      let best = -1
      let bestLuma = luma
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          open = true
          continue
        }
        const n = at(nx, ny)
        const na = src[n + 3] ?? 0
        if (na < 16) {
          open = true
          continue
        }
        const nluma = ((src[n] ?? 0) + (src[n + 1] ?? 0) + (src[n + 2] ?? 0)) / 3
        if (nluma < bestLuma - 16) {
          bestLuma = nluma
          best = n
        }
      }
      if (!open) {
        continue
      }
      if (best >= 0) {
        data[o] = src[best] ?? 0
        data[o + 1] = src[best + 1] ?? 0
        data[o + 2] = src[best + 2] ?? 0
      } else if (luma >= 176) {
        data[o] = 0
        data[o + 1] = 0
        data[o + 2] = 0
        data[o + 3] = 0
      }
    }
  }
}

function alreadyTransparent(data: Uint8ClampedArray, width: number, height: number): boolean {
  if (width < 2 || height < 2) {
    return false
  }
  const corners = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + (width - 1)) * 4]
  return corners.every((offset) => (data[offset + 3] ?? 0) < 16)
}

export function canvasFromPunchedImage(
  img: HTMLImageElement | HTMLCanvasElement,
  mode: PunchMode = 'white',
): HTMLCanvasElement {
  const width = img instanceof HTMLImageElement ? (img.naturalWidth || img.width) : img.width
  const height = img instanceof HTMLImageElement ? (img.naturalHeight || img.height) : img.height
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
  if (!ctx) {
    return canvas
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  if (alreadyTransparent(image.data, canvas.width, canvas.height)) {
    return canvas
  }
  punchBackdrop(image.data, canvas.width, canvas.height, mode)
  ctx.putImageData(image, 0, 0)
  const box = alphaBounds(image.data, canvas.width, canvas.height, 4)
  if (!box || box.w < 2 || box.h < 2) {
    return canvas
  }
  const cropped = document.createElement('canvas')
  cropped.width = box.w
  cropped.height = box.h
  const cut = cropped.getContext('2d', { alpha: true })
  if (!cut) {
    return canvas
  }
  cut.clearRect(0, 0, box.w, box.h)
  cut.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h)
  return cropped
}

export async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`sprite load failed: ${url}`))
    img.src = url
  })
}

export function addPunchedTexture(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key)
  }
  const texture = scene.textures.addCanvas(key, canvas)
  if (texture && typeof texture.refresh === 'function') {
    texture.refresh()
  }
}

export interface AlphaBox {
  x: number
  y: number
  w: number
  h: number
}

export function alphaBounds(data: Uint8ClampedArray, width: number, height: number, pad = 8): AlphaBox | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3] ?? 0
      if (a < 16) {
        continue
      }
      if (x < minX) {
        minX = x
      }
      if (y < minY) {
        minY = y
      }
      if (x > maxX) {
        maxX = x
      }
      if (y > maxY) {
        maxY = y
      }
    }
  }
  if (maxX < 0) {
    return null
  }
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

function unionBox(a: AlphaBox, b: AlphaBox): AlphaBox {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const right = Math.max(a.x + a.w, b.x + b.w)
  const bottom = Math.max(a.y + a.h, b.y + b.h)
  return { x, y, w: right - x, h: bottom - y }
}

function textureToCanvas(scene: Phaser.Scene, key: string): HTMLCanvasElement | null {
  if (!scene.textures.exists(key)) {
    return null
  }
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement
  if (!src || typeof src.width !== 'number') {
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = src.width
  canvas.height = src.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return null
  }
  ctx.drawImage(src, 0, 0)
  return canvas
}

export function punchAndUnifyClip(scene: Phaser.Scene, keys: string[]): void {
  const canvases: HTMLCanvasElement[] = []
  for (const key of keys) {
    const canvas = textureToCanvas(scene, key)
    if (!canvas) {
      continue
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      continue
    }
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    punchBackdrop(image.data, canvas.width, canvas.height)
    ctx.putImageData(image, 0, 0)
    canvases.push(canvas)
  }
  if (canvases.length === 0 || canvases.length !== keys.length) {
    return
  }
  let box: AlphaBox | null = null
  for (const canvas of canvases) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      continue
    }
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const next = alphaBounds(image.data, canvas.width, canvas.height)
    if (!next) {
      continue
    }
    box = box ? unionBox(box, next) : next
  }
  if (!box) {
    keys.forEach((key, index) => {
      const src = canvases[index]
      if (!src) {
        return
      }
      if (scene.textures.exists(key)) {
        scene.textures.remove(key)
      }
      scene.textures.addCanvas(key, src)
    })
    return
  }
  keys.forEach((key, index) => {
    const src = canvases[index]
    if (!src) {
      return
    }
    const cropped = document.createElement('canvas')
    cropped.width = box.w
    cropped.height = box.h
    const ctx = cropped.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.drawImage(src, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h)
    if (scene.textures.exists(key)) {
      scene.textures.remove(key)
    }
    scene.textures.addCanvas(key, cropped)
  })
}

export function packTexturesToSheet(scene: Phaser.Scene, frameKeys: string[], sheetKey: string): boolean {
  if (frameKeys.length === 0) {
    return false
  }
  const canvases: HTMLCanvasElement[] = []
  for (const key of frameKeys) {
    const canvas = textureToCanvas(scene, key)
    if (!canvas) {
      return false
    }
    canvases.push(canvas)
  }
  const frameW = canvases[0]?.width ?? 0
  const frameH = canvases[0]?.height ?? 0
  if (frameW < 1 || frameH < 1) {
    return false
  }
  const cols = Math.min(4, canvases.length)
  const rows = Math.ceil(canvases.length / cols)
  const sheet = document.createElement('canvas')
  sheet.width = cols * frameW
  sheet.height = rows * frameH
  const ctx = sheet.getContext('2d')
  if (!ctx) {
    return false
  }
  canvases.forEach((frame, index) => {
    const x = (index % cols) * frameW
    const y = Math.floor(index / cols) * frameH
    ctx.drawImage(frame, x, y)
  })
  if (scene.textures.exists(sheetKey)) {
    scene.textures.remove(sheetKey)
  }
  const texture = scene.textures.addCanvas(sheetKey, sheet)
  if (!texture) {
    return false
  }
  canvases.forEach((_, index) => {
    const x = (index % cols) * frameW
    const y = Math.floor(index / cols) * frameH
    if (texture.has(String(index))) {
      texture.remove(String(index))
    }
    texture.add(String(index), 0, x, y, frameW, frameH)
  })
  return true
}


