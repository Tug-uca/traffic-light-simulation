/**
 * Data Collector
 * データ収集システム
 *
 * シミュレーション実行中のデータを収集・記録
 */

import type {
  Direction,
  VehicleData,
  QueueLengthRecord,
  SignalPhaseRecord,
} from './types';

export class DataCollector {
  // 車両データ
  private readonly vehicleData: VehicleData[] = [];

  // キュー長の時系列データ
  private readonly queueLengthHistory: QueueLengthRecord[] = [];

  // 信号フェーズの時系列データ
  private readonly signalPhaseHistory: SignalPhaseRecord[] = [];

  // ウォームアップ期間
  private readonly warmupPeriod: number;
  private isWarmupComplete: boolean = false;

  // サンプリング間隔（秒）
  private readonly samplingInterval: number = 5.0;
  private timeSinceLastSample: number = 0;

  constructor(warmupPeriod: number) {
    this.warmupPeriod = warmupPeriod;
  }

  /**
   * 車両の進入を記録
   * @param _vehicleId - 車両ID
   * @param _direction - 進入方向
   * @param time - 進入時刻（秒）
   */
  recordVehicleEntry(_vehicleId: string, _direction: Direction, time: number): void {
    // ウォームアップ期間の確認
    if (time >= this.warmupPeriod && !this.isWarmupComplete) {
      this.isWarmupComplete = true;
      console.log(`✓ Warmup period complete at t=${time.toFixed(2)}s`);
    }
  }

  /**
   * 車両の退出を記録
   * @param vehicleData - 車両データ
   */
  recordVehicleExit(vehicleData: VehicleData): void {
    // ウォームアップ期間後のデータのみ記録
    if (vehicleData.exitTime >= this.warmupPeriod) {
      this.vehicleData.push(vehicleData);
    }
  }

  /**
   * キュー長を記録
   * @param time - 現在時刻（秒）
   * @param queueLengths - 各方向のキュー長
   * @param dt - タイムステップ（秒）
   */
  recordQueueLength(
    time: number,
    queueLengths: Record<Direction, number>,
    dt: number
  ): void {
    this.timeSinceLastSample += dt;

    // サンプリング間隔ごとに記録
    if (this.timeSinceLastSample >= this.samplingInterval) {
      this.queueLengthHistory.push({
        time,
        queueLengths: { ...queueLengths },
      });
      this.timeSinceLastSample = 0;
    }
  }

  /**
   * 信号フェーズの変更を記録
   * @param time - 変更時刻（秒）
   * @param phases - 各方向の信号フェーズ
   */
  recordSignalPhase(
    time: number,
    phases: Record<Direction, 'green' | 'yellow' | 'red'>
  ): void {
    // フェーズ変更時のみ記録
    const lastRecord = this.signalPhaseHistory[this.signalPhaseHistory.length - 1];

    if (!lastRecord || !this.phasesEqual(lastRecord.phases, phases)) {
      this.signalPhaseHistory.push({
        time,
        phases: { ...phases },
      });
    }
  }

  /**
   * 信号フェーズが同じかチェック
   */
  private phasesEqual(
    p1: Record<Direction, 'green' | 'yellow' | 'red'>,
    p2: Record<Direction, 'green' | 'yellow' | 'red'>
  ): boolean {
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    return directions.every((dir) => p1[dir] === p2[dir]);
  }

  /**
   * 収集した車両データを取得
   * @returns 車両データの配列
   */
  getVehicleData(): VehicleData[] {
    return [...this.vehicleData];
  }

  /**
   * キュー長履歴を取得
   * @returns キュー長記録の配列
   */
  getQueueLengthHistory(): QueueLengthRecord[] {
    return [...this.queueLengthHistory];
  }

  /**
   * 信号フェーズ履歴を取得
   * @returns 信号フェーズ記録の配列
   */
  getSignalPhaseHistory(): SignalPhaseRecord[] {
    return [...this.signalPhaseHistory];
  }

  /**
   * 特定方向の車両データを取得
   * @param direction - 方向
   * @returns 車両データの配列
   */
  getVehicleDataByDirection(direction: Direction): VehicleData[] {
    return this.vehicleData.filter((v) => v.direction === direction);
  }

  /**
   * 時間範囲で車両データを絞り込み
   * @param startTime - 開始時刻（秒）
   * @param endTime - 終了時刻（秒）
   * @returns 車両データの配列
   */
  getVehicleDataByTimeRange(startTime: number, endTime: number): VehicleData[] {
    return this.vehicleData.filter(
      (v) => v.exitTime >= startTime && v.exitTime <= endTime
    );
  }

  /**
   * データ収集済みの車両数を取得
   * @returns 車両数
   */
  getCollectedVehicleCount(): number {
    return this.vehicleData.length;
  }

  /**
   * ウォームアップ完了フラグを取得
   * @returns ウォームアップが完了している場合true
   */
  isWarmupPeriodComplete(): boolean {
    return this.isWarmupComplete;
  }

  /**
   * リセット
   */
  reset(): void {
    this.vehicleData.length = 0;
    this.queueLengthHistory.length = 0;
    this.signalPhaseHistory.length = 0;
    this.isWarmupComplete = false;
    this.timeSinceLastSample = 0;
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      vehicleCount: this.vehicleData.length,
      queueLengthSamples: this.queueLengthHistory.length,
      signalPhaseChanges: this.signalPhaseHistory.length,
      warmupComplete: this.isWarmupComplete,
    };
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    return `DataCollector(vehicles=${this.vehicleData.length}, warmup=${this.isWarmupComplete})`;
  }
}
