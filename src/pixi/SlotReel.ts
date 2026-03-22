import { Container, Graphics, Text, TextStyle } from 'pixi.js'

export const ReelStatus = {
  IDLE: 0,
  STARTING: 1,
  STOPPING: 2,
  LOOPING: 3,
  STOP_BOUNCE: 4,
  STOPPED: 5,
} as const

export type ReelStatus = typeof ReelStatus[keyof typeof ReelStatus]

export interface SlotReelOptions {
  visibleCount?: number
  symbolHeight?: number
  symbolWidth?: number
  startDuration?: number
  loopDuration?: number
  stopDuration?: number
  startPx?: number
  stopPx?: number
}

const DEFAULTS: Required<SlotReelOptions> = {
  visibleCount: 3,
  symbolHeight: 100,
  symbolWidth: 100,
  startDuration: 300,
  loopDuration: 80,
  stopDuration: 200,
  startPx: 30,
  stopPx: 20,
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export class SlotReel extends Container {
  public status: ReelStatus = ReelStatus.IDLE
  public index: number = 0
  public cfg: Required<SlotReelOptions>

  private total: number = 0
  private nodes: Container[] = []
  private symbolNodes: Container[] = []
  private symbols: string[] = []
  private symbolIndex: number = 0
  private delta: number = 0
  private privateStatus: ReelStatus = ReelStatus.IDLE
  private resolve: (() => void) | null = null
  private loaded = false

  public createSymbolView: (id: string) => Container
  public updateSymbolView: (node: Container, id: string, blur: boolean) => void

  constructor() {
    super()
    this.cfg = { ...DEFAULTS }

    this.createSymbolView = (id) => {
      const c = new Container()
      const bg = new Graphics()
      bg.roundRect(0, 0, this.cfg.symbolWidth, this.cfg.symbolHeight - 4, 8)
      bg.fill({ color: 0x2a2a4a })
      bg.stroke({ color: 0x444477, width: 1 })
      c.addChild(bg)
      const t = new Text({
        text: id || '?',
        style: new TextStyle({ fill: 0xffffff, fontSize: 28, fontFamily: 'Arial' }),
      })
      t.anchor.set(0.5)
      t.x = this.cfg.symbolWidth / 2
      t.y = this.cfg.symbolHeight / 2
      c.addChild(t)
      return c
    }

    this.updateSymbolView = (node, id, blur) => {
      const t = node.children[1] as Text
      if (t) {
        t.text = id || '?'
        t.alpha = blur ? 0.4 : 1
      }
    }
  }

  /** 延遲初始化，等 patchProp 設完 cfg 後才建節點 */
  private pre() {
    if (this.loaded) return
    this.loaded = true
    this.total = this.cfg.visibleCount + 2

    for (let i = 0; i < this.total; i++) {
      const root = new Container()
      const sym = this.createSymbolView('')
      root.y = (this.total - 1 - i) * this.cfg.symbolHeight - this.cfg.symbolHeight
      root.addChild(sym)
      this.nodes[i] = root
      this.symbolNodes[i] = sym
      this.addChild(root)
    }

    // mask 限制可見區域
    const mask = new Graphics()
    mask.rect(0, 0, this.cfg.symbolWidth, this.cfg.visibleCount * this.cfg.symbolHeight)
    mask.fill({ color: 0xffffff })
    this.addChild(mask)
    this.mask = mask
  }

  public setInitialSymbols(ids: string[]) {
    this.pre()
    const arr = [...this.symbolNodes].reverse()
    for (let i = 0; i < arr.length; i++) {
      this.updateSymbolView(arr[i], ids[i] ?? '', false)
    }
  }

  public spin(symbols: string[]): Promise<void> {
    this.pre()
    this.symbols = this.getAllSymbols().concat(symbols)
    this.symbolIndex = 0
    this.delta = 0
    this.status = ReelStatus.STARTING
    this.privateStatus = ReelStatus.STARTING
    return new Promise((r) => { this.resolve = r })
  }

  public stop(symbols: string[]): Promise<void> {
    this.status = ReelStatus.STOPPING
    this.privateStatus = ReelStatus.LOOPING
    const cur = this.getAllSymbols()
    // 佇列: [當前] + [bottom extra, 結果, top extra]
    this.symbols = [...cur, cur[0], ...symbols, cur[cur.length - 1]]
    this.symbolIndex = 0
    this.resolve?.()
    return new Promise((r) => { this.resolve = r })
  }

  public update(dtMs: number) {
    if (this.privateStatus === ReelStatus.IDLE) return
    this.delta += dtMs

    switch (this.privateStatus) {
      case ReelStatus.STARTING: this.handleStart(); break
      case ReelStatus.LOOPING: this.handleLoop(); break
      case ReelStatus.STOP_BOUNCE: this.handleStopBounce(); break
    }
  }

  // ── 狀態機 ──

  private handleStart() {
    const dur = this.cfg.startDuration
    if (this.delta >= dur) {
      this.delta -= dur
      this.resolve?.()
      this.resolve = null
      this.privateStatus = ReelStatus.LOOPING
      this.handleLoop()
    } else {
      const pct = clamp01(this.delta / dur)
      this.applySymbols(pct > 0.6)
      // easeOutBack: 先往上彈再回來
      const t = pct
      const s = 1.7
      const inv = 1 - t
      const curve = 1 - inv * inv * ((s + 1) * inv - s)
      // curve 從 0 → 超過 1 → 回到 1，取 (1-curve) 讓它從 1→負→0
      this.offsetY(-(1 - curve) * this.cfg.startPx)
    }
  }

  private handleLoop() {
    const { loopDuration, symbolHeight } = this.cfg
    const step = Math.floor(this.delta / loopDuration)
    this.delta %= loopDuration

    if (step) {
      this.symbolIndex += step
      this.symbolIndex %= this.symbols.length
    }

    const isStopping = this.status === ReelStatus.STOPPING
    if (isStopping && this.symbolIndex >= this.symbols.length - this.total) {
      this.resolve?.()
      this.resolve = null
      this.delta = 0
      this.privateStatus = ReelStatus.STOP_BOUNCE
      this.symbolIndex = this.symbols.length - this.total
      this.applySymbols(false)
      this.handleStopBounce()
    } else {
      if (step) this.applySymbols(true)
      this.offsetY((this.delta / loopDuration) * symbolHeight)
    }
  }

  private handleStopBounce() {
    const { stopDuration, stopPx } = this.cfg
    if (this.delta >= stopDuration) {
      this.privateStatus = ReelStatus.IDLE
      this.status = ReelStatus.STOPPED
      this.resolve?.()
      this.resolve = null
      this.offsetY(0)
    } else {
      const pct = this.delta / stopDuration
      // 阻尼彈跳: sin 衰減
      const bounce = Math.sin(pct * Math.PI * 2.5) * Math.exp(-pct * 4)
      this.offsetY(bounce * stopPx)
    }
  }

  // ── 內部工具 ──

  private offsetY(y: number) {
    for (const node of this.symbolNodes) node.y = y
  }

  private applySymbols(blur: boolean) {
    const arr = [...this.symbolNodes].reverse()
    for (let i = 0; i < arr.length; i++) {
      const idx = (this.symbolIndex + i) % this.symbols.length
      this.updateSymbolView(arr[i], this.symbols[idx], blur)
    }
  }

  private getAllSymbols(): string[] {
    return [...this.symbolNodes].reverse().map((n) => {
      const t = n.children[1] as Text
      return t?.text || ''
    })
  }
}
