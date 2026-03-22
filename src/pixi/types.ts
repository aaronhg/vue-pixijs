export interface GlowCircleProps {
  radius?: number
  color?: number
  glowColor?: number
  glowAlpha?: number
  glowSize?: number
}

export interface SlotReelProps {
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
