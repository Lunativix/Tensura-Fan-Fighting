import './style.css'
import { startGame } from './game/Game.ts'

const root = document.getElementById('game-root')
if (!root) {
  throw new Error('Missing #game-root')
}

startGame(root)
