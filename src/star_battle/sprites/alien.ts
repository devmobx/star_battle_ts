import { CanvasInterface } from '../types/deps';
import Bullet from './bullet';
import config from '../config';

export default class Alien {
  private _canvas: CanvasInterface;
  private _state: {
    x: number;
    y: number;
    hp: number;
    alive: boolean;
    bullets: Bullet[];
    hitFlash: number;
  };
  private _xVel: number;
  private _yVel: number;
  private _shootTimer: number;
  private _shootDelay: number;
  private _getPlayerPos: () => { x: number; y: number };

  constructor(
    canvas: CanvasInterface,
    x: number,
    y: number,
    getPlayerPos: () => { x: number; y: number }
  ) {
    this._canvas = canvas;
    this._getPlayerPos = getPlayerPos;
    this._state = {
      x,
      y,
      hp: 3,
      alive: true,
      bullets: [],
      hitFlash: 0,
    };
    this._xVel = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.5);
    this._yVel = 0.15;
    this._shootDelay = Math.floor(120 + Math.random() * 100);
    this._shootTimer = Math.floor(Math.random() * this._shootDelay);
  }

  public draw(): void {
    if (!this._state.alive) return;
    const ctx = this._canvas.ctx;
    const { x, y, hitFlash, hp } = this._state;
    const flash = hitFlash > 0;

    ctx.save();
    ctx.translate(x, y);

    // Saucer body (wide ellipse)
    ctx.fillStyle = flash ? '#ff3333' : '#33cc66';
    ctx.beginPath();
    ctx.ellipse(0, 8, 28, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rim highlight
    ctx.strokeStyle = flash ? '#ff9999' : '#66ffaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dome
    ctx.fillStyle = flash ? '#ff6666' : '#88ffcc';
    ctx.beginPath();
    ctx.ellipse(0, 1, 14, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Cockpit window
    ctx.fillStyle = '#0088ee';
    ctx.beginPath();
    ctx.ellipse(0, -1, 6, 5, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Pulsing underside lights
    const t = Date.now() / 300;
    for (let i = -2; i <= 2; i++) {
      const hue = ((t + i * 0.4) % 1) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
      ctx.beginPath();
      ctx.arc(i * 10, 15, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // HP bar above alien
    const barW = 40;
    const barX = x - barW / 2;
    const barY = y - 30;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, 5);
    ctx.fillStyle = hp === 3 ? '#44ff44' : hp === 2 ? '#ffcc00' : '#ff4444';
    ctx.fillRect(barX, barY, (barW / 3) * hp, 5);

    // Draw bullets
    this._state.bullets.forEach((b) => b.draw());
  }

  public update(): void {
    if (!this._state.alive) return;

    // Horizontal patrol bounce
    this._state.x += this._xVel;
    this._state.y += this._yVel;

    const margin = 35;
    if (this._state.x < margin || this._state.x > this._canvas.width - margin) {
      this._xVel *= -1;
      this._state.x = Math.max(margin, Math.min(this._canvas.width - margin, this._state.x));
    }

    // Cap downward drift at 55% of screen height
    const maxY = this._canvas.height * 0.55;
    if (this._state.y > maxY) {
      this._yVel = 0;
      this._state.y = maxY;
    }

    if (this._state.hitFlash > 0) this._state.hitFlash--;

    this._shootTimer--;
    if (this._shootTimer <= 0) {
      this._shoot();
      this._shootTimer = this._shootDelay;
    }
  }

  public checkHit(bullet: Bullet): boolean {
    const { x: bx, y: by } = bullet.state;
    const { x, y } = this._state;
    return bx > x - 28 && bx < x + 28 && by > y - 10 && by < y + 22;
  }

  public takeDamage(): void {
    this._state.hp--;
    this._state.hitFlash = 8;
    if (this._state.hp <= 0) this._state.alive = false;
  }

  public removeBullet(bullet: Bullet): void {
    this._state.bullets = this._state.bullets.filter((b) => b !== bullet);
  }

  public get alive(): boolean {
    return this._state.alive;
  }

  public get state() {
    return this._state;
  }

  public get bullets(): Bullet[] {
    return this._state.bullets;
  }

  private _shoot(): void {
    const playerPos = this._getPlayerPos();
    const dx = playerPos.x - this._state.x;
    const dy = playerPos.y - this._state.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 7;
    const xVel = (dx / dist) * speed;
    const yVel = (dy / dist) * speed;
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;

    const bullet = new Bullet(this._canvas, {
      x: this._state.x,
      y: this._state.y + 15,
      angle,
      color: '#ffdd00',
    });
    this._state.bullets.push(bullet);

    let bx = bullet.state.x;
    let by = bullet.state.y;

    const anim = setInterval(() => {
      if (
        by < this._canvas.height + 20 &&
        by > -20 &&
        bx > -20 &&
        bx < this._canvas.width + 20
      ) {
        bx += xVel;
        by += yVel;
        bullet.updatePos({ x: bx, y: by });
      } else {
        this._state.bullets = this._state.bullets.filter((b) => b !== bullet);
        clearInterval(anim);
      }
    }, config.speed);
  }
}
