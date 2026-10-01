import { BattleType, MusicLayer, MusicRole, type LayerPattern, type MusicTrackDef } from './types.ts'

function layer(
  id: LayerPattern['id'],
  minIntensity: number,
  kind: LayerPattern['kind'],
  steps: number[],
  octave: number,
  gain = 1,
): LayerPattern {
  return { id, minIntensity, kind, steps, octave, gain }
}

function pad(steps: number[], octave = 0, min = 0): LayerPattern {
  return layer(MusicLayer.BASE, min, 'pad', steps, octave, 0.55)
}

function bass(steps: number[], octave = -2, min = 0): LayerPattern {
  return layer(MusicLayer.BASE, min, 'bass', steps, octave, 0.7)
}

function perc(steps: number[], min = 1): LayerPattern {
  return layer(MusicLayer.PERCUSSION, min, 'perc', steps, 0, 0.85)
}

function brass(steps: number[], octave = 0, min = 3): LayerPattern {
  return layer(MusicLayer.BRASS, min, 'brass', steps, octave, 0.45)
}

function choir(steps: number[], octave = 1, min = 4): LayerPattern {
  return layer(MusicLayer.CHOIR, min, 'choir', steps, octave, 0.32)
}

function motif(steps: number[], octave = 1, min = 0): LayerPattern {
  return layer(MusicLayer.MOTIF, min, 'motif', steps, octave, 0.5)
}

function climax(steps: number[], octave = 0, min = 5): LayerPattern {
  return layer(MusicLayer.CLIMAX, min, 'arp', steps, octave, 0.4)
}

const PULSE = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
const WALK = [1, 0, 0, 0, 0, 0, 5, 0, 1, 0, 0, 0, 0, 0, 3, 0]
const DRIVE = [1, 0, 4, 0, 2, 0, 4, 0, 1, 0, 4, 3, 2, 0, 4, 0]
const STORM = [1, 4, 3, 4, 2, 4, 3, 4, 1, 4, 3, 4, 2, 3, 4, 3]
const TAIKO = [3, 0, 0, 0, 3, 0, 4, 0, 3, 0, 0, 0, 2, 0, 4, 0]

function def(
  id: string,
  title: string,
  category: MusicTrackDef['category'],
  bpm: number,
  rootHz: number,
  scale: MusicTrackDef['scale'],
  layers: LayerPattern[],
  extra: Partial<MusicTrackDef> = {},
): MusicTrackDef {
  return {
    id,
    title,
    category,
    priority: extra.priority ?? 20,
    bpm,
    bars: extra.bars ?? 4,
    rootHz,
    scale,
    loopStart: extra.loopStart ?? 0,
    volume: extra.volume ?? 0.72,
    layers,
    ...extra,
  }
}

export const MUSIC_TRACKS: MusicTrackDef[] = [
  def('menu.boot', 'Signature of Stormlight', MusicRole.MENU, 62, 130.81, 'dorian', [
    pad([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0], 0),
    choir([1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0], 1, 0),
  ], { priority: 19, volume: 0.28 }),

  def('menu.main', 'Horizon of Jura', MusicRole.MENU, 86, 130.81, 'yo', [
    pad([1, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0], 0),
    bass([1, 0, 0, 0, 1, 0, 5, 0, 1, 0, 0, 0, 4, 0, 5, 0]),
    motif([1, 0, 2, 0, 3, 0, 5, 0, 0, 0, 3, 0, 2, 0, 1, 0], 1),
    perc([0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 3, 0, 4, 0], 2),
  ], { priority: 20, volume: 0.55 }),

  def('menu.story', 'Chronicle Binding', MusicRole.MENU, 76, 146.83, 'dorian', [
    pad([1, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0]),
    bass([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 4, 0]),
    motif([1, 0, 3, 0, 4, 0, 5, 0, 4, 0, 3, 0, 1, 0, 0, 0], 1),
  ], { priority: 21, volume: 0.5 }),

  def('menu.select', 'Names Yet Spoken', MusicRole.MENU, 100, 196, 'majorPenta', [
    pad([1, 0, 3, 0, 5, 0, 3, 0, 1, 0, 2, 0, 5, 0, 3, 0]),
    bass(WALK, -2),
    perc([0, 0, 4, 0, 1, 0, 4, 0, 0, 0, 4, 0, 1, 0, 4, 0], 1),
    motif([5, 0, 3, 0, 1, 0, 3, 0, 5, 0, 6, 0, 5, 0, 3, 0], 1),
  ], { priority: 22, volume: 0.52 }),

  def('menu.shop', 'Night Market Glow', MusicRole.MENU, 92, 174.61, 'dorian', [
    pad([1, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0]),
    bass([1, 0, 0, 0, 1, 0, 5, 0, 1, 0, 0, 0, 4, 0, 5, 0]),
    perc([0, 0, 4, 0, 1, 0, 4, 0, 0, 0, 4, 0, 1, 0, 4, 0], 1),
    motif([5, 0, 4, 0, 1, 0, 3, 0, 5, 0, 7, 0, 5, 0, 4, 0], 1),
  ], { priority: 23, volume: 0.5 }),

  def('menu.summon', 'Circle Under Seal', MusicRole.MENU, 68, 110, 'phrygian', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0], -1),
    bass([1, 0, 0, 0, 0, 0, 5, 0, 1, 0, 0, 0, 0, 0, 4, 0], -2),
    motif([1, 0, 5, 0, 1, 0, 8, 0, 5, 0, 1, 0, 4, 0, 1, 0], 0),
    choir([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0], 1, 3),
  ], { priority: 24, volume: 0.48 }),

  def('explore.prologue', 'A Quiet Office', MusicRole.EXPLORATION, 68, 220, 'majorPenta', [
    pad([1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0], 1),
    motif([1, 0, 0, 2, 0, 0, 3, 0, 0, 0, 2, 0, 1, 0, 0, 0], 2),
  ], { arc: 'prologue', location: 'tokyo', priority: 30, volume: 0.38 }),

  def('explore.sealed_cave', 'Breath in Stone', MusicRole.EXPLORATION, 72, 110, 'hirajoshi', [
    pad([1, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0]),
    bass([1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0], -3),
    motif([1, 0, 2, 0, 3, 0, 0, 0, 5, 0, 3, 0, 2, 0, 0, 0], 1),
  ], { location: 'sealed_cave', arc: 'sealed_cave', priority: 31, volume: 0.48 }),

  def('explore.sealed_cave_danger', 'Something Moves', MusicRole.EXPLORATION, 92, 110, 'hirajoshi', [
    pad([1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0]),
    bass([1, 0, 1, 0, 5, 0, 1, 0, 1, 0, 1, 0, 5, 0, 4, 0], -3),
    perc(TAIKO, 1),
    motif([1, 0, 5, 0, 1, 0, 3, 0, 5, 0, 1, 0, 2, 0, 1, 0], 0),
    brass([0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], -1, 3),
  ], { location: 'sealed_cave', priority: 42, minIntensity: 2, volume: 0.58 }),

  def('battle.first', 'First Hunger', MusicRole.BATTLE, 118, 146.83, 'minorPenta', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0], -1),
    bass(PULSE, -2),
    perc(DRIVE, 1),
    motif([1, 0, 3, 0, 5, 0, 3, 0, 1, 0, 4, 0, 5, 0, 3, 0], 1),
    brass([0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 8, 0], 0, 3),
    choir([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0], 1, 4),
    climax([1, 5, 1, 5, 8, 5, 1, 5, 1, 5, 1, 5, 8, 5, 4, 5], 1),
  ], { battleType: BattleType.STORY, arc: 'sealed_cave', priority: 56, volume: 0.7 }),

  def('theme.veldora', 'Storm Behind the Seal', MusicRole.CINEMATIC, 96, 65.41, 'lydian', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 5, 0, 0, 0], -1),
    bass([1, 0, 0, 0, 1, 0, 5, 0, 1, 0, 0, 0, 6, 0, 5, 0], -2),
    perc(TAIKO, 2),
    motif([1, 0, 5, 0, 1, 0, 6, 0, 5, 0, 8, 0, 5, 0, 1, 0], 0),
    brass([1, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0], 0, 3),
    choir([1, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 8, 0, 0, 0], 1, 4),
  ], { character: 'veldora', location: 'sealed_cave', priority: 70, volume: 0.68 }),

  def('explore.goblin', 'Huts After the Aura', MusicRole.EXPLORATION, 84, 174.61, 'yo', [
    pad([1, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0]),
    bass([1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0], -2),
    motif([1, 2, 3, 0, 5, 0, 3, 2, 1, 0, 0, 0, 2, 0, 1, 0], 1),
    perc([0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 4, 0], 2),
  ], { location: 'jura_forest', arc: 'goblins', priority: 32, volume: 0.5 }),

  def('explore.jura', 'Green Canopy Road', MusicRole.EXPLORATION, 90, 164.81, 'dorian', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0]),
    bass(WALK, -2),
    motif([5, 0, 4, 0, 3, 0, 1, 0, 3, 0, 5, 0, 4, 0, 2, 0], 1),
    perc([4, 0, 0, 4, 0, 0, 3, 0, 4, 0, 0, 4, 0, 0, 1, 0], 2),
  ], { location: 'jura_forest', priority: 30, volume: 0.52 }),

  def('explore.tempest_village', 'First Hearths', MusicRole.EXPLORATION, 88, 196, 'yo', [
    pad([1, 0, 3, 0, 5, 0, 3, 0, 1, 0, 2, 0, 5, 0, 3, 0]),
    bass([1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 4, 0, 5, 0]),
    motif([1, 2, 3, 5, 3, 2, 1, 0, 5, 0, 3, 0, 2, 0, 1, 0], 1),
  ], { location: 'tempest_city', arc: 'tempest', priority: 33, volume: 0.5 }),

  def('explore.tempest_city', 'Federation Morning', MusicRole.EXPLORATION, 94, 196, 'majorPenta', [
    pad([1, 0, 3, 0, 5, 0, 8, 0, 5, 0, 3, 0, 2, 0, 1, 0]),
    bass(WALK, -2),
    perc([0, 0, 4, 0, 1, 0, 4, 0, 0, 0, 4, 0, 3, 0, 4, 0], 1),
    motif([3, 0, 5, 0, 8, 0, 5, 0, 3, 0, 2, 0, 1, 0, 3, 0], 1),
    brass([0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0], 0, 4),
  ], { location: 'tempest_city', priority: 34, volume: 0.56 }),

  def('battle.tempest', 'Banner of the Storm', MusicRole.BATTLE, 128, 196, 'yo', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0], -1),
    bass(PULSE, -2),
    perc(DRIVE, 1),
    motif([1, 2, 3, 5, 0, 5, 3, 2, 1, 0, 5, 0, 8, 0, 5, 0], 1),
    brass([5, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0], 0, 3),
    choir([1, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0], 1, 4),
    climax([1, 5, 8, 5, 1, 5, 8, 5, 1, 5, 3, 5, 8, 5, 1, 5], 1),
  ], { battleType: BattleType.STORY, location: 'tempest_city', priority: 58, volume: 0.72 }),

  def('battle.ogres', 'Six Who Still Stand', MusicRole.BATTLE, 122, 220, 'harmonicMinor', [
    pad([1, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0], -1),
    bass([1, 0, 0, 1, 5, 0, 0, 1, 1, 0, 0, 1, 4, 0, 5, 0], -2),
    perc(TAIKO, 1),
    motif([5, 4, 3, 1, 0, 1, 3, 5, 0, 7, 5, 4, 3, 0, 1, 0], 1),
    brass([1, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0], 0, 3),
    choir([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0], 1, 4),
  ], { battleType: BattleType.HARD, arc: 'ogres', priority: 60, volume: 0.7 }),

  def('battle.normal', 'Open Field Clash', MusicRole.BATTLE, 124, 155.56, 'minorPenta', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0], -1),
    bass(PULSE, -2),
    perc(DRIVE, 1),
    motif([1, 0, 5, 0, 3, 0, 5, 0, 1, 0, 4, 0, 5, 0, 3, 0], 1),
    brass([0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 8, 0], 0, 3),
    choir([1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0], 1, 4),
    climax([1, 5, 1, 8, 1, 5, 1, 8, 1, 5, 4, 8, 1, 5, 1, 8], 1),
  ], { battleType: BattleType.NORMAL, priority: 55, volume: 0.7 }),

  def('battle.pve', 'Wave After Wave', MusicRole.BATTLE, 130, 138.59, 'dorian', [
    pad([1, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0], -1),
    bass([1, 0, 1, 0, 5, 0, 1, 0, 1, 0, 1, 0, 4, 0, 5, 0], -2),
    perc(DRIVE, 1),
    motif([1, 3, 5, 0, 4, 0, 5, 3, 1, 0, 5, 0, 3, 0, 1, 0], 1),
    brass([5, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0], 0, 3),
    climax([1, 4, 5, 4, 1, 4, 5, 8, 1, 4, 5, 4, 1, 5, 4, 8], 1),
  ], { battleType: BattleType.PVE_WAVE, priority: 57, volume: 0.7 }),

  def('boss.orc_disaster', 'Starved Crown', MusicRole.BOSS, 108, 73.42, 'harmonicMinor', [
    pad([1, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0], -1),
    bass([1, 0, 0, 1, 1, 0, 5, 0, 1, 0, 0, 1, 7, 0, 5, 0], -2),
    perc(STORM, 1),
    motif([1, 0, 7, 0, 5, 0, 3, 0, 1, 0, 5, 0, 7, 0, 8, 0], 0),
    brass([1, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0], -1, 2),
    choir([1, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 5, 0, 0, 0], 0, 3),
    climax([1, 7, 5, 7, 1, 7, 5, 8, 1, 7, 5, 7, 1, 8, 7, 5], 0),
  ], { boss: 'orc_disaster', battleType: BattleType.BOSS, arc: 'orcs', priority: 82, volume: 0.74 }),

  def('boss.charybdis', 'Seed of the Sky-Eater', MusicRole.BOSS, 100, 116.54, 'phrygian', [
    pad([1, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0], -1),
    bass([1, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 4, 0, 2, 0], -2),
    perc(TAIKO, 1),
    motif([1, 2, 1, 5, 0, 4, 2, 1, 0, 5, 4, 2, 1, 0, 2, 0], 0),
    brass([1, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0], -1, 3),
    choir([1, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0], 1, 4),
    climax([1, 2, 5, 2, 1, 2, 5, 8, 1, 2, 5, 2, 1, 5, 2, 8], 0),
  ], { boss: 'charybdis', battleType: BattleType.BOSS, arc: 'charybdis', priority: 83, volume: 0.74 }),

  def('explore.farmus', 'Banners of the West', MusicRole.EXPLORATION, 80, 174.61, 'dorian', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0]),
    bass([1, 0, 0, 0, 0, 0, 5, 0, 1, 0, 0, 0, 4, 0, 0, 0], -2),
    motif([5, 0, 4, 0, 1, 0, 2, 0, 4, 0, 5, 0, 1, 0, 0, 0], 1),
    perc([0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0, 4, 0], 2),
  ], { location: 'tempest_invasion', arc: 'falmuth', priority: 36, volume: 0.5 }),

  def('theme.rimuru_evolution', 'True Name of the Storm', MusicRole.CINEMATIC, 70, 146.83, 'dorian', [
    pad([1, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0], 0),
    bass([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 8, 0], -2),
    motif([1, 3, 4, 5, 0, 5, 8, 5, 4, 3, 1, 0, 5, 0, 8, 0], 1),
    choir([1, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0], 1, 2),
    brass([0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0], 0, 3),
  ], { character: 'rimuru', arc: 'demon_lord', priority: 88, volume: 0.62 }),

  def('theme.diablo', 'Black That Bows', MusicRole.CINEMATIC, 64, 130.81, 'phrygian', [
    pad([1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0]),
    bass([1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0], -3),
    motif([1, 0, 2, 0, 1, 0, 5, 0, 4, 0, 0, 0, 1, 0, 0, 0], 1),
    choir([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0], 1, 3),
  ], { character: 'diablo', arc: 'demon_lord', priority: 72, volume: 0.48 }),

  def('theme.milim', 'Dragon Who Laughs', MusicRole.CINEMATIC, 140, 329.63, 'lydian', [
    pad([1, 0, 5, 0, 6, 0, 5, 0, 1, 0, 4, 0, 6, 0, 5, 0], 0),
    bass([1, 0, 0, 1, 5, 0, 0, 1, 1, 0, 0, 1, 6, 0, 5, 0], -1),
    perc(DRIVE, 1),
    motif([1, 5, 4, 6, 5, 8, 5, 4, 1, 0, 6, 0, 5, 0, 8, 0], 0),
    brass([5, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0], 0, 3),
  ], { character: 'milim', priority: 71, volume: 0.66 }),

  def('theme.clayman', 'Silk Around the Knife', MusicRole.EXPLORATION, 78, 185, 'harmonicMinor', [
    pad([1, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0]),
    bass([1, 0, 0, 0, 0, 0, 7, 0, 1, 0, 0, 0, 6, 0, 0, 0], -2),
    motif([1, 7, 6, 7, 3, 0, 2, 0, 1, 0, 7, 0, 6, 0, 3, 0], 1),
  ], { character: 'clayman', arc: 'clayman', priority: 45, volume: 0.46 }),

  def('walpurgis.entrance', 'Ten Seats', MusicRole.CINEMATIC, 72, 103.83, 'phrygian', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0], -1),
    bass([1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 4, 0], -2),
    motif([1, 0, 5, 0, 4, 0, 7, 0, 5, 0, 1, 0, 4, 0, 0, 0], 1),
    choir([1, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0], 1, 2),
    perc([0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 4, 0], 3),
  ], { location: 'walpurgis', arc: 'walpurgis', priority: 74, volume: 0.58 }),

  def('walpurgis.dialogue', 'Words Between Thrones', MusicRole.DIALOGUE, 66, 103.83, 'phrygian', [
    pad([1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0], 0),
    motif([1, 0, 0, 5, 0, 0, 4, 0, 0, 0, 0, 0, 1, 0, 0, 0], 1),
  ], { location: 'walpurgis', priority: 41, volume: 0.36 }),

  def('walpurgis.tension', 'Judgment Room', MusicRole.EXPLORATION, 88, 103.83, 'phrygian', [
    pad([1, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0], -1),
    bass([1, 0, 1, 0, 5, 0, 0, 0, 1, 0, 1, 0, 7, 0, 4, 0], -2),
    perc(TAIKO, 2),
    motif([1, 2, 5, 0, 7, 0, 5, 4, 1, 0, 5, 0, 2, 0, 1, 0], 0),
    brass([0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0], 0, 3),
  ], { location: 'walpurgis', arc: 'walpurgis', priority: 50, volume: 0.6 }),

  def('boss.clayman_p1', 'The Puppet Smiles', MusicRole.BOSS, 104, 185, 'harmonicMinor', [
    pad([1, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0], -1),
    bass([1, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 6, 0, 3, 0], -2),
    perc(TAIKO, 1),
    motif([1, 7, 6, 7, 3, 0, 2, 1, 0, 7, 6, 0, 3, 0, 1, 0], 1),
    brass([1, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0], 0, 3),
  ], { boss: 'clayman', phase: 1, battleType: BattleType.BOSS, priority: 84, volume: 0.7 }),

  def('boss.clayman_p2', 'Strings Pulled Tight', MusicRole.BOSS, 118, 185, 'harmonicMinor', [
    pad([1, 0, 0, 0, 7, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0], -1),
    bass(PULSE, -2),
    perc(DRIVE, 1),
    motif([1, 7, 3, 7, 6, 0, 7, 3, 1, 0, 6, 0, 7, 0, 8, 0], 1),
    brass([7, 0, 0, 0, 1, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0], 0, 2),
    choir([1, 0, 0, 0, 7, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0], 1, 3),
  ], { boss: 'clayman', phase: 2, battleType: BattleType.BOSS, priority: 85, volume: 0.74 }),

  def('boss.clayman_final', 'No More Masks', MusicRole.BOSS, 132, 185, 'harmonicMinor', [
    pad([1, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0], -1),
    bass(PULSE, -2),
    perc(STORM, 1),
    motif([1, 7, 8, 7, 5, 3, 7, 1, 8, 7, 5, 3, 1, 7, 8, 5], 1),
    brass([1, 0, 7, 0, 8, 0, 5, 0, 1, 0, 7, 0, 8, 0, 5, 0], 0, 2),
    choir([1, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0], 1, 3),
    climax([1, 7, 8, 5, 1, 7, 8, 5, 1, 7, 8, 5, 1, 8, 7, 5], 1),
  ], { boss: 'clayman', phase: 3, battleType: BattleType.FINAL_BOSS, priority: 90, volume: 0.78 }),

  def('victory.normal', 'Clean Cut', MusicRole.VICTORY, 112, 196, 'majorPenta', [
    pad([1, 0, 3, 0, 5, 0, 8, 0, 5, 0, 3, 0, 1, 0, 0, 0]),
    motif([5, 3, 1, 3, 5, 8, 5, 3, 1, 0, 0, 0, 0, 0, 0, 0], 1),
    perc([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 4, 0, 1, 0, 0, 0], 0),
  ], { priority: 78, volume: 0.58, bars: 2 }),

  def('victory.boss', 'The Field Goes Quiet', MusicRole.VICTORY, 96, 146.83, 'dorian', [
    pad([1, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0]),
    brass([1, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0], 0, 0),
    choir([1, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 8, 0, 0, 0], 1, 0),
    motif([1, 3, 5, 8, 5, 3, 1, 0, 5, 0, 8, 0, 0, 0, 0, 0], 1),
  ], { priority: 79, volume: 0.62, bars: 2 }),

  def('victory.story', 'Another Dawn Named', MusicRole.VICTORY, 88, 196, 'yo', [
    pad([1, 0, 2, 0, 3, 0, 5, 0, 3, 0, 2, 0, 1, 0, 0, 0]),
    motif([1, 2, 3, 5, 3, 2, 1, 0, 5, 0, 3, 0, 1, 0, 0, 0], 1),
    choir([1, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0], 1, 0),
  ], { priority: 79, volume: 0.55, bars: 2 }),

  def('defeat.normal', 'Dust and Count', MusicRole.DEFEAT, 60, 110, 'minorPenta', [
    pad([1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0], -1),
    motif([5, 0, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0),
  ], { priority: 78, volume: 0.42, bars: 2 }),

  def('defeat.story', 'Not This Page', MusicRole.DEFEAT, 58, 130.81, 'dorian', [
    pad([1, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0], -1),
    motif([1, 0, 3, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0),
  ], { priority: 78, volume: 0.4, bars: 2 }),
]

export const TRACK_BY_ID = new Map(MUSIC_TRACKS.map((track) => [track.id, track]))

export function trackById(id: string): MusicTrackDef | undefined {
  return TRACK_BY_ID.get(id)
}
