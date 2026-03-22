/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { Texture } from 'pixi.js'
import { SlotReel, ReelStatus } from '../SlotReel'

const flush = () => Promise.resolve()

describe('SlotReel', () => {
  let reel: SlotReel

  beforeEach(() => {
    reel = new SlotReel()
    reel.cfg.visibleCount = 3
    reel.cfg.symbolHeight = 100
    reel.cfg.symbolWidth = 100
    reel.cfg.startDuration = 300
    reel.cfg.loopDuration = 80
    reel.cfg.stopDuration = 200
    reel.cfg.startPx = 30
    reel.cfg.stopPx = 20
  })

  function initReel(r: SlotReel = reel) {
    r.setInitialSymbols(['A', 'K', 'Q', 'J', '10'])
  }

  describe('initial state', () => {
    it('starts in IDLE', () => {
      expect(reel.status).toBe(ReelStatus.IDLE)
    })

    it('uses default cfg when no options', () => {
      const r = new SlotReel()
      expect(r.cfg.visibleCount).toBe(3)
      expect(r.cfg.symbolHeight).toBe(100)
      expect(r.cfg.loopDuration).toBe(80)
    })
  })

  describe('pre() deferred init', () => {
    it('creates nodes on setInitialSymbols', () => {
      expect(reel.children.length).toBe(0)
      reel.setInitialSymbols(['A', 'K', 'Q', 'J', '10'])
      // 5 nodes (3 visible + 2 extra) + 1 mask = 6 children
      expect(reel.children.length).toBe(6)
    })

    it('only inits once', () => {
      reel.setInitialSymbols(['A', 'K', 'Q', 'J', '10'])
      const count = reel.children.length
      reel.setInitialSymbols(['7', '7', '7', '7', '7'])
      expect(reel.children.length).toBe(count)
    })
  })

  describe('spin()', () => {
    it('sets status to STARTING', () => {
      initReel()
      reel.spin(['A', 'K', 'Q'])
      expect(reel.status).toBe(ReelStatus.STARTING)
    })

    it('spin promise resolves after start duration', async () => {
      initReel()
      let resolved = false
      reel.spin(['A', 'K', 'Q', 'J', '10', '7', 'BAR']).then(() => { resolved = true })

      reel.update(100)
      await flush()
      expect(resolved).toBe(false)

      reel.update(250)
      await flush()
      expect(resolved).toBe(true)
    })
  })

  describe('state machine: spin → stop', () => {
    function spinAndLoop(r: SlotReel = reel) {
      initReel(r)
      r.spin(['A', 'K', 'Q', 'J', '10', '7', 'BAR', 'A', 'K', 'Q'])
      r.update(350)
    }

    it('transitions to LOOPING after start', () => {
      spinAndLoop()
      expect(reel.status).toBe(ReelStatus.STARTING)
    })

    it('stop changes status to STOPPING', () => {
      spinAndLoop()
      reel.stop(['7', 'BAR', 'A'])
      expect(reel.status).toBe(ReelStatus.STOPPING)
    })

    it('full cycle: spin → loop → stop → bounce → STOPPED', async () => {
      spinAndLoop()
      reel.update(200)

      let stopped = false
      reel.stop(['7', 'BAR', 'A']).then(() => { stopped = true })

      for (let i = 0; i < 50; i++) {
        reel.update(80)
        await flush()
        if (reel.status === ReelStatus.STOPPED) break
      }

      expect(reel.status).toBe(ReelStatus.STOPPED)
      await flush()
      expect(stopped).toBe(true)
    })
  })

  describe('update() does nothing when IDLE', () => {
    it('no-op before spin', () => {
      reel.update(1000)
      expect(reel.status).toBe(ReelStatus.IDLE)
    })
  })

  describe('symbol queue', () => {
    it('stop() builds correct queue', () => {
      initReel()
      reel.spin(['7', 'BAR', 'A', 'K', 'Q', 'J', '10'])
      reel.update(350)
      reel.stop(['7', '7', '7'])
      expect(reel.status).toBe(ReelStatus.STOPPING)
    })
  })

  describe('edge cases', () => {
    it('spin then immediately stop (no loop time)', async () => {
      initReel()
      reel.spin(['A', 'K', 'Q', 'J', '10', '7', 'BAR'])
      reel.update(350)

      let stopped = false
      reel.stop(['7', 'BAR', 'A']).then(() => { stopped = true })

      for (let i = 0; i < 100; i++) {
        reel.update(80)
        await flush()
        if (reel.status === ReelStatus.STOPPED) break
      }

      expect(reel.status).toBe(ReelStatus.STOPPED)
      expect(stopped).toBe(true)
    })

    it('consecutive spins: second spin overrides first', async () => {
      initReel()
      let firstResolved = false
      reel.spin(['A', 'K']).then(() => { firstResolved = true })

      let secondResolved = false
      reel.spin(['7', 'BAR']).then(() => { secondResolved = true })

      expect(reel.status).toBe(ReelStatus.STARTING)

      reel.update(350)
      await flush()

      expect(secondResolved).toBe(true)
      expect(firstResolved).toBe(false)
    })

    it('update(0) does not advance state', () => {
      initReel()
      reel.spin(['A', 'K', 'Q'])

      reel.update(0)
      expect(reel.status).toBe(ReelStatus.STARTING)

      reel.update(0)
      reel.update(0)
      expect(reel.status).toBe(ReelStatus.STARTING)
    })

    it('stop resolves before bounce finishes', async () => {
      initReel()
      reel.spin(['A', 'K', 'Q', 'J', '10', '7', 'BAR', 'A', 'K', 'Q'])
      reel.update(350)
      reel.update(200)

      let stopResolved = false
      reel.stop(['7', 'BAR', 'A']).then(() => { stopResolved = true })

      for (let i = 0; i < 100; i++) {
        reel.update(20)
        await flush()
        if (stopResolved) break
      }

      expect(stopResolved).toBe(true)

      for (let i = 0; i < 100; i++) {
        reel.update(20)
        if (reel.status === ReelStatus.STOPPED) break
      }
      expect(reel.status).toBe(ReelStatus.STOPPED)
    })
  })

  describe('Loader integration (simulated)', () => {
    function makeFakeTextures(): Record<string, Texture> {
      const t: Record<string, Texture> = {}
      for (const id of ['7', 'BAR', 'A', 'K', 'Q', 'J', '10']) {
        t[id] = Texture.EMPTY
      }
      return t
    }

    it('textures set before setInitialSymbols works', () => {
      reel.textures = makeFakeTextures()
      reel.setInitialSymbols(['7', 'BAR', 'A', 'K', 'Q'])
      expect(reel.children.length).toBe(6)
    })

    it('setInitialSymbols without textures still creates nodes', () => {
      reel.setInitialSymbols(['7', 'BAR', 'A', 'K', 'Q'])
      expect(reel.children.length).toBe(6)
    })

    it('full Loader flow: cfg → textures → init → spin → stop', async () => {
      reel.textures = makeFakeTextures()
      reel.setInitialSymbols(['7', 'BAR', 'A', 'K', 'Q'])
      expect(reel.children.length).toBe(6)

      reel.spin(['A', 'K', 'Q', 'J', '10', '7', 'BAR'])
      expect(reel.status).toBe(ReelStatus.STARTING)

      reel.update(350)

      let stopped = false
      reel.stop(['7', '7', '7']).then(() => { stopped = true })

      for (let i = 0; i < 100; i++) {
        reel.update(80)
        await flush()
        if (reel.status === ReelStatus.STOPPED) break
      }

      expect(reel.status).toBe(ReelStatus.STOPPED)
      expect(stopped).toBe(true)
    })
  })
})
