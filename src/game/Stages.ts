export interface StageAmbient {
  x: number
  y: number
  tint: number
  frequency: number
  /** vitesse verticale moyenne des particules (negatif = monte) */
  drift: number
}

export interface StageDef {
  id: string
  name: string
  /** particules d'ambiance pour animer l'arriere-plan */
  ambient: StageAmbient[]
}

/**
 * Arenes canon Tensura (anime uniquement).
 *
 * 01 tempest_city — Ville centrale de la Federation Jura-Tempest (Rimuru City).
 *    S1 ep15+, S2, S3 ep62. Toits bleus, rues paves, pas de murailles (barriere).
 * 02 tempest_arena — Colisee du Festival de Fondation, construit par Geld/orcs.
 *    S3 ep68–69. Entree du donjon sous l'arene.
 * 03 jura_forest — Grande Foret de Jura. S1 (grotte, approches du village gobelin).
 * 04 sealed_cave — Grotte Scellee, rencontre Rimuru/Veldora. S1 ep1. Pas de dragon.
 * 05 dwargon — Capitale souterraine de la Nation Armee de Dwargon. S1 ep4.
 * 06 blumund — Petit royaume humain (capitale Londo/Rondo, Free Guild). S1 ep2+.
 * 07 eurazania — Royaume des Betes, capitale Laura, palais de Carrion. S2.
 * 08 lubelius_lune — Saint Empire de Lubelius (Ruberios), capitale Lune, exterieur
 *    ville sainte blanche. S2/S3. Distinct de 09.
 * 09 night_garden — Jardin de la Nuit / palais interieur de Luminous Valentine
 *    sous/dans la ville sainte. S2 ep48 env. Roses blanches, marbre, clair de lune.
 * 10 tempest_festival — Rues du Festival de Fondation. S3 ep67–72. Meme archi que 01.
 * 11 ramiris_dungeon — Labyrinthe de Ramiris sous l'arene. S3. 100 etages.
 * 12 walpurgis — Banquet des Demon Lords. S2 ep46 (47–48). Cercle de sieges.
 *
 * Remplacements (lieux demandes trop flous / absents de l'anime) :
 * 13 frost_palace — Palais de glace de Guy Crimson / Continent de Glace.
 *    Remplace un "Demon Realm" generique : l'anime n'etablit pas un paysage unique
 *    d'enfer, mais montre le palais de glace de Guy.
 * 14 milim_domain — Chateau de pierre de Milim Nava sur les pics (S1) / territoire
 *    de la Foi du Dragon. Remplace un "royaume de Milim" invente : pas de capitale
 *    nommee etablie a l'ecran.
 * 15 tempest_invasion — Invasion de Falmuth (Farmus) contre Tempest. S2.
 *    Meme ville que 01, mais en guerre (feu, fumee, toits bleus endommages).
 *
 * Lubelius : 08 = exterieur de Lune (ville religieuse claire) ;
 * 09 = sanctuaire interieur vampirique (Night Garden), pas un clone gothique.
 */
export const STAGES: StageDef[] = [
  {
    id: 'tempest_city',
    name: 'Ville de Rimuru',
    ambient: [
      { x: 300, y: 260, tint: 0xffe082, frequency: 140, drift: -12 },
      { x: 1620, y: 240, tint: 0x90caf9, frequency: 160, drift: -10 },
    ],
  },
  {
    id: 'tempest_arena',
    name: 'Arene de Tempest',
    ambient: [
      { x: 480, y: 180, tint: 0xffe082, frequency: 130, drift: -8 },
      { x: 1460, y: 160, tint: 0xffcc80, frequency: 150, drift: -6 },
    ],
  },
  {
    id: 'jura_forest',
    name: 'Grande Foret de Jura',
    ambient: [
      { x: 500, y: 300, tint: 0xc5e1a5, frequency: 90, drift: -16 },
      { x: 1400, y: 340, tint: 0xfff59d, frequency: 110, drift: -14 },
    ],
  },
  {
    id: 'sealed_cave',
    name: 'Grotte Scellee',
    ambient: [
      { x: 420, y: 380, tint: 0x4dd0e1, frequency: 80, drift: -10 },
      { x: 1500, y: 420, tint: 0x80cbc4, frequency: 100, drift: -8 },
    ],
  },
  {
    id: 'dwargon',
    name: 'Capitale de Dwargon',
    ambient: [
      { x: 360, y: 520, tint: 0xff8a65, frequency: 90, drift: -18 },
      { x: 1560, y: 280, tint: 0x90caf9, frequency: 120, drift: -8 },
    ],
  },
  {
    id: 'blumund',
    name: 'Royaume de Blumund',
    ambient: [
      { x: 400, y: 280, tint: 0xfff8e1, frequency: 170, drift: -8 },
      { x: 1500, y: 300, tint: 0xffe0b2, frequency: 190, drift: -6 },
    ],
  },
  {
    id: 'eurazania',
    name: 'Eurazania',
    ambient: [
      { x: 380, y: 240, tint: 0xffcc80, frequency: 110, drift: -10 },
      { x: 1540, y: 260, tint: 0xffe082, frequency: 130, drift: -8 },
    ],
  },
  {
    id: 'lubelius_lune',
    name: 'Saint Empire Lubelius',
    ambient: [
      { x: 440, y: 220, tint: 0xfffde7, frequency: 140, drift: -8 },
      { x: 1480, y: 200, tint: 0x90caf9, frequency: 160, drift: -6 },
    ],
  },
  {
    id: 'night_garden',
    name: 'Jardin de la Nuit',
    ambient: [
      { x: 500, y: 260, tint: 0xe1bee7, frequency: 90, drift: -8 },
      { x: 1420, y: 300, tint: 0xef9a9a, frequency: 110, drift: -6 },
    ],
  },
  {
    id: 'tempest_festival',
    name: 'Festival de Tempest',
    ambient: [
      { x: 320, y: 300, tint: 0xffc107, frequency: 70, drift: -18 },
      { x: 1600, y: 280, tint: 0xff8a65, frequency: 80, drift: -16 },
    ],
  },
  {
    id: 'ramiris_dungeon',
    name: 'Donjon de Ramiris',
    ambient: [
      { x: 460, y: 240, tint: 0xce93d8, frequency: 90, drift: -12 },
      { x: 1460, y: 260, tint: 0xffe082, frequency: 110, drift: -10 },
    ],
  },
  {
    id: 'walpurgis',
    name: 'Walpurgis',
    ambient: [
      { x: 400, y: 200, tint: 0xb39ddb, frequency: 80, drift: -14 },
      { x: 1520, y: 180, tint: 0x82b1ff, frequency: 100, drift: -12 },
    ],
  },
  {
    id: 'frost_palace',
    name: 'Palais de Glace',
    ambient: [
      { x: 520, y: 140, tint: 0xe1f5fe, frequency: 55, drift: 28 },
      { x: 1400, y: 120, tint: 0xb3e5fc, frequency: 65, drift: 32 },
    ],
  },
  {
    id: 'milim_domain',
    name: 'Domaine de Milim',
    ambient: [
      { x: 360, y: 200, tint: 0x81d4fa, frequency: 90, drift: -12 },
      { x: 1560, y: 220, tint: 0xffd54f, frequency: 110, drift: -10 },
    ],
  },
  {
    id: 'tempest_invasion',
    name: 'Invasion de Falmuth',
    ambient: [
      { x: 380, y: 360, tint: 0xff6e40, frequency: 60, drift: -22 },
      { x: 1540, y: 320, tint: 0xffab40, frequency: 70, drift: -18 },
    ],
  },
]

export function stageKey(id: string): string {
  return `stage-${id}`
}

export function stageById(id: string): StageDef | undefined {
  return STAGES.find((s) => s.id === id)
}

export function randomStage(): StageDef {
  const index = Math.floor(Math.random() * STAGES.length)
  return STAGES[index] ?? STAGES[0]!
}

export function cycleStageId(current: string, delta: number): string {
  const ids = ['random', ...STAGES.map((stage) => stage.id)]
  const index = Math.max(0, ids.indexOf(current))
  const next = (index + delta + ids.length) % ids.length
  return ids[next] ?? 'random'
}

export function stageLabel(id: string): string {
  if (id === 'random') {
    return 'Aleatoire'
  }
  return stageById(id)?.name ?? id
}
