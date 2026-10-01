import { setPadIndex, setP1UsesPad } from './BindingStore.ts'

export interface DeviceInfo {
  index: number
  id: string
  buttons: number
}

let lastToast = ''

export function listGamepads(): DeviceInfo[] {
  if (!navigator.getGamepads) {
    return []
  }
  const out: DeviceInfo[] = []
  const pads = navigator.getGamepads()
  for (let i = 0; i < pads.length; i += 1) {
    const pad = pads[i]
    if (pad) {
      out.push({ index: i, id: pad.id, buttons: pad.buttons.length })
    }
  }
  return out
}

export function installDeviceWatch(onToast: (message: string) => void): void {
  window.addEventListener('gamepadconnected', (event) => {
    const pad = event.gamepad
    setPadIndex(pad.index)
    setP1UsesPad(true)
    lastToast = pad.id
    onToast(`CONTROLLER CONNECTED\n${pad.id}`)
  })
  window.addEventListener('gamepaddisconnected', (event) => {
    setP1UsesPad(false)
    onToast(`CONTROLLER DISCONNECTED\n${event.gamepad.id}`)
  })
}

export function rumble(durationMs = 40, intensity = 0.35): void {
  const pads = navigator.getGamepads?.() ?? []
  for (const pad of pads) {
    const actuator = pad?.vibrationActuator
    if (actuator && typeof actuator.playEffect === 'function') {
      void actuator.playEffect('dual-rumble', {
        duration: durationMs,
        startDelay: 0,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.6,
      })
    }
  }
}

export function lastDeviceName(): string {
  return lastToast
}
