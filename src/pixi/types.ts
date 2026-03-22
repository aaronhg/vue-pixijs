import type { ContainerProps } from 'vue3-pixi'

export interface GlowCircleProps extends /* @vue-ignore */ ContainerProps {
  radius?: number
  color?: number
  glowColor?: number
  glowAlpha?: number
  glowSize?: number
}

export interface SlotReelProps extends /* @vue-ignore */ ContainerProps {
  visibleCount?: number
  symbolHeight?: number
  symbolWidth?: number
  startDuration?: number
  loopDuration?: number
  stopDuration?: number
  startPx?: number
  stopPx?: number
  reelIndex?: number
}

declare module '@vue/runtime-core' {
  interface GlobalComponents {
    GlowCircle: (props: GlowCircleProps) => any
    PixiGlowCircle: (props: GlowCircleProps) => any
    SlotReel: (props: SlotReelProps) => any
    PixiSlotReel: (props: SlotReelProps) => any
  }
}
