/**
 * Vehicle Class - Agent-based Vehicle Entity
 * 車両クラス - エージェントベースの車両エンティティ
 *
 * IDM (Intelligent Driver Model) 簡易版を実装
 */

import { Vector2D } from './Vector2D';
import type { Direction, TurnIntent, VehicleStatus, VehicleConfig } from './types';

export class Vehicle {
  // 識別情報
  public readonly id: string;
  public readonly direction: Direction;
  public readonly turnIntent: TurnIntent;

  // 物理状態
  public position: Vector2D;
  public velocity: number;
  public acceleration: number;

  // シミュレーション状態
  public status: VehicleStatus;
  public lane: number;
  public waitTime: number;
  public totalTravelTime: number;
  public totalDistance: number;

  // パラメータ
  public readonly maxSpeed: number;
  public readonly maxAcceleration: number;
  public readonly comfortableDeceleration: number;
  public readonly minGap: number;
  public readonly reactionTime: number;
  public readonly length: number;

  // 内部状態
  private maxSpeedAchieved: number;

  constructor(config: VehicleConfig) {
    // 識別情報
    this.id = config.id;
    this.direction = config.direction;
    this.turnIntent = config.turnIntent;

    // 物理状態
    this.position = new Vector2D(config.position.x, config.position.y);
    this.velocity = 0; // 停止状態から開始
    this.acceleration = 0;

    // シミュレーション状態
    this.status = 'approaching';
    this.lane = config.lane ?? 0;
    this.waitTime = 0;
    this.totalTravelTime = 0;
    this.totalDistance = 0;

    // パラメータ（デフォルト値付き）
    this.maxSpeed = config.maxSpeed ?? 11.1; // 40 km/h
    this.maxAcceleration = config.maxAcceleration ?? 2.0;
    this.comfortableDeceleration = config.comfortableDeceleration ?? 3.0;
    this.minGap = config.minGap ?? 2.0;
    this.reactionTime = config.reactionTime ?? 1.5;
    this.length = config.length ?? 4.5;

    // 内部状態
    this.maxSpeedAchieved = 0;
  }

  /**
   * 車両の状態を1タイムステップ更新
   * @param dt - タイムステップ（秒）
   * @param frontVehicle - 前方車両（存在する場合）
   * @param signalDistance - 信号機までの距離（m）
   * @param signalPhase - 信号機のフェーズ
   */
  update(
    dt: number,
    frontVehicle: Vehicle | null,
    signalDistance: number,
    signalPhase: 'green' | 'yellow' | 'red'
  ): void {
    // 1. 目標速度の決定
    const targetSpeed = this.calculateTargetSpeed(
      frontVehicle,
      signalDistance,
      signalPhase
    );

    // 2. 加速度の計算（IDM簡易版）
    this.acceleration = this.calculateAcceleration(targetSpeed, frontVehicle);

    // 3. 速度の更新
    this.velocity += this.acceleration * dt;
    this.velocity = Math.max(0, Math.min(this.maxSpeed, this.velocity));

    // 4. 位置の更新
    const displacement = this.velocity * dt;
    const directionVector = this.getDirectionVector();
    this.position = this.position.add(directionVector.scale(displacement));

    // 5. 統計の更新
    this.totalDistance += displacement;
    this.totalTravelTime += dt;
    this.maxSpeedAchieved = Math.max(this.maxSpeedAchieved, this.velocity);

    // 待ち時間の更新（ほぼ停止状態の場合）
    if (this.velocity < 0.5) {
      this.waitTime += dt;
      if (this.status === 'approaching') {
        this.status = 'waiting';
      }
    } else if (this.status === 'waiting') {
      this.status = 'approaching';
    }
  }

  /**
   * 目標速度の計算
   */
  private calculateTargetSpeed(
    frontVehicle: Vehicle | null,
    signalDistance: number,
    signalPhase: 'green' | 'yellow' | 'red'
  ): number {
    let targetSpeed = this.maxSpeed;

    // 信号機の影響
    if (signalPhase === 'red' || signalPhase === 'yellow') {
      const stoppingDistance = this.calculateStoppingDistance();

      // 信号機手前で停止可能な場合
      if (signalDistance < stoppingDistance + 10) {
        targetSpeed = 0;
      }
    }

    // 前方車両の影響
    if (frontVehicle !== null) {
      const gap = this.calculateGap(frontVehicle);
      const safeGap = this.minGap + this.velocity * this.reactionTime;

      if (gap < safeGap) {
        // 前方車両に合わせて速度を調整
        targetSpeed = Math.min(targetSpeed, frontVehicle.velocity);
      }
    }

    return targetSpeed;
  }

  /**
   * 加速度の計算（IDM簡易版）
   */
  private calculateAcceleration(
    targetSpeed: number,
    frontVehicle: Vehicle | null
  ): number {
    let acceleration: number;

    // 自由流加速度項
    const freeAcceleration =
      this.maxAcceleration * (1 - Math.pow(this.velocity / this.maxSpeed, 4));

    // 目標速度への加速
    if (this.velocity < targetSpeed) {
      acceleration = freeAcceleration;
    } else {
      // 減速
      acceleration = -this.comfortableDeceleration;
    }

    // 前方車両との相互作用項
    if (frontVehicle !== null) {
      const gap = this.calculateGap(frontVehicle);
      const desiredGap = this.minGap + this.velocity * this.reactionTime;

      if (gap < desiredGap) {
        // 前方車両が近すぎる場合、強制的に減速
        const brakingTerm = -this.comfortableDeceleration * Math.pow(desiredGap / gap, 2);
        acceleration = Math.min(acceleration, brakingTerm);
      }
    }

    return acceleration;
  }

  /**
   * 停止距離の計算
   */
  private calculateStoppingDistance(): number {
    if (this.velocity <= 0) {
      return 0;
    }
    return (this.velocity * this.velocity) / (2 * this.comfortableDeceleration);
  }

  /**
   * 前方車両との車間距離（ギャップ）の計算
   */
  private calculateGap(frontVehicle: Vehicle): number {
    const distance = this.position.distance(frontVehicle.position);
    return Math.max(0, distance - frontVehicle.length);
  }

  /**
   * 進行方向の単位ベクトルを取得
   */
  private getDirectionVector(): Vector2D {
    switch (this.direction) {
      case 'north':
        return new Vector2D(0, 1);
      case 'south':
        return new Vector2D(0, -1);
      case 'east':
        return new Vector2D(1, 0);
      case 'west':
        return new Vector2D(-1, 0);
    }
  }

  /**
   * 交差点内にいるかチェック
   */
  isInIntersection(intersectionBounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  }): boolean {
    return (
      this.position.x >= intersectionBounds.xMin &&
      this.position.x <= intersectionBounds.xMax &&
      this.position.y >= intersectionBounds.yMin &&
      this.position.y <= intersectionBounds.yMax
    );
  }

  /**
   * シミュレーション領域外にいるかチェック
   */
  isOutsideBounds(boundaryDistance: number): boolean {
    return (
      Math.abs(this.position.x) > boundaryDistance ||
      Math.abs(this.position.y) > boundaryDistance
    );
  }

  /**
   * 車両データの取得（統計記録用）
   */
  getVehicleData(exitTime: number) {
    return {
      id: this.id,
      entryTime: exitTime - this.totalTravelTime,
      exitTime: exitTime,
      totalTravelTime: this.totalTravelTime,
      waitTime: this.waitTime,
      direction: this.direction,
      turnIntent: this.turnIntent,
      maxSpeedAchieved: this.maxSpeedAchieved,
    };
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    return `Vehicle(${this.id}, ${this.direction}, v=${this.velocity.toFixed(2)} m/s, status=${this.status})`;
  }
}
