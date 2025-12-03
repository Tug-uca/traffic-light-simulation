/**
 * Traffic Light Simulation
 * 信号機シミュレーション
 *
 * メインシミュレーションクラス
 */

import { Random } from './Random';
import { Intersection } from './Intersection';
import { TrafficLight } from './TrafficLight';
import { SignalController } from './SignalController';
import { VehicleGenerator } from './VehicleGenerator';
import { MovementSystem } from './MovementSystem';
import { CollisionAvoidance } from './CollisionAvoidance';
import { DataCollector } from './DataCollector';
import { StatisticsCalculator } from './Statistics';
import type {
  SimulationConfig,
  SimulationResults,
  Direction,
  Statistics,
} from './types';

/**
 * シミュレーション状態
 */
export type SimulationState = 'ready' | 'running' | 'paused' | 'completed';

export class Simulation {
  // 設定
  private readonly config: SimulationConfig;

  // コアコンポーネント
  private readonly rng: Random;
  private readonly intersection: Intersection;
  private readonly signalController: SignalController;
  private readonly vehicleGenerator: VehicleGenerator;
  private readonly movementSystem: MovementSystem;
  private readonly collisionAvoidance: CollisionAvoidance;
  private readonly dataCollector: DataCollector;

  // シミュレーション状態
  private state: SimulationState = 'ready';
  private currentTime: number = 0;

  constructor(config: SimulationConfig) {
    this.config = config;

    // 乱数生成器の初期化
    this.rng = new Random(config.randomSeed);

    // 交差点の初期化
    this.intersection = new Intersection({
      type: config.intersection.type,
      width: config.intersection.width,
      approachLength: config.intersection.approachLength,
      laneWidth: config.intersection.laneWidth,
      numLanes: config.intersection.numLanes,
    });

    // 信号機の初期化
    const trafficLights = this.initializeTrafficLights();
    this.signalController = new SignalController(
      trafficLights,
      config.signalControl
    );

    // 車両生成器の初期化
    this.vehicleGenerator = new VehicleGenerator(
      config.vehicleGeneration,
      config.vehicleDefaults,
      this.rng
    );

    // 移動システムの初期化
    this.movementSystem = new MovementSystem(
      this.intersection,
      this.signalController
    );

    // 衝突回避システムの初期化
    this.collisionAvoidance = new CollisionAvoidance(this.intersection);

    // データ収集システムの初期化
    this.dataCollector = new DataCollector(config.warmupPeriod);
  }

  /**
   * 信号機を初期化
   */
  private initializeTrafficLights(): Map<Direction, TrafficLight> {
    const lights = new Map<Direction, TrafficLight>();
    const activeDirections = this.intersection.getActiveDirections();

    for (const direction of activeDirections) {
      const position = this.intersection.getTrafficLightPosition(direction);

      const light = new TrafficLight({
        id: `tl-${direction}`,
        direction,
        position,
        greenDuration: this.getGreenDuration(direction),
        yellowDuration: this.config.signalControl.yellowDuration,
        allRedDuration: this.config.signalControl.allRedDuration,
        initialPhase: 'red',
      });

      lights.set(direction, light);
    }

    return lights;
  }

  /**
   * 方向別の青時間を取得
   */
  private getGreenDuration(direction: Direction): number {
    if (direction === 'north' || direction === 'south') {
      return this.config.signalControl.greenDuration.northSouth;
    } else {
      return this.config.signalControl.greenDuration.eastWest;
    }
  }

  /**
   * シミュレーションを1ステップ実行
   */
  step(): void {
    const dt = this.config.timeStep;

    // 1. 車両生成
    this.generateVehicles(dt);

    // 2. 信号制御の更新
    this.signalController.update(dt);

    // 3. 車両移動の更新
    this.movementSystem.updateAllVehicles(dt);

    // 4. 衝突チェック
    const allVehicles = this.movementSystem.getAllVehicles();
    this.collisionAvoidance.checkCollisions(allVehicles, this.currentTime);

    // 5. 退出車両の処理
    const exitedVehicles = this.movementSystem.removeExitedVehicles();
    for (const vehicle of exitedVehicles) {
      const vehicleData = vehicle.getVehicleData(this.currentTime);
      this.dataCollector.recordVehicleExit(vehicleData);
    }

    // 6. データ収集
    this.collectData(dt);

    // 7. 時刻を進める
    this.currentTime += dt;

    // 8. 終了判定
    if (this.currentTime >= this.config.duration) {
      this.complete();
    }
  }

  /**
   * 車両を生成
   */
  private generateVehicles(dt: number): void {
    const activeDirections = this.intersection.getActiveDirections();

    for (const direction of activeDirections) {
      const road = this.intersection.getRoad(direction);
      if (!road) {
        continue;
      }

      const entryPosition = road.getEntryPosition(0);
      const vehicle = this.vehicleGenerator.tryGenerate(
        direction,
        dt,
        { x: entryPosition.x, y: entryPosition.y }
      );

      if (vehicle) {
        this.movementSystem.addVehicle(vehicle);
        this.dataCollector.recordVehicleEntry(
          vehicle.id,
          direction,
          this.currentTime
        );
      }
    }
  }

  /**
   * データ収集
   */
  private collectData(dt: number): void {
    // キュー長の記録
    const queueLengths: Record<Direction, number> = {
      north: this.getQueueLength('north'),
      south: this.getQueueLength('south'),
      east: this.getQueueLength('east'),
      west: this.getQueueLength('west'),
    };

    this.dataCollector.recordQueueLength(this.currentTime, queueLengths, dt);

    // 信号フェーズの記録
    const phases: Record<Direction, 'green' | 'yellow' | 'red'> = {
      north: this.getSignalPhase('north'),
      south: this.getSignalPhase('south'),
      east: this.getSignalPhase('east'),
      west: this.getSignalPhase('west'),
    };

    this.dataCollector.recordSignalPhase(this.currentTime, phases);
  }

  /**
   * 方向別のキュー長を取得
   */
  private getQueueLength(direction: Direction): number {
    const vehicles = this.movementSystem.getVehiclesByDirection(direction);
    return vehicles.filter((v) => v.status === 'waiting').length;
  }

  /**
   * 方向別の信号フェーズを取得
   */
  private getSignalPhase(direction: Direction): 'green' | 'yellow' | 'red' {
    const light = this.signalController.getTrafficLight(direction);
    return light ? light.phase : 'red';
  }

  /**
   * シミュレーションを開始
   */
  start(): void {
    if (this.state !== 'ready' && this.state !== 'paused') {
      console.warn('⚠️ Simulation is not in a startable state');
      return;
    }

    this.state = 'running';
    console.log(`▶️ Simulation started (duration: ${this.config.duration}s)`);
  }

  /**
   * シミュレーションを一時停止
   */
  pause(): void {
    if (this.state !== 'running') {
      console.warn('⚠️ Simulation is not running');
      return;
    }

    this.state = 'paused';
    console.log('⏸️ Simulation paused');
  }

  /**
   * シミュレーションを再開
   */
  resume(): void {
    if (this.state !== 'paused') {
      console.warn('⚠️ Simulation is not paused');
      return;
    }

    this.state = 'running';
    console.log('▶️ Simulation resumed');
  }

  /**
   * シミュレーションを停止
   */
  stop(): void {
    this.state = 'completed';
    console.log('⏹️ Simulation stopped');
  }

  /**
   * シミュレーションを完了
   */
  private complete(): void {
    this.state = 'completed';
    console.log('✅ Simulation completed');
  }

  /**
   * シミュレーションをリセット
   */
  reset(): void {
    this.currentTime = 0;
    this.state = 'ready';

    this.signalController.reset();
    this.movementSystem.reset();
    this.collisionAvoidance.reset();
    this.dataCollector.reset();
    this.vehicleGenerator.reset();

    console.log('🔄 Simulation reset');
  }

  /**
   * シミュレーション結果を取得
   */
  getResults(): SimulationResults {
    const vehicleData = this.dataCollector.getVehicleData();
    const queueLengthHistory = this.dataCollector.getQueueLengthHistory();

    // 統計計算
    const statistics = StatisticsCalculator.calculate(
      vehicleData,
      queueLengthHistory,
      this.config.duration,
      this.config.warmupPeriod
    );

    return {
      config: this.config,
      statistics,
      vehicleData,
      queueLengthHistory,
      signalPhaseHistory: this.dataCollector.getSignalPhaseHistory(),
      collisionEvents: this.collisionAvoidance.getCollisionEvents(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 現在の統計を取得（実行中）
   */
  getCurrentStatistics(): Statistics {
    const vehicleData = this.dataCollector.getVehicleData();
    const queueLengthHistory = this.dataCollector.getQueueLengthHistory();

    return StatisticsCalculator.calculate(
      vehicleData,
      queueLengthHistory,
      this.currentTime,
      this.config.warmupPeriod
    );
  }

  /**
   * シミュレーション状態を取得
   */
  getState(): SimulationState {
    return this.state;
  }

  /**
   * 現在時刻を取得
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * 進捗率を取得（0-1）
   */
  getProgress(): number {
    return Math.min(1, this.currentTime / this.config.duration);
  }

  /**
   * 全車両数を取得
   */
  getVehicleCount(): number {
    return this.movementSystem.getTotalVehicleCount();
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo() {
    return {
      time: this.currentTime.toFixed(2),
      state: this.state,
      vehicleCount: this.movementSystem.getTotalVehicleCount(),
      collectedVehicles: this.dataCollector.getCollectedVehicleCount(),
      signalCycle: this.signalController.getCycleCount(),
      collisions: this.collisionAvoidance.getCollisionCount('collision'),
      nearMisses: this.collisionAvoidance.getCollisionCount('near-miss'),
    };
  }

  /**
   * 全車両を取得（描画用）
   */
  getAllVehicles() {
    return this.movementSystem.getAllVehicles();
  }

  /**
   * すべての信号機を取得（描画用）
   */
  getAllTrafficLights() {
    const lights = [];
    const directions: Direction[] = ['north', 'south', 'east', 'west'];

    for (const direction of directions) {
      const light = this.signalController.getTrafficLight(direction);
      if (light) {
        lights.push(light);
      }
    }

    return lights;
  }

  /**
   * 交差点を取得
   */
  getIntersection() {
    return this.intersection;
  }
}
