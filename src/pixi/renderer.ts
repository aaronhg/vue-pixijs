import { renderer, patchProp as defPatchProp } from 'vue3-pixi'
import { GlowCircle } from './GlowCircle'
import { SlotReel } from './SlotReel'

const glowCircleProps = ['radius', 'color', 'glowColor', 'glowAlpha', 'glowSize'] as const

renderer.use({
  name: 'GlowCircle',
  createElement: () => new GlowCircle(),
  patchProp(el, key, prevValue, nextValue) {
    if (glowCircleProps.includes(key as any)) {
      (el as any)[key] = nextValue
      return
    }
    defPatchProp(el, key, prevValue, nextValue)
  },
})

const slotReelCfgProps = [
  'visibleCount', 'symbolHeight', 'symbolWidth',
  'startDuration', 'loopDuration', 'stopDuration',
  'startPx', 'stopPx',
] as const

renderer.use({
  name: 'SlotReel',
  createElement: () => new SlotReel(),
  patchProp(el, key, prevValue, nextValue) {
    const reel = el as SlotReel
    if (slotReelCfgProps.includes(key as any)) {
      reel.cfg[key as keyof typeof reel.cfg] = nextValue
      return
    }
    if (key === 'reelIndex') {
      reel.index = nextValue
      return
    }
    if (key === 'textures') {
      reel.textures = nextValue ?? {}
      return
    }
    defPatchProp(el, key, prevValue, nextValue)
  },
})
