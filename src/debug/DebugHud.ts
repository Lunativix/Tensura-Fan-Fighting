import type Phaser from 'phaser'
import { session } from '../game/GameState.ts'
import { network } from '../network/NetworkClient.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { currentMissingLine, missingSummaryLines } from '../combat/anim/missingLog.ts'
import { artProgressCounts, skillArtBriefs } from '../combat/anim/contracts.ts'
import { variantMissingResources } from '../combat/variants/index.ts'

export class DebugHud {
  private readonly root: HTMLDivElement
  private readonly missing: HTMLDivElement
  private readonly preview: HTMLDivElement
  private bound = false

  constructor() {
    this.root = document.createElement('div')
    this.root.id = 'debug-hud'
    this.root.style.cssText = [
      'position:fixed',
      'left:12px',
      'top:12px',
      'z-index:20',
      'padding:10px 12px',
      'font:12px/1.4 ui-monospace, Consolas, monospace',
      'color:#d7e8ff',
      'background:rgba(6,10,20,0.72)',
      'border:1px solid rgba(120,170,255,0.35)',
      'pointer-events:none',
      'display:none',
      'white-space:pre',
    ].join(';')
    this.missing = document.createElement('div')
    this.missing.id = 'skill-anim-missing'
    this.missing.style.cssText = [
      'position:fixed',
      'left:12px',
      'bottom:12px',
      'z-index:21',
      'padding:10px 12px',
      'font:12px/1.45 ui-monospace, Consolas, monospace',
      'color:#ffe082',
      'background:rgba(40,12,8,0.88)',
      'border:1px solid rgba(255,180,80,0.55)',
      'pointer-events:none',
      'display:none',
      'white-space:pre',
      'max-width:480px',
    ].join(';')
    this.preview = document.createElement('div')
    this.preview.id = 'anim-preview'
    this.preview.style.cssText = [
      'position:fixed',
      'right:12px',
      'top:12px',
      'z-index:22',
      'padding:10px 12px',
      'font:11px/1.4 ui-monospace, Consolas, monospace',
      'color:#d7e8ff',
      'background:rgba(6,10,20,0.84)',
      'border:1px solid rgba(120,170,255,0.35)',
      'pointer-events:none',
      'display:none',
      'white-space:pre',
      'max-width:420px',
      'max-height:70vh',
      'overflow:hidden',
    ].join(';')
  }

  attach(): void {
    if (!this.root.parentElement) {
      document.body.appendChild(this.root)
    }
    if (!this.missing.parentElement) {
      document.body.appendChild(this.missing)
    }
    if (!this.preview.parentElement) {
      document.body.appendChild(this.preview)
    }
    if (!this.bound) {
      this.bound = true
      window.addEventListener('keydown', (event) => {
        if (event.code === 'F3' && event.shiftKey) {
          session.animPreview = !session.animPreview
          event.preventDefault()
          return
        }
        if (event.code === 'F3') {
          session.debugVisible = !session.debugVisible
          event.preventDefault()
        }
        if (event.code === 'F4') {
          session.showHitboxes = !session.showHitboxes
          event.preventDefault()
        }
        if (!event.shiftKey) {
          return
        }
        if (event.code === 'F5') {
          session.debugProjectiles = !session.debugProjectiles
          event.preventDefault()
        }
        if (event.code === 'F6') {
          session.debugVfx = !session.debugVfx
          event.preventDefault()
        }
        if (event.code === 'F7') {
          session.debugSfx = !session.debugSfx
          event.preventDefault()
        }
        if (event.code === 'F8') {
          session.debugCamera = !session.debugCamera
          event.preventDefault()
        }
      })
    }
  }

  update(game: Phaser.Game): void {
    this.root.style.display = session.debugVisible ? 'block' : 'none'
    this.preview.style.display = session.animPreview ? 'block' : 'none'
    const miss = currentMissingLine()
    this.missing.style.display = miss ? 'block' : 'none'
    if (miss) {
      this.missing.textContent = miss
    }
    if (session.animPreview) {
      const progress = artProgressCounts()
      const briefs = skillArtBriefs()
      const lines = [
        'ANIM PREVIEW  Shift+F3 close',
        `SKILLS ${progress.skillsComplete} / ${progress.skillsTotal} ART COMPLETE`,
        `NORMALS ${progress.normalsComplete} / ${progress.normalsTotal} ART COMPLETE`,
        `ULTIMATES ${progress.ultimatesComplete} / ${progress.ultimatesTotal} ART COMPLETE`,
        'DONE is never auto. Drop 001.png then npm run index-sprites.',
        'PLAY/PAUSE: F7   STEP: F8   HITBOX: F4',
        '',
      ]
      for (const brief of briefs.slice(0, 16)) {
        lines.push(`${brief.character}  ${brief.skill}  ${brief.id}`)
      }
      lines.push('…')
      this.preview.textContent = lines.join('\n')
    }
    if (!session.debugVisible) {
      return
    }
    const loop = game.loop
    const fps = loop.actualFps.toFixed(0)
    const ms = loop.delta.toFixed(1)
    const sceneNames = game.scene.getScenes(true).map((s) => s.sys.settings.key).join(', ')
    const feel = session.combatFeel
    const missingList = missingSummaryLines()
    const progress = artProgressCounts()
    this.root.textContent = [
      `FPS ${fps}   frame ${ms}ms`,
      `flow ${session.flow}`,
      `scenes ${sceneNames}`,
      `paused ${session.paused}  hidden ${session.hidden}`,
      `hitboxes ${session.showHitboxes}  framePause ${session.framePause}`,
      `ART skills ${progress.skillsComplete}/${progress.skillsTotal}  normals ${progress.normalsComplete}/${progress.normalsTotal}  ults ${progress.ultimatesComplete}/${progress.ultimatesTotal}`,
      `VARIANT ${session.variantMode}  period ${session.chronologyMissionId}`,
      session.playerLoadouts[0]
        ? `P1 ${session.playerLoadouts.map((item) => `${item.fighterId}/${item.variantId}/${item.movesetId}`).join('  ')}`
        : '',
      feel
        ? `P ${feel.pState}/${feel.pPhase}  CPU ${feel.cState}/${feel.cPhase}`
        : 'combat —',
      feel ? `hitStop ${feel.hitStopMs.toFixed(0)}ms  finisher ${feel.finisher}` : '',
      ...(feel?.pSkill.length ? ['P skill', ...feel.pSkill] : []),
      ...(feel?.cSkill.length ? ['CPU skill', ...feel.cSkill] : []),
      `F3 debug  Shift+F3 preview  F4 hitboxes  F7 pause  F8 step`,
      `Shift+F5 projectiles ${session.debugProjectiles}  Shift+F6 VFX ${session.debugVfx}  Shift+F7 SFX ${session.debugSfx}  Shift+F8 camera ${session.debugCamera}`,
      ...(session.debugProjectiles && feel ? [`PROJECTILES ${feel.projectiles}`] : []),
      ...(session.debugVfx && feel?.pSkill.length ? ['VFX layer', ...feel.pSkill.filter((line) => line.includes('VFX'))] : []),
      ...(session.debugSfx && feel?.pSkill.length ? ['SFX layer', ...feel.pSkill.filter((line) => line.includes('SFX'))] : []),
      ...(session.debugCamera && feel?.pSkill.length ? ['CAMERA layer', ...feel.pSkill.filter((line) => line.includes('CAMERA'))] : []),
      `net ${network.state}`,
      musicManager.debugLine(),
      missingList.length > 0 ? `missing clips ${missingList.length}` : 'skill clips: none missing this session',
      ...missingList.slice(0, 8),
      ...variantMissingResources().filter((row) => row.missing.some((item) => item.includes('animation'))).slice(0, 4).map((row) => `${row.variantId}: ${row.missing[0]}`),
    ].filter(Boolean).join('\n')
  }
}

export const debugHud = new DebugHud()
