/**
 * Vehicle Generator
 * 車両生成システム
 *
 * ポアソン過程に従って車両を確率的に生成
 */

import { Vehicle } from './Vehicle';
import { Random } from './Random';
import type { Direction, TurnIntent, VehicleGenerationConfig } from './types';

export class VehicleGenerator {
  private readonly rng: Random;
  private readonly spawnRates: Record<Direction, number>;
  private readonly turnProbabilities: { straight: number; left: number; right: number };
  private readonly vehicleDefaults: {
    maxSpeed: number;
    maxAcceleration: number;
    comfortableDeceleration: number;
    minGap: number;
    reactionTime: number;
    length: number;
  };
  private nextId: number = 1;

  constructor(
    config: VehicleGenerationConfig,
    vehicleDefaults: any,
    rng: Random
  ) {
    this.rng = rng;
    this.spawnRates = config.spawnRates;
    this.turnProbabilities = config.turnProbabilities;
    this.vehicleDefaults = vehicleDefaults;
  }

  /**
   * 車両生成を試行
   * @param direction - 生成方向
   * @param dt - タイムステップ（秒）
   * @param entryPosition - 進入路開始位置
   * @returns 生成された車両、または生成されなかった場合null
   */
  tryGenerate(
    direction: Direction,
    dt: number,
    entryPosition: { x: number; y: number }
  ): Vehicle | null {
    // 生成確率の計算（台/秒に変換）
    const rate = this.spawnRates[direction] / 60;
    const probability = rate * dt;

    // 乱数判定
    if (this.rng.random() < probability) {
      return this.createVehicle(direction, entryPosition);
    }

    return null;
  }

  /**
   * 車両を生成
   * @param direction - 生成方向
   * @param entryPosition - 進入路開始位置
   * @returns 生成された車両
   */
  private createVehicle(
    direction: Direction,
    entryPosition: { x: number; y: number }
  ): Vehicle {
    // 進行意図をランダムに決定
    const turnIntent = this.chooseTurnIntent();

    // 車両IDを生成
    const id = `v${this.nextId.toString().padStart(4, '0')}`;
    this.nextId++;

    // 車両オブジェクトの作成
    const vehicle = new Vehicle({
      id,
      direction,
      turnIntent,
      position: entryPosition,
      lane: 0, // デフォルトは第1車線
      ...this.vehicleDefaults,
    });

    return vehicle;
  }

  /**
   * 進行意図をランダムに選択
   * @returns 進行意図（直進/左折/右折）
   */
  private chooseTurnIntent(): TurnIntent {
    const r = this.rng.random();
    const p = this.turnProbabilities;

    if (r < p.straight) {
      return 'straight';
    } else if (r < p.straight + p.left) {
      return 'left';
    } else {
      return 'right';
    }
  }

  /**
   * 生成率を取得
   * @param direction - 方向
   * @returns 生成率（台/分）
   */
  getSpawnRate(direction: Direction): number {
    return this.spawnRates[direction];
  }

  /**
   * 生成率を設定
   * @param direction - 方向
   * @param rate - 生成率（台/分）
   */
  setSpawnRate(direction: Direction, rate: number): void {
    if (rate < 0 || rate > 60) {
      console.warn(`⚠️ Spawn rate ${rate} is out of valid range (0-60)`);
    }
    this.spawnRates[direction] = rate;
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      totalGenerated: this.nextId - 1,
      spawnRates: { ...this.spawnRates },
      turnProbabilities: { ...this.turnProbabilities },
    };
  }

  /**
   * リセット
   */
  reset(): void {
    this.nextId = 1;
  }
}
