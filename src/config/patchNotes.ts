export interface PatchNote {
  version: string
  new: readonly string[]
  balance: readonly string[]
  fixes: readonly string[]
  improvements: readonly string[]
}

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: '0.11.0',
    new: ['Collection animée, boutique vedette, coffres mystère, pity et packs'],
    balance: ['Roster de base gratuit — la rareté ne change pas la puissance'],
    fixes: ['Prix lus depuis le catalogue, pas depuis le client'],
    improvements: ['Skins boutique ignorés en Story Mode, ledger tickets/fragments'],
  },
  {
    version: '0.10.0',
    new: ['Compte invité, inscription locale, export RGPD, ledger crédits', 'Histoire et collection séparées'],
    balance: ['Les récompenses de combat et d’histoire passent par le journal économique'],
    fixes: ['Le client ne peut plus poser un solde premium local'],
    improvements: ['Boutique débitée via ledger, achats réels refusés tant qu’il n’y a pas de serveur'],
  },
  {
    version: '0.9.0',
    new: ['Arcade, Survival, Story, Shop, Online stubs', '8+ launch roster playable', 'Absorption and transformation'],
    balance: ['Rimuru predator copies last used attack', 'Milim rush damage slightly higher'],
    fixes: ['Save migration v3', 'Element resist NaN guard'],
    improvements: ['Hitstop, VFX library, adaptive music, QA checks'],
  },
]
