import { CanvasInterface } from '../types/deps';

export default class Bullet {
  private _canvas;
  private _state;
  private _color: string;

  constructor(
    canvas: CanvasInterface,
    initalState: { x: number; y: number; angle: number; color?: string }
  ) {
    this._canvas = canvas;
    this._state = {
      x: initalState.x,
      y: initalState.y,
      angle: initalState.angle,
    };
    this._color = initalState.color ?? 'red';
  }

  public draw(): void {
    this._canvas.ctx.save();
    this._canvas.ctx.translate(this._state.x, this._state.y);
    this._canvas.ctx.rotate((this._state.angle * Math.PI) / 180);
    this._canvas.ctx.translate(-this._state.x, -this._state.y);
    this._canvas.ctx.beginPath();
    this._canvas.ctx.fillStyle = this._color;
    this._canvas.ctx.fillRect(this._state.x, this._state.y, 3, 15);
    this._canvas.ctx.closePath();
    this._canvas.ctx.restore();
  }

  public get state() {
    return this._state;
  }

  public updatePos({ x, y }: { x: number; y: number }) {
    this._state.x = x;
    this._state.y = y;
  }
}
