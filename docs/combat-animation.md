# Combat animation — Tensura Fan Fighting

Hybrid pipeline: **spritesheet + procedural VFX + camera + hit-stop**. Do not pack every effect into frames. Hyper DBZ is a quality reference only — never copy assets, poses, or code.

Canon: Light Novel for abilities, manga/anime for staging. Do not invent techniques or transformations. If unsure, leave a data hook.

## Existing systems (extend, do not replace)

| System | Role |
| --- | --- |
| `FighterState` | State machine (Idle, Walk, Dash, Attack, Skill, Ultimate, Transform, Hit, KO…) |
| `CombatSpectacle` | Afterimages, trails, speed lines, aura, impact VFX, camera follow |
| `HitStop` + `impactFeel` | Freeze + shake + flash per hit |
| `MotionProfile` | Per-fighter weight, idle breath, afterimage gate, smear, magic circle, blade trail |
| `kitFor()` | 3 lights, medium, heavy, 4 skills, ultimate (canon names only) |
| `CinematicManager` | Intro / ultimate / transform / victory cameras |
| Story `{ type: 'transform' }` | Body swap tied to `StoryState` / `appearanceFor()` |

## Add a fighter

1. `CharacterDefinition` in `src/config/characters.ts`
2. `MotionProfile` in `src/combat/feel/MotionProfile.ts` (afterimages only if the work justifies them)
3. `CombatStyle` in `src/vfx/CombatStyle.ts`
4. `kitFor()` skills — existing canon techniques, `startup` / `active` / `recovery`
5. Optional `AttackData.vfx` — must be an id `CombatSpectacle.play()` already knows
6. Sprite clips via the current spritesheet pipeline (`idle`, `walk`, `dash`, `attack`, `skill`, `ultimate`, `switch_in`…)
7. Optional cinematic ids: `ultimate_<id>`, `transform_<id>`, interaction pair in `cinematics/scripts/interactions.ts`

## Combos / skills / ultimates

Phases are **startup → active → recovery**. VFX fire when the attack **enters** the active window (`enteredPhase`). Recovery is real: the clip cannot be cancelled until `startup + active + recovery` unless an existing cancel window applies (light chain).

- Light / medium / heavy already exist on each kit.
- Skills: four slots, visually identified via `attackVfxId` (kind + motion profile).
- Ultimate: cinematic then gameplay hit. **Finisher** = Ultimate + KO or defender HP ≤ 18%. Themes are established pairs only (cave, holy war, naming, Hakurou Moon Fang).

## Transformation

Combat: Diablo **Demon Form**, Guy **True Dragon Lord** (kits). Story: `{ type: 'transform', appearanceId }` + `playTransformFeel`. Never give a later form in an earlier mission — `appearanceFor(story)` owns that.

Hakurou’s head-eye is story-only if a beat exists. Do not add an invented Hinata “spirit form” in Versus.

## Finishers / intros / bosses

- Finisher: `isFinisherHit` + `CombatSpectacle.onFinisher`
- Contextual intro: registered interaction pair, else `battle_intro`
- Boss phase 2: existing HP threshold on `PveEnemy` → `consumeBossPhase2` (music + VFX, no new moves)

## Debug (Fight / Training)

- **F3** — overlay (FPS, state, attack phase, hit-stop)
- **F4** — hitboxes / hurtboxes
- **F7** — pause on frame
- **F8** — step one frame
- **F1 / F2 / F6** — replay intro / ultimate / transform cinematic

Target **60 FPS**. Prefer fewer excellent clips over 50 repeated poses.
