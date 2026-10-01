export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  MainMenu: 'MainMenuScene',
  Hub: 'HubScene',
  ModeSelect: 'ModeSelectScene',
  CharacterSelect: 'CharacterSelectScene',
  Characters: 'CharactersScene',
  Training: 'TrainingScene',
  Settings: 'SettingsScene',
  Account: 'AccountScene',
  Controls: 'ControlsScene',
  Fight: 'FightScene',
  Result: 'ResultScene',
  Story: 'StoryScene',
  StoryPlay: 'StoryPlayScene',
  Online: 'OnlineScene',
  Shop: 'ShopScene',
  Summon: 'SummonScene',
  PatchNotes: 'PatchNotesScene',
  Events: 'EventsScene',
} as const

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys]
