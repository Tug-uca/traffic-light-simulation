/**
 * Vehicle Renderer
 * 車両描画システム
 *
 * 車両の視覚的表現を描画
 */

import { Vehicle } from './Vehicle';
import type { Direction } from './types';

export class VehicleRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 車両を描画
   * @param vehicle - 車両オブジェクト
   */
  render(vehicle: Vehicle): void {
    this.ctx.save();

    // 車両の位置に移動
    this.ctx.translate(vehicle.position.x, vehicle.position.y);

    // 車両の向きに回転
    const angle = this.getRotationAngle(vehicle.direction);
    this.ctx.rotate(angle);

    // Y軸の反転を補正（車両は正しい向きに表示）
    this.ctx.scale(1, -1);

    // 車両の矩形を描画
    const width = 2.0; // 車幅（m）
    const length = vehicle.length; // 車長（m）

    // 車両の色を決定（ステータスと進行意図に基づく）
    const color = this.getVehicleColor(vehicle);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(-width / 2, -length / 2, width, length);

    // 車両の境界線
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 0.15;
    this.ctx.strokeRect(-width / 2, -length / 2, width, length);

    // 進行方向インジケーター（車両前部）
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-width / 3, length / 2 - 0.5, width * 2 / 3, 0.3);

    this.ctx.restore();
  }

  /**
   * 方向から回転角度を取得
   */
  private getRotationAngle(direction: Direction): number {
    switch (direction) {
      case 'north':
        return Math.PI / 2; // 90度
      case 'south':
        return -Math.PI / 2; // -90度
      case 'east':
        return 0; // 0度
      case 'west':
        return Math.PI; // 180度
    }
  }

  /**
   * 車両の色を取得
   */
  private getVehicleColor(vehicle: Vehicle): string {
    // ステータスによる色分け
    if (vehicle.status === 'waiting') {
      return '#e74c3c'; // 赤（待機中）
    } else if (vehicle.velocity < 1) {
      return '#f39c12'; // オレンジ（低速）
    }

    // 進行意図による色分け
    switch (vehicle.turnIntent) {
      case 'straight':
        return '#3498db'; // 青（直進）
      case 'left':
        return '#9b59b6'; // 紫（左折）
      case 'right':
        return '#2ecc71'; // 緑（右折）
      default:
        return '#95a5a6'; // グレー
    }
  }
}
