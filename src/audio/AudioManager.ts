import { clamp } from '../gameplay/Resources.ts'
import type { SfxBusId } from './SfxTypes.ts'

type SfxHook = (id: string) => void

export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicDuck: GainNode | null = null
  private sfxBed: GainNode | null = null
  private sfxDuck: GainNode | null = null
  private sfxLead: GainNode | null = null
  private uiGain: GainNode | null = null
  private voiceGain: GainNode | null = null
  private dialogueGain: GainNode | null = null
  private envGain: GainNode | null = null
  private envDuck: GainNode | null = null
  private musicNode: OscillatorNode | null = null
  private musicVolume = 0.35
  private sfxVolume = 0.5
  private unlocked = false
  private sfxHook: SfxHook | null = null

  get volumes(): { music: number; sfx: number } {
    return { music: this.musicVolume, sfx: this.sfxVolume }
  }

  get context(): AudioContext | null {
    return this.ctx
  }

  get musicOut(): GainNode | null {
    return this.musicGain
  }

  bindSfx(hook: SfxHook): void {
    this.sfxHook = hook
  }

  bus(id: SfxBusId): GainNode | null {
    if (id === 'lead') {
      return this.sfxLead
    }
    if (id === 'ui') {
      return this.uiGain
    }
    if (id === 'voice') {
      return this.voiceGain
    }
    if (id === 'dialogue') {
      return this.dialogueGain
    }
    if (id === 'env') {
      return this.envGain
    }
    return this.sfxBed
  }

  unlock(): void {
    if (this.unlocked) {
      return
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) {
      return
    }
    this.ctx = new Ctx()
    this.masterGain = this.ctx.createGain()
    this.musicDuck = this.ctx.createGain()
    this.musicGain = this.ctx.createGain()
    this.sfxDuck = this.ctx.createGain()
    this.sfxBed = this.ctx.createGain()
    this.sfxLead = this.ctx.createGain()
    this.uiGain = this.ctx.createGain()
    this.voiceGain = this.ctx.createGain()
    this.dialogueGain = this.ctx.createGain()
    this.envDuck = this.ctx.createGain()
    this.envGain = this.ctx.createGain()

    this.masterGain.connect(this.ctx.destination)
    this.musicDuck.connect(this.masterGain)
    this.musicGain.connect(this.musicDuck)
    this.sfxDuck.connect(this.masterGain)
    this.sfxBed.connect(this.sfxDuck)
    this.sfxLead.connect(this.masterGain)
    this.uiGain.connect(this.masterGain)
    this.voiceGain.connect(this.masterGain)
    this.dialogueGain.connect(this.masterGain)
    this.envDuck.connect(this.masterGain)
    this.envGain.connect(this.envDuck)
    this.applyVolumes()
    void this.ctx.resume()
    this.unlocked = true
  }

  setVolume(kind: 'music' | 'sfx' | 'master', value: number): void {
    const v = clamp(value, 0, 1)
    if (kind === 'music') {
      this.musicVolume = v
    } else if (kind === 'sfx') {
      this.sfxVolume = v
    } else {
      this.musicVolume = v
      this.sfxVolume = v
    }
    this.applyVolumes()
  }

  duckMusic(factor: number, holdSec = 0): void {
    this.unlock()
    if (!this.ctx || !this.musicDuck) {
      return
    }
    const now = this.ctx.currentTime
    const g = this.musicDuck.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(clamp(factor, 0.05, 1), now + 0.05)
    if (holdSec > 0) {
      g.setValueAtTime(clamp(factor, 0.05, 1), now + holdSec)
      g.linearRampToValueAtTime(1, now + holdSec + 0.4)
    }
  }

  restoreMusic(): void {
    if (!this.ctx || !this.musicDuck) {
      return
    }
    const now = this.ctx.currentTime
    const g = this.musicDuck.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(1, now + 0.25)
  }

  duckGameplay(amount: number, durationMs: number): void {
    this.unlock()
    if (!this.ctx || !this.sfxDuck || !this.envDuck) {
      return
    }
    const now = this.ctx.currentTime
    const hold = Math.max(0.08, durationMs / 1000)
    for (const node of [this.sfxDuck, this.envDuck]) {
      const g = node.gain
      g.cancelScheduledValues(now)
      g.setValueAtTime(g.value, now)
      g.linearRampToValueAtTime(clamp(amount, 0.08, 1), now + 0.03)
      g.setValueAtTime(clamp(amount, 0.08, 1), now + hold)
      g.linearRampToValueAtTime(1, now + hold + 0.32)
    }
  }

  playMusic(): void {
    this.unlock()
    if (!this.ctx || !this.musicGain || this.musicNode) {
      return
    }
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 110
    osc.connect(this.musicGain)
    osc.start()
    this.musicNode = osc
  }

  stopMusic(): void {
    if (!this.musicNode) {
      return
    }
    try {
      this.musicNode.stop()
    } catch {
      // already stopped
    }
    this.musicNode.disconnect()
    this.musicNode = null
  }

  playSfx(id: string): void {
    this.unlock()
    if (this.sfxHook) {
      this.sfxHook(id)
      return
    }
    this.legacyBeep(id)
  }

  private legacyBeep(id: string): void {
    if (!this.ctx || !this.sfxBed) {
      return
    }
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 440
    gain.gain.value = 0.08
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(this.sfxBed)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.11)
    void id
  }

  private applyVolumes(): void {
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume * 0.15
    }
    const sfx = this.sfxVolume
    if (this.sfxBed) {
      this.sfxBed.gain.value = sfx
    }
    if (this.sfxLead) {
      this.sfxLead.gain.value = sfx
    }
    if (this.uiGain) {
      this.uiGain.gain.value = sfx * 0.85
    }
    if (this.voiceGain) {
      this.voiceGain.gain.value = sfx
    }
    if (this.dialogueGain) {
      this.dialogueGain.gain.value = sfx * 0.92
    }
    if (this.envGain) {
      this.envGain.gain.value = sfx * 0.22
    }
  }
}

export const audio = new AudioManager()
