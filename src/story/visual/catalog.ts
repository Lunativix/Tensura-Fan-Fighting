import { FighterId, type FighterIdValue } from '../../types/game.ts'
import { PLAYABLE_FIGHTERS } from '../../config/characters.ts'
import type { AppearanceDef, SpeakerAppearanceOverride, VisualFrom } from './types.ts'

function look(
  fighterId: FighterIdValue,
  id: string,
  label: string,
  from: VisualFrom,
  extra: Partial<Omit<AppearanceDef, 'id' | 'fighterId' | 'label' | 'from'>> & { reference: string },
): AppearanceDef {
  return {
    id,
    fighterId,
    label,
    from,
    requires: extra.requires,
    displayName: extra.displayName ?? label,
    body: extra.body ?? 'sprite',
    portrait: extra.portrait ?? fighterId,
    spriteFighterId: extra.spriteFighterId,
    spriteFolder: extra.spriteFolder,
    artStatus: extra.artStatus ?? 'present',
    reference: extra.reference,
  }
}

/**
 * Canon visual versions only. If LN/manga do not change the look, there is one entry.
 * Harvest Festival changes Rimuru's *status*; unique adult art is not in the pack yet,
 * so that version aliases the Shizu-form sheets instead of inventing a new outfit.
 */
export const APPEARANCES: AppearanceDef[] = [
  look(FighterId.rimuru, 'rimuru-satoru', 'Satoru Mikami', { kind: 'start' }, {
    displayName: 'Satoru Mikami',
    portrait: 'satoru',
    body: 'slime',
    artStatus: 'present',
    reference: 'Prologue Tokyo. Humain. Jamais le corps de Shizu. Portrait dialogue uniquement.',
  }),
  look(FighterId.rimuru, 'rimuru-slime', 'Slime', { kind: 'start' }, {
    displayName: 'Rimuru',
    portrait: 'rimuru-slime',
    body: 'slime',
    artStatus: 'present',
    reference: 'Slime jusqu\'à l\'absorption de Shizu / Ifrit. Portrait et cinématique seulement. Combat = blob procédural, pas de sheet PNG.',
  }),
  look(FighterId.rimuru, 'rimuru-shizu', 'Après Shizu', { kind: 'missionComplete', missionId: 'shizu_ifrit' }, {
    displayName: 'Rimuru',
    portrait: 'rimuru',
    body: 'sprite',
    artStatus: 'present',
    reference: 'Mimétisme du corps de Shizu. Cheveux bleus, manteau. Interdit avant la fin de shizu_ifrit.',
  }),
  look(FighterId.rimuru, 'rimuru-demon-lord', 'True Demon Lord', { kind: 'missionStart', missionId: 'harvest_festival' }, {
    displayName: 'Rimuru',
    portrait: 'rimuru',
    body: 'sprite',
    spriteFighterId: FighterId.rimuru,
    artStatus: 'aliased',
    requires: ['shizu_ifrit'],
    reference: 'LN : Rimuru se réveille déjà True Demon Lord. Pas de sprites distincts : même art que la forme Shizu. Ne pas inventer un corps adulte.',
  }),

  look(FighterId.benimaru, 'benimaru-ogre', 'Ogre', { kind: 'start' }, {
    artStatus: 'missing-period-art',
    reference: 'Ogre jusqu\'au naming (fin ogres_survivors). Pas de sheets ogre : fallback roster, ne pas inventer un kimono kijin « early ».',
  }),
  look(FighterId.benimaru, 'benimaru-kijin', 'Kijin', { kind: 'missionComplete', missionId: 'ogres_survivors' }, {
    artStatus: 'present',
    reference: 'Après les noms. Évolution kijin. Tenue actuelle du roster.',
  }),

  look(FighterId.shion, 'shion-ogre', 'Ogresse', { kind: 'start' }, {
    artStatus: 'missing-period-art',
    reference: 'Ogresse jusqu\'au naming. Même règle d\'art que Benimaru.',
  }),
  look(FighterId.shion, 'shion-kijin', 'Kijin', { kind: 'missionComplete', missionId: 'ogres_survivors' }, {
    artStatus: 'present',
    reference: 'Après le nom Shion. Costume actuel.',
  }),

  look(FighterId.shuna, 'shuna-ogre', 'Ogresse', { kind: 'start' }, {
    artStatus: 'missing-period-art',
    reference: 'Prêtresse ogre jusqu\'au naming.',
  }),
  look(FighterId.shuna, 'shuna-kijin', 'Kijin', { kind: 'missionComplete', missionId: 'ogres_survivors' }, {
    artStatus: 'present',
    reference: 'Après le nom Shuna.',
  }),

  look(FighterId.souei, 'souei-ogre', 'Ogre', { kind: 'start' }, {
    artStatus: 'missing-period-art',
    reference: 'Ogre jusqu\'au naming.',
  }),
  look(FighterId.souei, 'souei-kijin', 'Kijin', { kind: 'missionComplete', missionId: 'ogres_survivors' }, {
    artStatus: 'present',
    reference: 'Après le nom Souei.',
  }),

  look(FighterId.hakurou, 'hakurou-ogre', 'Ogre', { kind: 'start' }, {
    artStatus: 'missing-period-art',
    reference: 'Maître d\'armes ogre jusqu\'au naming.',
  }),
  look(FighterId.hakurou, 'hakurou-kijin', 'Kijin', { kind: 'missionComplete', missionId: 'ogres_survivors' }, {
    artStatus: 'present',
    reference: 'Après le nom Hakurou.',
  }),

  look(FighterId.diablo, 'diablo-noir', 'Primordial Noir', { kind: 'start' }, {
    displayName: 'Noir',
    artStatus: 'aliased',
    reference: 'Avant le nom. Même silhouette que Diablo (LN). Ne pas inventer un autre costume.',
  }),
  look(FighterId.diablo, 'diablo-named', 'Diablo', { kind: 'missionComplete', missionId: 'harvest_festival' }, {
    displayName: 'Diablo',
    artStatus: 'present',
    reference: 'Après que Rimuru donne le nom. Pas Diablo dans les répliques avant.',
  }),

  look(FighterId.veldora, 'veldora-sealed', 'Dragon scellé', { kind: 'start' }, {
    displayName: 'Veldora',
    artStatus: 'missing-period-art',
    reference: 'Sceau dans la grotte. Le sprite humanoïde du roster est postérieur (libération). Ne pas inventer un dragon 2D.',
  }),
  look(FighterId.veldora, 'veldora-tempest', 'Veldora Tempest', { kind: 'missionComplete', missionId: 'cave_veldora' }, {
    displayName: 'Veldora Tempest',
    artStatus: 'aliased',
    reference: 'Nommé Tempest. Toujours dans l\'estomac de Rimuru jusqu\'à plus tard. Même art roster, pas une nouvelle tenue.',
  }),

  look(FighterId.milim, 'milim-nava', 'Milim Nava', { kind: 'start' }, {
    reference: 'Une seule apparence sur la campagne actuelle. Pas de « version arc 2 ».',
  }),
  look(FighterId.hinata, 'hinata-sakaguchi', 'Hinata Sakaguchi', { kind: 'start' }, {
    reference: 'Inchangée sur cette campagne.',
  }),
  look(FighterId.guy, 'guy-crimson', 'Guy Crimson', { kind: 'start' }, {
    reference: 'Inchangé sur cette campagne.',
  }),
]

export const SPEAKER_APPEARANCES: SpeakerAppearanceOverride[] = [
  { speaker: 'Satoru Mikami', appearanceId: 'rimuru-satoru' },
  { speaker: 'Noir', appearanceId: 'diablo-noir' },
  { speaker: 'Diablo', appearanceId: 'diablo-named' },
]

export function appearancesOf(fighterId: FighterIdValue): AppearanceDef[] {
  return APPEARANCES.filter((item) => item.fighterId === fighterId)
}

export function appearanceById(id: string): AppearanceDef | undefined {
  return APPEARANCES.find((item) => item.id === id)
}

export function allAppearanceSubjects(): FighterIdValue[] {
  return PLAYABLE_FIGHTERS
}
