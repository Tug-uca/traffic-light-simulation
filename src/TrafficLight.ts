/**
 * Traffic Light Class
 * 信号機クラス
 *
 * 固定サイクル方式の信号機を実装
 */

import { Vector2D } from './Vector2D';
import type { Direction, SignalPhase, TrafficLightConfig } from './types';

export class TrafficLight {
  // 識別情報
  public readonly id: string;
  public readonly direction: Direction;
  public readonly position: Vector2D;

  // 信号状態
  public phase: SignalPhase;
  public timeInPhase: number;

  // 信号サイクルパラメータ
  public readonly greenDuration: number;
  public readonly yellowDuration: number;
  public readonly allRedDuration: number;

  constructor(config: TrafficLightConfig) {
    // 識別情報
    this.id = config.id;
    this.direction = config.direction;
    this.position = new Vector2D(config.position.x, config.position.y);

    // 信号状態
    this.phase = config.initialPhase ?? 'red';
    this.timeInPhase = 0;

    // 信号サイクルパラメータ
    this.greenDuration = config.greenDuration;
    this.yellowDuration = config.yellowDuration;
    this.allRedDuration = config.allRedDuration;
  }

  /**
   * 信号フェーズを設定（外部制御による）
   * @param newPhase - 新しい信号フェーズ
   */
  setPhase(newPhase: SignalPhase): void {
    if (this.phase !== newPhase) {
      this.phase = newPhase;
      this.timeInPhase = 0;
    }
  }

  /**
   * フェーズ内の経過時間を進める
   * @param dt - タイムステップ（秒）
   */
  tick(dt: number): void {
    this.timeInPhase += dt;
  }

  /**
   * 車両が通過可能かどうか
   * @returns 青信号の場合true
   */
  canPass(): boolean {
    return this.phase === 'green';
  }

  /**
   * 現在のフェーズが終了したかどうか
   * @returns フェーズ終了の場合true
   */
  isPhaseComplete(): boolean {
    switch (this.phase) {
      case 'green':
        return this.timeInPhase >= this.greenDuration;
      case 'yellow':
        return this.timeInPhase >= this.yellowDuration;
      case 'red':
        // 赤信号の終了は外部制御による
        return false;
      default:
        return false;
    }
  }

  /**
   * 次のフェーズに移行（単独の信号機の場合）
   * 注: 実際の使用では SignalController が制御します
   */
  advancePhase(): void {
    switch (this.phase) {
      case 'green':
        this.setPhase('yellow');
        break;
      case 'yellow':
        this.setPhase('red');
        break;
      case 'red':
        // 赤信号から青信号への移行は外部制御
        break;
    }
  }

  /**
   * 信号の色を取得（描画用）
   * @returns RGB色文字列
   */
  getColor(): string {
    switch (this.phase) {
      case 'green':
        return '#2ecc71'; // 緑
      case 'yellow':
        return '#f39c12'; // 黄色
      case 'red':
        return '#e74c3c'; // 赤
      default:
        return '#95a5a6'; // グレー（エラー時）
    }
  }

  /**
   * 残り時間を取得
   * @returns 現在のフェーズの残り時間（秒）
   */
  getRemainingTime(): number {
    switch (this.phase) {
      case 'green':
        return Math.max(0, this.greenDuration - this.timeInPhase);
      case 'yellow':
        return Math.max(0, this.yellowDuration - this.timeInPhase);
      case 'red':
        return 0; // 赤信号の残り時間は外部制御による
      default:
        return 0;
    }
  }

  /**
   * 信号状態のリセット
   */
  reset(initialPhase: SignalPhase = 'red'): void {
    this.phase = initialPhase;
    this.timeInPhase = 0;
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    return `TrafficLight(${this.id}, ${this.direction}, ${this.phase}, ${this.timeInPhase.toFixed(1)}s)`;
  }

  /**
   * 信号状態のスナップショット取得
   */
  getSnapshot() {
    return {
      id: this.id,
      direction: this.direction,
      phase: this.phase,
      timeInPhase: this.timeInPhase,
      remainingTime: this.getRemainingTime(),
    };
  }
}
