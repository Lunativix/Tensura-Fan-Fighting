import { Currency } from '../account/types.ts'
import { FighterId } from '../types/game.ts'
import { Rarity } from './rarity.ts'
import { ItemKind, ShopCategory, type ItemDef, type ShopOffer } from './types.ts'

export const ITEMS: readonly ItemDef[] = [
  {
    id: 'skin-rimuru-gold',
    name: 'Aura d’or de Rimuru',
    description: 'Contour doré en Versus, Arcade et Entraînement. Le Story Mode garde l’apparence canonique.',
    kind: ItemKind.APPEARANCE,
    rarity: Rarity.EPIC,
    fighterId: FighterId.rimuru,
    faction: 'tempest',
    tint: 0xffd54f,
    duplicateFragments: 25,
    fragmentTarget: 'rimuru',
  },
  {
    id: 'skin-milim-star',
    name: 'Éclat stellaire de Milim',
    description: 'Aura rose-étoile hors des cinématiques d’histoire.',
    kind: ItemKind.APPEARANCE,
    rarity: Rarity.EPIC,
    fighterId: FighterId.milim,
    faction: 'dragon',
    tint: 0xff6b9d,
    duplicateFragments: 25,
    fragmentTarget: 'milim',
  },
  {
    id: 'title-tempest',
    name: 'Titre : Seigneur de Tempest',
    description: 'Plaque cosmétique de profil. Aucun bonus de combat.',
    kind: ItemKind.COSMETIC,
    rarity: Rarity.RARE,
    faction: 'tempest',
    duplicateFragments: 10,
  },
  {
    id: 'palette-night',
    name: 'Palette Nuit de Jura',
    description: 'Teinte d’interface sombre pour le lobby.',
    kind: ItemKind.COSMETIC,
    rarity: Rarity.RARE,
    duplicateFragments: 8,
  },
  {
    id: 'emote-gobta-pose',
    name: 'Emote : salut de Gobta',
    description: 'Pose de victoire. Gobta n’est pas un combattant jouable.',
    kind: ItemKind.EMOTE,
    rarity: Rarity.COMMON,
    faction: 'tempest',
    duplicateFragments: 4,
  },
  {
    id: 'vfx-water-trail',
    name: 'Traînée d’eau',
    description: 'Sillage cosmétique sur Rimuru en Versus.',
    kind: ItemKind.VFX,
    rarity: Rarity.RARE,
    fighterId: FighterId.rimuru,
    faction: 'tempest',
    duplicateFragments: 12,
    fragmentTarget: 'rimuru',
  },
  {
    id: 'music-tempest-dawn',
    name: 'Aube de la Fédération',
    description: 'Ajoute le thème de Tempest à ta collection musicale.',
    kind: ItemKind.MUSIC,
    rarity: Rarity.RARE,
    faction: 'tempest',
    musicTrackId: 'explore.tempest_city',
    duplicateFragments: 10,
  },
  {
    id: 'music-walpurgis-gate',
    name: 'Seuil de Walpurgis',
    description: 'Thème d’événement. Disponible pendant Premier Walpurgis.',
    kind: ItemKind.MUSIC,
    rarity: Rarity.EPIC,
    faction: 'walpurgis',
    musicTrackId: 'walpurgis.entrance',
    duplicateFragments: 18,
  },
  {
    id: 'card-veldora',
    name: 'Carte : Veldora scellé',
    description: 'Carte de collection. Ne débloque pas un second Veldora jouable.',
    kind: ItemKind.CARD,
    rarity: Rarity.LEGENDARY,
    fighterId: FighterId.veldora,
    faction: 'dragon',
    duplicateFragments: 40,
    fragmentTarget: 'veldora',
  },
  {
    id: 'card-diablo',
    name: 'Carte : Primordial Noir',
    description: 'Carte d’événement. Le nom Diablo n’apparaît qu’après l’histoire.',
    kind: ItemKind.CARD,
    rarity: Rarity.MYTHIC,
    fighterId: FighterId.diablo,
    faction: 'primordial',
    spoiler: true,
    duplicateFragments: 60,
    fragmentTarget: 'diablo',
  },
  {
    id: 'anim-victory-shion',
    name: 'Victoire : garde de Shion',
    description: 'Animation de victoire cosmétique en Versus.',
    kind: ItemKind.ANIMATION,
    rarity: Rarity.RARE,
    fighterId: FighterId.shion,
    faction: 'tempest',
    duplicateFragments: 12,
    fragmentTarget: 'shion',
  },
]

const ITEM_MAP = new Map(ITEMS.map((item) => [item.id, item]))

export function itemById(id: string): ItemDef | undefined {
  return ITEM_MAP.get(id)
}

export function itemsOfKind(kind: ItemDef['kind']): ItemDef[] {
  return ITEMS.filter((item) => item.kind === kind)
}

export const SHOP_OFFERS: readonly ShopOffer[] = [
  {
    id: 'offer-featured-rimuru-gold',
    label: 'Aura d’or de Rimuru',
    category: ShopCategory.FEATURED,
    price: { currency: Currency.CREDITS, amount: 400 },
    itemId: 'skin-rimuru-gold',
    featured: true,
    rotation: 'always',
  },
  {
    id: 'offer-skin-rimuru-gold',
    label: 'Aura d’or de Rimuru',
    category: ShopCategory.APPEARANCES,
    price: { currency: Currency.CREDITS, amount: 400 },
    itemId: 'skin-rimuru-gold',
    rotation: 'always',
  },
  {
    id: 'offer-skin-milim-star',
    label: 'Éclat stellaire de Milim',
    category: ShopCategory.APPEARANCES,
    price: { currency: Currency.CREDITS, amount: 400 },
    itemId: 'skin-milim-star',
    rotation: 'always',
  },
  {
    id: 'offer-title-tempest',
    label: 'Titre : Seigneur de Tempest',
    category: ShopCategory.COSMETICS,
    price: { currency: Currency.CREDITS, amount: 200 },
    itemId: 'title-tempest',
    rotation: 'always',
  },
  {
    id: 'offer-palette-night',
    label: 'Palette Nuit de Jura',
    category: ShopCategory.COSMETICS,
    price: { currency: Currency.CREDITS, amount: 150 },
    itemId: 'palette-night',
    rotation: 'always',
  },
  {
    id: 'offer-emote-gobta',
    label: 'Emote : salut de Gobta',
    category: ShopCategory.COSMETICS,
    price: { currency: Currency.CREDITS, amount: 80 },
    itemId: 'emote-gobta-pose',
    rotation: 'daily',
  },
  {
    id: 'offer-vfx-water',
    label: 'Traînée d’eau',
    category: ShopCategory.COSMETICS,
    price: { currency: Currency.CREDITS, amount: 180 },
    itemId: 'vfx-water-trail',
    rotation: 'weekly',
  },
  {
    id: 'offer-music-dawn',
    label: 'Aube de la Fédération',
    category: ShopCategory.COSMETICS,
    price: { currency: Currency.CREDITS, amount: 250 },
    itemId: 'music-tempest-dawn',
    rotation: 'always',
  },
  {
    id: 'offer-pack-starter',
    label: 'Pack du Voyageur',
    category: ShopCategory.PACKS,
    price: { currency: Currency.CREDITS, amount: 300 },
    pack: [
      { itemId: 'emote-gobta-pose', qty: 1 },
      { itemId: 'title-tempest', qty: 1 },
    ],
    currencyGrant: { currency: Currency.TICKETS, amount: 5 },
    once: true,
  },
  {
    id: 'offer-tickets-1',
    label: '1 ticket d’invocation',
    category: ShopCategory.CURRENCY,
    price: { currency: Currency.CREDITS, amount: 80 },
    currencyGrant: { currency: Currency.TICKETS, amount: 1 },
  },
  {
    id: 'offer-tickets-10',
    label: '10 tickets d’invocation',
    category: ShopCategory.CURRENCY,
    price: { currency: Currency.CREDITS, amount: 720 },
    currencyGrant: { currency: Currency.TICKETS, amount: 10 },
  },
  {
    id: 'offer-premium-100',
    label: '100 Premium (test)',
    category: ShopCategory.CURRENCY,
    price: { currency: Currency.PREMIUM, amount: 0 },
    currencyGrant: { currency: Currency.PREMIUM, amount: 100 },
    premiumSku: 'premium_100',
  },
  {
    id: 'offer-premium-500',
    label: '500 Premium (test)',
    category: ShopCategory.CURRENCY,
    price: { currency: Currency.PREMIUM, amount: 0 },
    currencyGrant: { currency: Currency.PREMIUM, amount: 500 },
    premiumSku: 'premium_500',
  },
  {
    id: 'offer-premium-1200',
    label: '1200 Premium (test)',
    category: ShopCategory.CURRENCY,
    price: { currency: Currency.PREMIUM, amount: 0 },
    currencyGrant: { currency: Currency.PREMIUM, amount: 1200 },
    premiumSku: 'premium_1200',
  },
  {
    id: 'offer-event-walpurgis-music',
    label: 'Seuil de Walpurgis',
    category: ShopCategory.EVENT,
    price: { currency: Currency.CREDITS, amount: 320 },
    itemId: 'music-walpurgis-gate',
    eventId: 'premier-walpurgis',
  },
]

const OFFER_MAP = new Map(SHOP_OFFERS.map((offer) => [offer.id, offer]))

export function offerById(id: string): ShopOffer | undefined {
  return OFFER_MAP.get(id)
}

/** Compatibility with the old 4-row shop. */
export const SHOP_ITEMS = SHOP_OFFERS
  .filter((offer) => offer.itemId && (offer.category === ShopCategory.APPEARANCES || offer.category === ShopCategory.COSMETICS) && offer.rotation === 'always')
  .map((offer) => {
    const item = itemById(offer.itemId ?? '')
    return {
      id: offer.itemId ?? offer.id,
      name: item?.name ?? offer.label,
      cost: offer.price.amount,
      kind: item?.kind === ItemKind.APPEARANCE ? 'skin' as const : 'title' as const,
      fighterId: item?.fighterId,
    }
  })
