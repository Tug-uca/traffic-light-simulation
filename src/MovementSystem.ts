/**
 * Movement System
 * 車両移動システム
 *
 * 車両の移動を管理し、車両間の相互作用を処理
 */

import { Vehicle } from './Vehicle';
import { Intersection } from './Intersection';
import { SignalController } from './SignalController';
import type { Direction } from './types';

export class MovementSystem {
  private readonly intersection: Intersection;
  private readonly signalController: SignalController;

  // 方向ごとの車両リスト
  private readonly vehiclesByDirection: Map<Direction, Vehicle[]>;

  // 全車両のリスト（高速検索用）
  private readonly allVehicles: Map<string, Vehicle>;

  constructor(intersection: Intersection, signalController: SignalController) {
    this.intersection = intersection;
    this.signalController = signalController;

    this.vehiclesByDirection = new Map();
    this.allVehicles = new Map();

    // 各方向の車両リストを初期化
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    for (const dir of directions) {
      this.vehiclesByDirection.set(dir, []);
    }
  }

  /**
   * 車両を追加
   * @param vehicle - 追加する車両
   */
  addVehicle(vehicle: Vehicle): void {
    const vehicles = this.vehiclesByDirection.get(vehicle.direction);
    if (vehicles) {
      vehicles.push(vehicle);
      this.allVehicles.set(vehicle.id, vehicle);
    }
  }

  /**
   * 車両を削除
   * @param vehicleId - 削除する車両のID
   * @returns 削除された車両、存在しない場合null
   */
  removeVehicle(vehicleId: string): Vehicle | null {
    const vehicle = this.allVehicles.get(vehicleId);
    if (!vehicle) {
      return null;
    }

    // 方向別リストから削除
    const vehicles = this.vehiclesByDirection.get(vehicle.direction);
    if (vehicles) {
      const index = vehicles.findIndex((v) => v.id === vehicleId);
      if (index !== -1) {
        vehicles.splice(index, 1);
      }
    }

    // 全車両リストから削除
    this.allVehicles.delete(vehicleId);

    return vehicle;
  }

  /**
   * 全車両の状態を更新
   * @param dt - タイムステップ（秒）
   */
  updateAllVehicles(dt: number): void {
    for (const [direction, vehicles] of this.vehiclesByDirection.entries()) {
      // 各方向の車両を位置順にソート（交差点に近い順）
      this.sortVehiclesByPosition(vehicles, direction);

      // 各車両を更新
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];

        // 前方車両を検索
        const frontVehicle = this.getFrontVehicle(vehicle, i, vehicles);

        // 信号機までの距離を計算
        const signalDistance = this.getSignalDistance(vehicle);

        // 信号フェーズを取得
        const trafficLight = this.signalController.getTrafficLight(direction);
        const signalPhase = trafficLight ? trafficLight.phase : 'red';

        // 車両の状態を更新
        vehicle.update(dt, frontVehicle, signalDistance, signalPhase);
      }
    }
  }

  /**
   * 車両を位置順にソート（交差点に近い順）
   * @param vehicles - 車両配列
   * @param direction - 方向
   */
  private sortVehiclesByPosition(vehicles: Vehicle[], direction: Direction): void {
    const road = this.intersection.getRoad(direction);
    if (!road) {
      return;
    }

    vehicles.sort((a, b) => {
      const distA = road.getDistanceFromCenter(a.position);
      const distB = road.getDistanceFromCenter(b.position);
      return distA - distB; // 昇順（交差点に近い順）
    });
  }

  /**
   * 前方車両を取得
   * @param vehicle - 対象車両
   * @param currentIndex - 車両配列内のインデックス
   * @param vehicles - 同じ方向の車両配列（ソート済み）
   * @returns 前方車両、存在しない場合null
   */
  private getFrontVehicle(
    vehicle: Vehicle,
    currentIndex: number,
    vehicles: Vehicle[]
  ): Vehicle | null {
    // 同じ車線の前方車両を探す
    for (let i = currentIndex - 1; i >= 0; i--) {
      const candidate = vehicles[i];
      if (candidate.lane === vehicle.lane) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * 信号機までの距離を計算
   * @param vehicle - 車両
   * @returns 信号機までの距離（m）
   */
  private getSignalDistance(vehicle: Vehicle): number {
    const road = this.intersection.getRoad(vehicle.direction);
    if (!road) {
      return Infinity;
    }

    // 交差点中心からの距離を取得
    const distanceFromCenter = road.getDistanceFromCenter(vehicle.position);

    // 停止線位置（交差点幅の半分 + 5m）
    const stopLineDistance = this.intersection.getWidth() / 2 + 5;

    // 信号機までの距離
    return Math.max(0, distanceFromCenter - stopLineDistance);
  }

  /**
   * シミュレーション領域外に出た車両を削除
   * @returns 削除された車両のリスト
   */
  removeExitedVehicles(): Vehicle[] {
    const exitedVehicles: Vehicle[] = [];

    // 境界距離（道路長 + 余裕）
    const boundaryDistance = this.intersection.getApproachLength() + 50;

    for (const vehicle of this.allVehicles.values()) {
      if (vehicle.isOutsideBounds(boundaryDistance)) {
        exitedVehicles.push(vehicle);
      }
    }

    // 削除
    for (const vehicle of exitedVehicles) {
      this.removeVehicle(vehicle.id);
    }

    return exitedVehicles;
  }

  /**
   * 指定方向の車両数を取得
   * @param direction - 方向
   * @returns 車両数
   */
  getVehicleCount(direction: Direction): number {
    const vehicles = this.vehiclesByDirection.get(direction);
    return vehicles ? vehicles.length : 0;
  }

  /**
   * 全車両数を取得
   * @returns 車両数
   */
  getTotalVehicleCount(): number {
    return this.allVehicles.size;
  }

  /**
   * 全車両を取得
   * @returns 車両の配列
   */
  getAllVehicles(): Vehicle[] {
    return Array.from(this.allVehicles.values());
  }

  /**
   * 指定方向の車両を取得
   * @param direction - 方向
   * @returns 車両の配列
   */
  getVehiclesByDirection(direction: Direction): Vehicle[] {
    const vehicles = this.vehiclesByDirection.get(direction);
    return vehicles ? [...vehicles] : [];
  }

  /**
   * 車両IDで検索
   * @param vehicleId - 車両ID
   * @returns 車両、存在しない場合null
   */
  getVehicleById(vehicleId: string): Vehicle | null {
    return this.allVehicles.get(vehicleId) ?? null;
  }

  /**
   * リセット（全車両削除）
   */
  reset(): void {
    this.allVehicles.clear();
    for (const vehicles of this.vehiclesByDirection.values()) {
      vehicles.length = 0;
    }
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    const stats = {
      totalVehicles: this.allVehicles.size,
      vehiclesByDirection: {} as Record<Direction, number>,
    };

    for (const [direction, vehicles] of this.vehiclesByDirection.entries()) {
      stats.vehiclesByDirection[direction] = vehicles.length;
    }

    return stats;
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    return `MovementSystem(total=${this.allVehicles.size} vehicles)`;
  }
}
