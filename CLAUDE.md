# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 + PixiJS v8 integration project using **vue3-pixi** (custom Vue renderer). Demonstrates rendering PixiJS scenes declaratively via Vue templates, including custom PixiJS class registration.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check (vue-tsc) then build for production, then run postbuild obfuscation
- `npm run preview` — Preview production build

- `npm run test` — Run tests (vitest)
- `npm run test:watch` — Watch mode

No linter configured.

## Architecture

### vue3-pixi Integration Pattern

vue3-pixi provides a custom Vue renderer that maps Vue template elements to PixiJS objects. Key integration points:

1. **`vite.config.ts`** — Must register `compilerOptions` from `vue3-pixi/compiler` so Vue doesn't treat PixiJS tags (`<container>`, `<graphics>`, `<text>`) as unknown HTML elements. Custom element tags (e.g., `glow-circle`, `slot-reel`) must also be listed in `isCustomElement`.

2. **`src/pixi/renderer.ts`** — Registers custom PixiJS classes with `renderer.use()` from vue3-pixi. Imported as a side-effect in `main.ts`.

3. **`src/pixi/types.ts`** — TypeScript declarations for custom elements via `GlobalComponents` module augmentation on `@vue/runtime-core`.

### Critical: vue3-pixi createElement Caveat

**`createElement(props)` receives all prop values as `undefined`**. vue3-pixi calls `createElement` first, then sets values via `patchProp` calls. Therefore:
- `createElement` must construct with defaults only (no props)
- `patchProp` must write config values onto the instance
- Any initialization depending on config must be **deferred** (lazy `pre()` pattern — triggered on first use like `spin()` or `setInitialSymbols()`)

### Custom PixiJS Class Registration (3 files)

To add a new custom PixiJS class:
1. **`src/pixi/MyClass.ts`** — The PixiJS class extending `Container`, `Graphics`, etc.
2. **`src/pixi/renderer.ts`** — Register via `renderer.use({ name, createElement, patchProp })`
3. **`src/pixi/types.ts`** — Add `GlobalComponents` type declaration
4. **`vite.config.ts`** — Add kebab-case tag to `isCustomElement` array

### vue3-pixi Composables

`onReady`, `onTick`, and `useApplication` use Vue's `inject` to access the PixiJS Application. They **must be called inside a child component** of `<Application>`, not in the same component that renders `<Application>`. This is why the scene content is in `SlotScene.vue` (child) rather than `SlotDemo.vue` (parent that renders `<Application>`).

### Graphics Drawing

Use `@effect` (not `@render`, which is deprecated) for reactive Graphics drawing. The callback receives the Graphics instance: `@effect="(g: Graphics) => { g.clear(); ... }"`.

### `<pixi-text>` not `<text>`

Use `<pixi-text>` instead of `<text>` in templates. `<text>` causes TypeScript errors because Vue treats its `:style` prop as an SVG `style` attribute, conflicting with PixiJS `TextStyle`. All vue3-pixi built-in elements support the `pixi-` prefix.

### Spritesheet Atlas

Symbol textures are loaded as a PixiJS `Spritesheet` atlas (`public/symbols/symbols.json` + `symbols.png`). The JSON format is **TexturePacker JSON Hash** (also known as PixiJS format). Can be regenerated with TexturePacker (Data Format: PixiJS) or `spritesheet-js`.

Atlas is loaded by vue3-pixi's `<Loader>` component in `SlotScene.vue`, which passes textures to `<slot-reel>` via the `:textures` prop. `SlotReel` itself is fully synchronous — no `Assets.load()` inside.

### Postbuild Asset Obfuscation

`scripts/postbuild.mjs` runs after `vite build`. It hashes filenames of static assets (`public/spine/`, `public/symbols/`) and moves them into `dist/assets/`, then updates all references in JS/HTML/atlas/JSON files. Source code keeps readable paths (`spine/spineboy-pro.skel`), only the build output is obfuscated.

### PixiJS DevTools

`globalThis.__PIXI_APP__` is set via `onReady` in `SlotScene.vue` for Chrome PixiJS DevTools extension.

## Key Dependencies

- **pixi.js** v8 — Canvas/WebGL rendering
- **vue3-pixi** v1.0.0-rc.1 — Custom Vue renderer for PixiJS (no Vue plugin registration needed, `<Application>` is imported directly)
- **@esotericsoftware/spine-pixi-v8** — Spine animation runtime for PixiJS v8
