/**
 * Intersection Renderer
 * 交差点描画システム
 *
 * 交差点の道路、車線、停止線を描画
 */

import { Intersection } from './Intersection';
import type { Direction } from './types';

export class IntersectionRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 交差点を描画
   * @param intersection - 交差点オブジェクト
   */
  render(intersection: Intersection): void {
    this.ctx.save();

    // 1. 交差点中央部を描画
    this.drawIntersectionCenter(intersection);

    // 2. 各方向の道路を描画
    const activeDirections = intersection.getActiveDirections();
    for (const direction of activeDirections) {
      this.drawRoad(intersection, direction);
    }

    this.ctx.restore();
  }

  /**
   * 交差点中央部を描画
   */
  private drawIntersectionCenter(intersection: Intersection): void {
    const width = intersection.getWidth();
    const halfWidth = width / 2;

    this.ctx.fillStyle = '#d0d0d0'; // グレー
    this.ctx.fillRect(-halfWidth, -halfWidth, width, width);

    // 境界線
    this.ctx.strokeStyle = '#808080';
    this.ctx.lineWidth = 0.2;
    this.ctx.strokeRect(-halfWidth, -halfWidth, width, width);
  }

  /**
   * 道路を描画
   */
  private drawRoad(intersection: Intersection, direction: Direction): void {
    const road = intersection.getRoad(direction);
    if (!road) {
      return;
    }

    const totalWidth = road.getTotalWidth();
    const length = road.length;
    const laneWidth = road.laneWidth;
    const intersectionWidth = intersection.getWidth();

    // 道路の開始位置と終了位置を計算
    const startDistance = intersectionWidth / 2;
    const endDistance = length;

    // 道路の矩形を描画
    this.ctx.save();

    // 方向に応じて回転
    this.rotateForDirection(direction);

    // 道路面を描画
    this.ctx.fillStyle = '#505050'; // ダークグレー
    this.ctx.fillRect(-totalWidth / 2, startDistance, totalWidth, endDistance - startDistance);

    // 車線境界線を描画
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 0.15;
    this.ctx.setLineDash([2, 2]);

    for (let i = 1; i < road.numLanes; i++) {
      const offset = -totalWidth / 2 + i * laneWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(offset, startDistance);
      this.ctx.lineTo(offset, endDistance);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]); // 破線をリセット

    // 停止線を描画
    this.drawStopLine(totalWidth, startDistance + 5);

    // 道路境界線を描画
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(-totalWidth / 2, startDistance);
    this.ctx.lineTo(-totalWidth / 2, endDistance);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(totalWidth / 2, startDistance);
    this.ctx.lineTo(totalWidth / 2, endDistance);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 停止線を描画
   */
  private drawStopLine(roadWidth: number, distance: number): void {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 0.4;
    this.ctx.beginPath();
    this.ctx.moveTo(-roadWidth / 2, distance);
    this.ctx.lineTo(roadWidth / 2, distance);
    this.ctx.stroke();
  }

  /**
   * 方向に応じて回転
   */
  private rotateForDirection(direction: Direction): void {
    switch (direction) {
      case 'north':
        // 0度（デフォルト）
        break;
      case 'south':
        this.ctx.rotate(Math.PI);
        break;
      case 'east':
        this.ctx.rotate(-Math.PI / 2);
        break;
      case 'west':
        this.ctx.rotate(Math.PI / 2);
        break;
    }
  }
}
