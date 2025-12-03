/**
 * Collision Avoidance System
 * 衝突回避システム
 *
 * 車両間の衝突検出と回避処理
 */

import { Vehicle } from './Vehicle';
import { Intersection } from './Intersection';
import type { Direction, CollisionEvent } from './types';

export class CollisionAvoidance {
  private readonly intersection: Intersection;

  // 衝突イベントのログ
  private readonly collisionEvents: CollisionEvent[] = [];

  // 安全パラメータ
  private readonly minSafeDistance: number = 2.0; // 最小安全距離（m）
  private readonly collisionThreshold: number = 1.0; // 衝突判定距離（m）

  constructor(intersection: Intersection) {
    this.intersection = intersection;
  }

  /**
   * 全車両間の衝突チェック
   * @param vehicles - チェック対象の車両リスト
   * @param currentTime - 現在のシミュレーション時刻（秒）
   */
  checkCollisions(vehicles: Vehicle[], currentTime: number): void {
    // 全ペアをチェック
    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        this.checkCollisionPair(vehicles[i], vehicles[j], currentTime);
      }
    }
  }

  /**
   * 2台の車両間の衝突チェック
   * @param v1 - 車両1
   * @param v2 - 車両2
   * @param currentTime - 現在時刻
   */
  private checkCollisionPair(
    v1: Vehicle,
    v2: Vehicle,
    currentTime: number
  ): void {
    const distance = v1.position.distance(v2.position);

    // 衝突判定
    if (distance < this.collisionThreshold) {
      this.logCollisionEvent({
        time: currentTime,
        vehicle1Id: v1.id,
        vehicle2Id: v2.id,
        location: {
          x: (v1.position.x + v2.position.x) / 2,
          y: (v1.position.y + v2.position.y) / 2,
        },
        severity: 'collision',
      });
    }
    // ニアミス判定
    else if (distance < this.minSafeDistance) {
      // 同じ方向の車両は車間距離が近くても正常
      if (v1.direction !== v2.direction) {
        this.logCollisionEvent({
          time: currentTime,
          vehicle1Id: v1.id,
          vehicle2Id: v2.id,
          location: {
            x: (v1.position.x + v2.position.x) / 2,
            y: (v1.position.y + v2.position.y) / 2,
          },
          severity: 'near-miss',
        });
      }
    }
  }

  /**
   * 交差点進入の安全性チェック
   * @param vehicle - チェックする車両
   * @param otherVehicles - 他の車両リスト
   * @returns 安全に進入可能な場合true
   */
  isSafeToEnterIntersection(
    vehicle: Vehicle,
    otherVehicles: Vehicle[]
  ): boolean {
    const intersectionBounds = {
      xMin: -this.intersection.getWidth() / 2,
      xMax: this.intersection.getWidth() / 2,
      yMin: -this.intersection.getWidth() / 2,
      yMax: this.intersection.getWidth() / 2,
    };

    // 交差点内の車両をチェック
    for (const other of otherVehicles) {
      if (other.id === vehicle.id) {
        continue;
      }

      // 他の車両が交差点内にいるかチェック
      if (other.isInIntersection(intersectionBounds)) {
        // 進路が交差するかチェック
        if (this.pathsIntersect(vehicle, other)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 2台の車両の進路が交差するかチェック
   * @param v1 - 車両1
   * @param v2 - 車両2
   * @returns 進路が交差する場合true
   */
  private pathsIntersect(v1: Vehicle, v2: Vehicle): boolean {
    // 同じ方向から来た車両同士は交差しない
    if (v1.direction === v2.direction) {
      return false;
    }

    // 対向車両の場合
    if (this.isOppositeDirection(v1.direction, v2.direction)) {
      // 両方とも直進の場合は交差しない
      if (v1.turnIntent === 'straight' && v2.turnIntent === 'straight') {
        return false;
      }
      // 一方または両方が左折する場合は交差する可能性がある
      if (v1.turnIntent === 'left' || v2.turnIntent === 'left') {
        return true;
      }
    }

    // 直角方向の車両の場合は交差する可能性が高い
    if (this.isPerpendicularDirection(v1.direction, v2.direction)) {
      return true;
    }

    return false;
  }

  /**
   * 対向方向かチェック
   * @param dir1 - 方向1
   * @param dir2 - 方向2
   * @returns 対向方向の場合true
   */
  private isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
    return (
      (dir1 === 'north' && dir2 === 'south') ||
      (dir1 === 'south' && dir2 === 'north') ||
      (dir1 === 'east' && dir2 === 'west') ||
      (dir1 === 'west' && dir2 === 'east')
    );
  }

  /**
   * 直角方向かチェック
   * @param dir1 - 方向1
   * @param dir2 - 方向2
   * @returns 直角方向の場合true
   */
  private isPerpendicularDirection(dir1: Direction, dir2: Direction): boolean {
    const northSouth = ['north', 'south'];
    const eastWest = ['east', 'west'];

    return (
      (northSouth.includes(dir1) && eastWest.includes(dir2)) ||
      (eastWest.includes(dir1) && northSouth.includes(dir2))
    );
  }

  /**
   * 衝突イベントをログに記録
   * @param event - 衝突イベント
   */
  private logCollisionEvent(event: CollisionEvent): void {
    // 重複チェック（同じペアの連続イベントを防ぐ）
    const recentEvent = this.collisionEvents
      .slice(-10)
      .find(
        (e) =>
          (e.vehicle1Id === event.vehicle1Id &&
            e.vehicle2Id === event.vehicle2Id) ||
          (e.vehicle1Id === event.vehicle2Id &&
            e.vehicle2Id === event.vehicle1Id)
      );

    if (recentEvent && event.time - recentEvent.time < 1.0) {
      // 1秒以内の重複イベントは記録しない
      return;
    }

    this.collisionEvents.push(event);

    // コンソールに警告を出力
    if (event.severity === 'collision') {
      console.warn(
        `⚠️ COLLISION at t=${event.time.toFixed(2)}s: ${event.vehicle1Id} <-> ${event.vehicle2Id}`
      );
    }
  }

  /**
   * 衝突イベントを取得
   * @returns 衝突イベントの配列
   */
  getCollisionEvents(): CollisionEvent[] {
    return [...this.collisionEvents];
  }

  /**
   * 衝突数を取得
   * @param severity - 重大度でフィルタ（省略時は全て）
   * @returns 衝突数
   */
  getCollisionCount(severity?: 'near-miss' | 'collision'): number {
    if (severity) {
      return this.collisionEvents.filter((e) => e.severity === severity).length;
    }
    return this.collisionEvents.length;
  }

  /**
   * リセット
   */
  reset(): void {
    this.collisionEvents.length = 0;
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      totalCollisions: this.getCollisionCount('collision'),
      totalNearMisses: this.getCollisionCount('near-miss'),
      totalEvents: this.collisionEvents.length,
    };
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    const collisions = this.getCollisionCount('collision');
    const nearMisses = this.getCollisionCount('near-miss');
    return `CollisionAvoidance(collisions=${collisions}, near-misses=${nearMisses})`;
  }
}
