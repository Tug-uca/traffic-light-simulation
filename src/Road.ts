/**
 * Road Class
 * 道路クラス
 *
 * 交差点への進入路を表現
 */

import { Vector2D } from './Vector2D';
import type { Direction, RoadConfig } from './types';

export class Road {
  // 道路の基本情報
  public readonly direction: Direction;
  public readonly numLanes: number;
  public readonly length: number;
  public readonly laneWidth: number;

  constructor(config: RoadConfig) {
    this.direction = config.direction;
    this.numLanes = config.numLanes;
    this.length = config.length;
    this.laneWidth = config.laneWidth;
  }

  /**
   * 指定車線の中心位置を取得
   * @param laneIndex - 車線インデックス（0から始まる）
   * @param distance - 交差点中心からの距離
   * @returns 車線中心位置のベクトル
   */
  getLanePosition(laneIndex: number, distance: number): Vector2D {
    if (laneIndex < 0 || laneIndex >= this.numLanes) {
      throw new Error(`Invalid lane index: ${laneIndex} (numLanes: ${this.numLanes})`);
    }

    // 車線のオフセットを計算（道路の中心から）
    const laneOffset = (laneIndex - (this.numLanes - 1) / 2) * this.laneWidth;

    switch (this.direction) {
      case 'north':
        // 北方向（y軸正の方向）
        return new Vector2D(laneOffset, -distance);
      case 'south':
        // 南方向（y軸負の方向）
        return new Vector2D(-laneOffset, distance);
      case 'east':
        // 東方向（x軸正の方向）
        return new Vector2D(-distance, laneOffset);
      case 'west':
        // 西方向（x軸負の方向）
        return new Vector2D(distance, -laneOffset);
    }
  }

  /**
   * 進入路の開始位置を取得
   * @param laneIndex - 車線インデックス
   * @returns 進入路開始位置のベクトル
   */
  getEntryPosition(laneIndex: number): Vector2D {
    return this.getLanePosition(laneIndex, this.length);
  }

  /**
   * 停止線の位置を取得
   * @param laneIndex - 車線インデックス
   * @param intersectionWidth - 交差点幅
   * @returns 停止線位置のベクトル
   */
  getStopLinePosition(laneIndex: number, intersectionWidth: number): Vector2D {
    // 停止線は交差点の手前5mに設定
    const stopDistance = intersectionWidth / 2 + 5;
    return this.getLanePosition(laneIndex, stopDistance);
  }

  /**
   * 道路の総幅を取得
   * @returns 道路の幅（m）
   */
  getTotalWidth(): number {
    return this.numLanes * this.laneWidth;
  }

  /**
   * 指定位置が道路上にあるかチェック
   * @param position - チェックする位置
   * @param intersectionWidth - 交差点幅
   * @returns 道路上にある場合true
   */
  isOnRoad(position: Vector2D, intersectionWidth: number): boolean {
    const halfWidth = this.getTotalWidth() / 2;
    const startDistance = this.length;
    const endDistance = intersectionWidth / 2;

    switch (this.direction) {
      case 'north':
        return (
          position.y >= -startDistance &&
          position.y <= -endDistance &&
          Math.abs(position.x) <= halfWidth
        );
      case 'south':
        return (
          position.y >= endDistance &&
          position.y <= startDistance &&
          Math.abs(position.x) <= halfWidth
        );
      case 'east':
        return (
          position.x >= -startDistance &&
          position.x <= -endDistance &&
          Math.abs(position.y) <= halfWidth
        );
      case 'west':
        return (
          position.x >= endDistance &&
          position.x <= startDistance &&
          Math.abs(position.y) <= halfWidth
        );
    }
  }

  /**
   * 交差点中心からの距離を取得
   * @param position - 位置ベクトル
   * @returns 交差点中心からの距離（m）、道路上にない場合は-1
   */
  getDistanceFromCenter(position: Vector2D): number {
    switch (this.direction) {
      case 'north':
        return -position.y;
      case 'south':
        return position.y;
      case 'east':
        return -position.x;
      case 'west':
        return position.x;
      default:
        return -1;
    }
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    return `Road(${this.direction}, ${this.numLanes} lanes, ${this.length}m)`;
  }

  /**
   * 道路情報のスナップショット取得
   */
  getSnapshot() {
    return {
      direction: this.direction,
      numLanes: this.numLanes,
      length: this.length,
      laneWidth: this.laneWidth,
      totalWidth: this.getTotalWidth(),
    };
  }
}
