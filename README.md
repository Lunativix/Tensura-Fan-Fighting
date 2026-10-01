# Tensura Fan Fighting

**Projet en cours.** Prototype jouable, pas une version finie : roster, sprites, story, online et polish évoluent encore.

Fan project non commercial, inspiré de *That Time I Got Reincarnated as a Slime*.

Phaser 3 · Vite · TypeScript. Version en jeu : **0.11.0** (Tempest RC).

## Lancer

```bash
npm install
npm run dev
```

Build : `npm run build`  
Aperçu : `npm run preview`  
Typecheck : `npm test`

Ouvre l’URL Vite (souvent `http://localhost:5173`).

## Modes

Versus CPU, versus local (P2 : flèches + pavé numérique), arcade, survival, story, training, shop. Online = stub.

Variantes narratives (select mode) : **FREE** / **CHRONOLOGY** / **CUSTOM** — apparence et kit selon la chronologie LN, sans inventer d’arcs.

## Roster

Rimuru, Milim, Diablo, Benimaru, Shion, Veldora, Hinata, Guy, Shuna, Souei, Hakurou.

Chaque perso : lights / medium / heavy, 4 skills, ultimate. Rimuru absorbe. Transformations et formes d’histoire suivent le Story State (slime jusqu’à Shizu).

## Contrôles (P1, preset default)

| Action | Touche |
| --- | --- |
| Déplacer / sauter | A D W S (ZQSD en AZERTY) |
| Garde | Shift |
| Light / Medium / Heavy | J K L |
| Dash | Espace |
| Skills | U I O P |
| Ultimate | H |
| Pause | Échap |

P2 : flèches, attaques sur le pavé numérique.

Debug combat : F3 overlay, F4 hitboxes.

## Art & sprites

Pipeline frame-par-frame dans `public/sprites/` (`anim.json` + PNG). Flatten / index / validate :

```bash
npm run index-sprites
npm run validate-sprites
```

Les VFX, projectiles et beams sont spawnés par le moteur, pas dessinés dans le sprite.

## Story

Scénario paraphrasé d’après le light novel (ordre des événements, pas de citation verbatim). Manga / anime = visuel et rythme.

## Licence

Œuvre de fan. *Tensei Shitara Slime Datta Ken* appartient à Fuse / Kodansha / Micro Magazine et ayants droit. Aucune affiliation. Pas de assets officiels licenciés. Pas de serveur online réel.
