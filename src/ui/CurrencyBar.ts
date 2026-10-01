import type Phaser from 'phaser'
import { FONT_UI, UI } from './theme.ts'

export function currencyBarText(credits: number, premium: number, tickets: number, fragments = 0): string {
  return `Crédits  ${credits}     Premium  ${premium}     Tickets  ${tickets}     Fragments  ${fragments}`
}

export function drawCurrencyBar(
  scene: Phaser.Scene,
  credits: number,
  premium: number,
  tickets: number,
  fragments = 0,
): Phaser.GameObjects.Text {
  return scene.add.text(960, 36, currencyBarText(credits, premium, tickets, fragments), {
    fontFamily: FONT_UI,
    fontSize: '20px',
    color: UI.gold,
  }).setOrigin(0.5, 0)
}
