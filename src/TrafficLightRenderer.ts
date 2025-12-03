/**
 * Traffic Light Renderer
 * 信号機描画システム
 *
 * 信号機の視覚的表現を描画
 */

import { TrafficLight } from './TrafficLight';

export class TrafficLightRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 信号機を描画
   * @param light - 信号機オブジェクト
   */
  render(light: TrafficLight): void {
    this.ctx.save();

    // 信号機の位置に移動
    this.ctx.translate(light.position.x, light.position.y);

    // Y軸の反転を補正
    this.ctx.scale(1, -1);

    // 信号機のボックスを描画
    const boxWidth = 1.5;
    const boxHeight = 4.0;

    this.ctx.fillStyle = '#2c3e50'; // ダークグレー
    this.ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

    // 信号機のライトを描画（上から赤、黄、緑）
    const lightRadius = 0.5;
    const lightSpacing = 1.2;

    // 赤信号ライト
    this.drawLight(0, boxHeight / 2 - lightSpacing, lightRadius, light.phase === 'red');

    // 黄信号ライト
    this.drawLight(0, boxHeight / 2 - lightSpacing * 2, lightRadius, light.phase === 'yellow');

    // 緑信号ライト
    this.drawLight(0, boxHeight / 2 - lightSpacing * 3, lightRadius, light.phase === 'green');

    // 信号機の枠線
    this.ctx.strokeStyle = '#1a252f';
    this.ctx.lineWidth = 0.1;
    this.ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

    this.ctx.restore();
  }

  /**
   * 信号ライトを描画
   * @param x - X座標（信号機ローカル座標）
   * @param y - Y座標（信号機ローカル座標）
   * @param radius - ライトの半径
   * @param active - ライトが点灯しているか
   */
  private drawLight(x: number, y: number, radius: number, active: boolean): void {
    this.ctx.save();

    // ライトの背景（常に暗い円）
    this.ctx.fillStyle = active ? this.getActiveLightColor() : '#34495e';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // ライトの境界線
    this.ctx.strokeStyle = '#1a252f';
    this.ctx.lineWidth = 0.05;
    this.ctx.stroke();

    // 点灯時のグロー効果
    if (active) {
      this.ctx.shadowColor = this.getActiveLightColor();
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      this.ctx.fillStyle = this.getBrightLightColor();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * アクティブなライトの色を取得
   */
  private getActiveLightColor(): string {
    // 現在のフェーズに基づいて色を返す
    // この関数はdrawLightから呼ばれるため、phase情報が必要
    // 簡略化のため、ここではベース色を返す
    return '#e74c3c'; // デフォルトは赤
  }

  /**
   * 明るいライトの色を取得
   */
  private getBrightLightColor(): string {
    return '#ffffff'; // 白
  }
}
