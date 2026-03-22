import { Graphics } from 'pixi.js'

export interface GlowCircleOptions {
  radius?: number
  color?: number
  glowColor?: number
  glowAlpha?: number
  glowSize?: number
}

export class GlowCircle extends Graphics {
  private _radius: number
  private _color: number
  private _glowColor: number
  private _glowAlpha: number
  private _glowSize: number

  constructor(options: GlowCircleOptions = {}) {
    super()
    this._radius = options.radius ?? 30
    this._color = options.color ?? 0xffffff
    this._glowColor = options.glowColor ?? options.color ?? 0xffffff
    this._glowAlpha = options.glowAlpha ?? 0.3
    this._glowSize = options.glowSize ?? 20
    this.draw()
  }

  get radius() { return this._radius }
  set radius(v: number) { this._radius = v; this.draw() }

  get color() { return this._color }
  set color(v: number) { this._color = v; this.draw() }

  get glowColor() { return this._glowColor }
  set glowColor(v: number) { this._glowColor = v; this.draw() }

  get glowAlpha() { return this._glowAlpha }
  set glowAlpha(v: number) { this._glowAlpha = v; this.draw() }

  get glowSize() { return this._glowSize }
  set glowSize(v: number) { this._glowSize = v; this.draw() }

  private draw() {
    this.clear()

    // Outer glow layers
    const layers = 4
    for (let i = layers; i >= 1; i--) {
      const r = this._radius + this._glowSize * (i / layers)
      const alpha = this._glowAlpha * (1 - i / (layers + 1))
      this.circle(0, 0, r)
      this.fill({ color: this._glowColor, alpha })
    }

    // Core circle
    this.circle(0, 0, this._radius)
    this.fill({ color: this._color })
  }
}
