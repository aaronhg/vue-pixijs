<script setup lang="ts">
import { Application } from 'vue3-pixi'
import SlotScene from './SlotScene.vue'
</script>

<template>
  <Application :width="800" :height="550" :background="0x12122a">
    <SlotScene />
  </Application>
</template>
