<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Loader, onReady, onTick } from 'vue3-pixi'
import { Graphics as PixiGraphics, Ticker } from 'pixi.js'
import { SlotReel } from '../pixi/SlotReel'
import '../pixi/types'

const SYMBOLS = ['7', 'BAR', 'A', 'K', 'Q', 'J', '10']
const REEL_COUNT = 5
const VISIBLE = 3
const SYMBOL_W = 120
const SYMBOL_H = 100

const reelRefs = ref<SlotReel[]>([])
const spinning = ref(false)
let reelsReady = false

function randomSymbols(count: number): string[] {
  return Array.from({ length: count }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
}

function setReelRef(index: number) {
  return (el: any) => {
    if (el) reelRefs.value[index] = el
  }
}

onReady((app) => {
  ;(globalThis as any).__PIXI_APP__ = app
})

// 只讀 .length 避免深度遍歷 PixiJS Container
watchEffect(() => {
  if (reelsReady || reelRefs.value.length < REEL_COUNT) return
  for (const reel of reelRefs.value) {
    reel.setInitialSymbols(randomSymbols(VISIBLE + 2))
  }
  reelsReady = true
})

onTick((ticker: Ticker) => {
  const dtMs = ticker.deltaMS
  for (const reel of reelRefs.value) {
    reel.update(dtMs)
  }
})

async function handleSpin() {
  if (spinning.value || !reelsReady) return
  spinning.value = true

  reelRefs.value.forEach((reel) => reel.spin(randomSymbols(20)))

  for (let i = 0; i < reelRefs.value.length; i++) {
    await new Promise((r) => setTimeout(r, 300 + i * 200))
    const result = randomSymbols(VISIBLE)
    await reelRefs.value[i].stop(result)
  }

  spinning.value = false
}

function drawBg(g: PixiGraphics) {
  g.clear()
  g.roundRect(0, 0, REEL_COUNT * (SYMBOL_W + 10) + 30, VISIBLE * SYMBOL_H + 40, 16)
  g.fill({ color: 0x0d0d2b })
  g.stroke({ color: 0x3b3b6b, width: 2 })
}

function drawButton(g: PixiGraphics) {
  g.clear()
  g.roundRect(0, 0, 160, 50, 12)
  g.fill({ color: spinning.value ? 0x444466 : 0xe94560 })
}
</script>

<template>
  <!-- Title -->
  <pixi-text
    :x="400"
    :y="30"
    :anchor="0.5"
    text="SlotReel Demo"
    :style="{
      fill: 0xe94560,
      fontSize: 28,
      fontFamily: 'Arial',
      fontWeight: 'bold',
    }"
  />

  <Loader :resources="{ symbols: '/symbols/symbols.json' }">
    <template #default="{ textures }">
      <!-- Reel background -->
      <graphics :x="50" :y="60" @effect="drawBg" />

      <!-- Reels -->
      <slot-reel
        v-for="i in REEL_COUNT"
        :key="i"
        :ref="setReelRef(i - 1)"
        :x="70 + (i - 1) * (SYMBOL_W + 10)"
        :y="80"
        :visible-count="VISIBLE"
        :symbol-height="SYMBOL_H"
        :symbol-width="SYMBOL_W"
        :reel-index="i - 1"
        :textures="textures.symbols?.textures ?? {}"
        :start-duration="250"
        :loop-duration="60"
        :stop-duration="180"
        :start-px="25"
        :stop-px="15"
      />

      <!-- Spin button -->
      <container
        :x="320"
        :y="470"
        :interactive="true"
        :cursor="'pointer'"
        @pointertap="handleSpin"
      >
        <graphics @effect="drawButton" />
        <pixi-text
          :x="80"
          :y="25"
          :anchor="0.5"
          :text="spinning ? 'SPINNING...' : 'SPIN'"
          :style="{
            fill: 0xffffff,
            fontSize: 20,
            fontFamily: 'Arial',
            fontWeight: 'bold',
          }"
        />
      </container>
    </template>

    <template #fallback="{ progress }">
      <pixi-text
        :x="400"
        :y="275"
        :anchor="0.5"
        :text="`Loading... ${Math.round(progress * 100)}%`"
        :style="{
          fill: 0x888888,
          fontSize: 24,
          fontFamily: 'Arial',
        }"
      />
    </template>
  </Loader>
</template>
