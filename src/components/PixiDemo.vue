<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Application } from 'vue3-pixi'
import { Graphics as PixiGraphics } from 'pixi.js'
import '../pixi/types'

const colors = [0xe94560, 0x533483, 0x0f3460, 0x16213e, 0x3b82f6, 0x60a5fa]

const bunnyX = ref(400)
const bunnyY = ref(300)
const dragging = ref(false)

function onDragStart() {
  dragging.value = true
}

function onDragEnd() {
  dragging.value = false
}

function onDragMove(e: any) {
  if (dragging.value) {
    bunnyX.value = e.global.x
    bunnyY.value = e.global.y
  }
}

function drawRoundedRect(g: PixiGraphics) {
  g.clear()
  g.roundRect(0, 0, 200, 80, 16)
  g.fill({ color: 0x3b82f6, alpha: 0.8 })
  g.stroke({ color: 0x60a5fa, width: 2 })
}

const rotation = ref(0)
let animating = true

onMounted(() => {
  function animate() {
    if (animating) {
      rotation.value += 0.01
      requestAnimationFrame(animate)
    }
  }
  animate()
})
</script>

<template>
  <Application :width="800" :height="600" :background="0x1a1a2e">
    <!-- Background decorative circle -->
    <graphics
      :x="400"
      :y="300"
      @effect="(g: PixiGraphics) => {
        g.clear()
        g.circle(0, 0, 150)
        g.fill({ color: 0x16213e })
        g.stroke({ color: 0x0f3460, width: 3 })
      }"
    />

    <!-- Rotating container with custom GlowCircle -->
    <container :x="400" :y="300" :rotation="rotation">
      <glow-circle
        v-for="i in 6"
        :key="i"
        :x="Math.cos((i * Math.PI * 2) / 6) * 100"
        :y="Math.sin((i * Math.PI * 2) / 6) * 100"
        :radius="20"
        :color="colors[i - 1]"
        :glow-color="colors[i - 1]"
        :glow-alpha="0.4"
        :glow-size="15"
      />
    </container>

    <!-- Draggable label -->
    <container
      :x="bunnyX"
      :y="bunnyY"
      :interactive="true"
      :cursor="'pointer'"
      @pointerdown="onDragStart"
      @pointerup="onDragEnd"
      @pointerupoutside="onDragEnd"
      @pointermove="onDragMove"
    >
      <graphics @effect="drawRoundedRect" />
      <pixi-text
        :x="100"
        :y="40"
        :anchor="0.5"
        text="Drag Me!"
        :style="{
          fill: 0xffffff,
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'bold',
        }"
      />
    </container>

    <!-- Title text -->
    <pixi-text
      :x="400"
      :y="50"
      :anchor="0.5"
      text="Vue 3 + PixiJS Demo"
      :style="{
        fill: 0xe94560,
        fontSize: 32,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      }"
    />
  </Application>
</template>
