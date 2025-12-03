/**
 * Statistics Calculator
 * 統計計算システム
 *
 * シミュレーション結果の統計指標を計算
 */

import type {
  VehicleData,
  QueueLengthRecord,
  Direction,
  Statistics,
  DirectionStatistics,
} from './types';

export class StatisticsCalculator {
  /**
   * 車両データから統計を計算
   * @param vehicleData - 車両データの配列
   * @param queueLengthHistory - キュー長履歴
   * @param simulationDuration - シミュレーション時間（秒）
   * @param warmupPeriod - ウォームアップ期間（秒）
   * @returns 統計データ
   */
  static calculate(
    vehicleData: VehicleData[],
    queueLengthHistory: QueueLengthRecord[],
    simulationDuration: number,
    warmupPeriod: number
  ): Statistics {
    // 有効なシミュレーション時間（ウォームアップ除く）
    const effectiveDuration = simulationDuration - warmupPeriod;

    // 全体統計
    const totalVehicles = vehicleData.length;
    const averageTravelTime = this.calculateAverageTravelTime(vehicleData);
    const averageWaitTime = this.calculateAverageWaitTime(vehicleData);
    const throughput = this.calculateThroughput(vehicleData, effectiveDuration);
    const averageDelay = this.calculateAverageDelay(vehicleData);
    const averageQueueLength = this.calculateAverageQueueLength(queueLengthHistory);

    // 方向別統計
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    const byDirection = {} as Record<Direction, DirectionStatistics>;

    for (const direction of directions) {
      byDirection[direction] = this.calculateDirectionStatistics(
        vehicleData,
        queueLengthHistory,
        direction,
        effectiveDuration
      );
    }

    return {
      totalVehicles,
      averageTravelTime,
      averageWaitTime,
      throughput,
      averageDelay,
      averageQueueLength,
      byDirection,
    };
  }

  /**
   * 平均走行時間を計算
   * @param vehicleData - 車両データ
   * @returns 平均走行時間（秒）
   */
  private static calculateAverageTravelTime(vehicleData: VehicleData[]): number {
    if (vehicleData.length === 0) {
      return 0;
    }

    const totalTime = vehicleData.reduce(
      (sum, v) => sum + v.totalTravelTime,
      0
    );
    return totalTime / vehicleData.length;
  }

  /**
   * 平均待ち時間を計算
   * @param vehicleData - 車両データ
   * @returns 平均待ち時間（秒）
   */
  private static calculateAverageWaitTime(vehicleData: VehicleData[]): number {
    if (vehicleData.length === 0) {
      return 0;
    }

    const totalWaitTime = vehicleData.reduce((sum, v) => sum + v.waitTime, 0);
    return totalWaitTime / vehicleData.length;
  }

  /**
   * スループットを計算（車両/時）
   * @param vehicleData - 車両データ
   * @param duration - 有効シミュレーション時間（秒）
   * @returns スループット（車両/時）
   */
  private static calculateThroughput(
    vehicleData: VehicleData[],
    duration: number
  ): number {
    if (duration <= 0) {
      return 0;
    }

    // 秒から時間に変換
    const durationInHours = duration / 3600;
    return vehicleData.length / durationInHours;
  }

  /**
   * 平均遅延を計算
   * @param vehicleData - 車両データ
   * @returns 平均遅延（秒）
   */
  private static calculateAverageDelay(vehicleData: VehicleData[]): number {
    // 遅延 = 待ち時間（簡易的に待ち時間を遅延とする）
    return this.calculateAverageWaitTime(vehicleData);
  }

  /**
   * 平均キュー長を計算
   * @param queueLengthHistory - キュー長履歴
   * @returns 平均キュー長（台）
   */
  private static calculateAverageQueueLength(
    queueLengthHistory: QueueLengthRecord[]
  ): number {
    if (queueLengthHistory.length === 0) {
      return 0;
    }

    // 全方向の平均キュー長の平均
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    let totalQueueLength = 0;
    let sampleCount = 0;

    for (const record of queueLengthHistory) {
      for (const direction of directions) {
        totalQueueLength += record.queueLengths[direction];
        sampleCount++;
      }
    }

    return sampleCount > 0 ? totalQueueLength / sampleCount : 0;
  }

  /**
   * 方向別統計を計算
   * @param vehicleData - 車両データ
   * @param queueLengthHistory - キュー長履歴
   * @param direction - 対象方向
   * @param duration - 有効シミュレーション時間（秒）
   * @returns 方向別統計
   */
  private static calculateDirectionStatistics(
    vehicleData: VehicleData[],
    queueLengthHistory: QueueLengthRecord[],
    direction: Direction,
    duration: number
  ): DirectionStatistics {
    // 指定方向の車両データを抽出
    const directionVehicles = vehicleData.filter((v) => v.direction === direction);

    const vehicleCount = directionVehicles.length;
    const averageTravelTime = this.calculateAverageTravelTime(directionVehicles);
    const averageWaitTime = this.calculateAverageWaitTime(directionVehicles);
    const throughput = this.calculateThroughput(directionVehicles, duration);

    // 方向別の平均キュー長
    const averageQueueLength = this.calculateDirectionAverageQueueLength(
      queueLengthHistory,
      direction
    );

    return {
      vehicleCount,
      averageTravelTime,
      averageWaitTime,
      throughput,
      averageQueueLength,
    };
  }

  /**
   * 方向別の平均キュー長を計算
   * @param queueLengthHistory - キュー長履歴
   * @param direction - 対象方向
   * @returns 平均キュー長（台）
   */
  private static calculateDirectionAverageQueueLength(
    queueLengthHistory: QueueLengthRecord[],
    direction: Direction
  ): number {
    if (queueLengthHistory.length === 0) {
      return 0;
    }

    const totalQueueLength = queueLengthHistory.reduce(
      (sum, record) => sum + record.queueLengths[direction],
      0
    );

    return totalQueueLength / queueLengthHistory.length;
  }

  /**
   * パーセンタイル値を計算
   * @param values - 数値配列
   * @param percentile - パーセンタイル（0-100）
   * @returns パーセンタイル値
   */
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * 標準偏差を計算
   * @param values - 数値配列
   * @returns 標準偏差
   */
  static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * 時系列データの移動平均を計算
   * @param values - 数値配列
   * @param windowSize - ウィンドウサイズ
   * @returns 移動平均の配列
   */
  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = values.slice(start, i + 1);
      const average = window.reduce((sum, v) => sum + v, 0) / window.length;
      result.push(average);
    }

    return result;
  }
}
