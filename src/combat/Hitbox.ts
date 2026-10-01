export interface Hitbox {
  x: number
  y: number
  width: number
  height: number
}

export function hitboxOverlaps(a: Hitbox, b: Hitbox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function makeBox(cx: number, cy: number, facing: number, offsetX: number, offsetY: number, width: number, height: number): Hitbox {
  const x = facing >= 0 ? cx + offsetX : cx - offsetX - width
  return { x, y: cy + offsetY, width, height }
}
