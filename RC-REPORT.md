# Tensura Fan Fighting — Release Candidate 0.9.1

Fan prototype, non-commercial. Phaser 3 + Vite + TypeScript. 2D placeholders only.

## Architecture

`src/game` boot + config · `src/scenes` menus/fight · `src/combat` hits/damage · `src/characters` fighters · `src/config` roster/kits/live · `src/input` bindings · `src/ai` · `src/vfx` · `src/audio` · `src/save` · `src/network` stubs · `src/pipeline` 3D later · `src/tests` QA at preload.

## Playable roster (11)

Rimuru, Milim, Diablo, Benimaru, Shion, Veldora, Hinata, Guy, Shuna, Souei, Hakurou.

Launch F2P core: Rimuru, Benimaru, Shion, Shuna, Souei, Hakurou, Milim, Veldora.

## Modes

Versus CPU, Versus local (P1 then P2 select; P2 arrows+numpad), Arcade, Survival, Story, Training, Online (unavailable), Shop, Events/Roadmap.

## Systems

Combat (guard, combo, projectiles, skills, ult) · elements/resist · absorb (Rimuru) · transform · AI EASY–EXPERT · VFX + hitstop · adaptive music 1v1 · XP/credits/cosmetics · save v3 · offline-first online stubs.

## Performance target

60 FPS logical 1920×1080 FIT. Phaser chunk ~1.3 MB expected.

## Known gaps (not blocking prototype)

No licensed Tensura art · no Meshy GLB · no real game server · kits share base normals with unique skills · music is synthesized not orchestral · 3v3 spec deferred.

## Build

`npm run build` (tsc + vite). Tests run in PreloadScene.
