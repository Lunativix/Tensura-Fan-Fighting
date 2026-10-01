export interface RoadmapSlot {
  id: string
  name: string
  priority: 'high' | 'medium' | 'future'
  status: 'available' | 'planned'
  free: boolean
}

export const CONTENT_ROADMAP: readonly RoadmapSlot[] = [
  { id: 'rimuru', name: 'Rimuru', priority: 'high', status: 'available', free: true },
  { id: 'milim', name: 'Milim', priority: 'high', status: 'available', free: true },
  { id: 'benimaru', name: 'Benimaru', priority: 'high', status: 'available', free: true },
  { id: 'shion', name: 'Shion', priority: 'high', status: 'available', free: true },
  { id: 'shuna', name: 'Shuna', priority: 'high', status: 'available', free: true },
  { id: 'souei', name: 'Souei', priority: 'high', status: 'available', free: true },
  { id: 'hakurou', name: 'Hakurou', priority: 'high', status: 'available', free: true },
  { id: 'veldora', name: 'Veldora', priority: 'high', status: 'available', free: true },
  { id: 'diablo', name: 'Diablo', priority: 'high', status: 'available', free: true },
  { id: 'hinata', name: 'Hinata', priority: 'high', status: 'available', free: true },
  { id: 'guy', name: 'Guy Crimson', priority: 'high', status: 'available', free: true },
  { id: 'luminous', name: 'Luminous', priority: 'high', status: 'planned', free: false },
  { id: 'leon', name: 'Leon', priority: 'high', status: 'planned', free: false },
  { id: 'ranga', name: 'Ranga', priority: 'high', status: 'planned', free: true },
  { id: 'gabiru', name: 'Gabiru', priority: 'high', status: 'planned', free: true },
  { id: 'ramiris', name: 'Ramiris', priority: 'medium', status: 'planned', free: true },
]
