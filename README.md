# vue-pixijs

Vue 3 + PixiJS v8 integration using [vue3-pixi](https://vue3-pixi.vercel.app/) custom renderer.

## Setup

```bash
npm install
npm run dev
```

## Demos

- **PixiDemo** — Graphics drawing, GlowCircle custom element, drag interaction
- **SlotDemo** — 5-reel slot machine with spritesheet atlas, spin/stop animation

Switch demo in `src/App.vue`.

## Custom PixiJS Elements

| Tag | Class | Description |
|-----|-------|-------------|
| `<glow-circle>` | `GlowCircle` | Circle with glow effect (extends Graphics) |
| `<slot-reel>` | `SlotReel` | Slot machine reel (extends Container) |

## Atlas

`public/symbols/` contains a TexturePacker JSON Hash spritesheet for slot symbols.

## Tests

```bash
npm test
```

## Tech Stack

- Vue 3.5 + TypeScript
- PixiJS 8
- vue3-pixi 1.0.0-rc.1
- Vite 8
- Vitest
