/**
 * Signal Controller
 * 信号制御システム
 *
 * 固定サイクル方式で4方向の信号機を協調制御
 */

import { TrafficLight } from './TrafficLight';
import type { Direction, SignalPhase, SignalControlConfig } from './types';

/**
 * 信号制御フェーズ
 */
type ControlPhase =
  | 'northSouthGreen'
  | 'northSouthYellow'
  | 'allRed1'
  | 'eastWestGreen'
  | 'eastWestYellow'
  | 'allRed2';

export class SignalController {
  private readonly trafficLights: Map<Direction, TrafficLight>;
  private readonly config: SignalControlConfig;

  // 現在のフェーズと経過時間
  private currentPhase: ControlPhase;
  private timeInPhase: number;
  private cycleCount: number;

  constructor(
    trafficLights: Map<Direction, TrafficLight>,
    config: SignalControlConfig
  ) {
    this.trafficLights = trafficLights;
    this.config = config;

    // 初期状態
    this.currentPhase = 'northSouthGreen';
    this.timeInPhase = 0;
    this.cycleCount = 0;

    // 初期フェーズを各信号機に設定
    this.applyCurrentPhase();
  }

  /**
   * 信号制御の更新（毎タイムステップ呼び出し）
   * @param dt - タイムステップ（秒）
   */
  update(dt: number): void {
    this.timeInPhase += dt;

    // 各信号機の内部時計を更新
    for (const light of this.trafficLights.values()) {
      light.tick(dt);
    }

    // フェーズ切り替えのチェック
    if (this.shouldAdvancePhase()) {
      this.advancePhase();
    }
  }

  /**
   * 次のフェーズに進むべきかチェック
   * @returns フェーズ切り替えが必要な場合true
   */
  private shouldAdvancePhase(): boolean {
    const phaseDuration = this.getPhaseDuration(this.currentPhase);
    return this.timeInPhase >= phaseDuration;
  }

  /**
   * 現在のフェーズの継続時間を取得
   * @param phase - 制御フェーズ
   * @returns 継続時間（秒）
   */
  private getPhaseDuration(phase: ControlPhase): number {
    switch (phase) {
      case 'northSouthGreen':
        return this.config.greenDuration.northSouth;
      case 'northSouthYellow':
        return this.config.yellowDuration;
      case 'allRed1':
        return this.config.allRedDuration;
      case 'eastWestGreen':
        return this.config.greenDuration.eastWest;
      case 'eastWestYellow':
        return this.config.yellowDuration;
      case 'allRed2':
        return this.config.allRedDuration;
    }
  }

  /**
   * 次のフェーズに進む
   */
  private advancePhase(): void {
    // フェーズ遷移
    switch (this.currentPhase) {
      case 'northSouthGreen':
        this.currentPhase = 'northSouthYellow';
        break;
      case 'northSouthYellow':
        this.currentPhase = 'allRed1';
        break;
      case 'allRed1':
        this.currentPhase = 'eastWestGreen';
        break;
      case 'eastWestGreen':
        this.currentPhase = 'eastWestYellow';
        break;
      case 'eastWestYellow':
        this.currentPhase = 'allRed2';
        break;
      case 'allRed2':
        this.currentPhase = 'northSouthGreen';
        this.cycleCount++;
        break;
    }

    // 新しいフェーズを各信号機に適用
    this.timeInPhase = 0;
    this.applyCurrentPhase();
  }

  /**
   * 現在のフェーズを各信号機に適用
   */
  private applyCurrentPhase(): void {
    const phases = this.getSignalPhases(this.currentPhase);

    for (const [direction, phase] of Object.entries(phases)) {
      const light = this.trafficLights.get(direction as Direction);
      if (light) {
        light.setPhase(phase);
      }
    }
  }

  /**
   * 制御フェーズから各方向の信号フェーズを取得
   * @param controlPhase - 制御フェーズ
   * @returns 各方向の信号フェーズ
   */
  private getSignalPhases(
    controlPhase: ControlPhase
  ): Record<Direction, SignalPhase> {
    switch (controlPhase) {
      case 'northSouthGreen':
        return {
          north: 'green',
          south: 'green',
          east: 'red',
          west: 'red',
        };
      case 'northSouthYellow':
        return {
          north: 'yellow',
          south: 'yellow',
          east: 'red',
          west: 'red',
        };
      case 'allRed1':
      case 'allRed2':
        return {
          north: 'red',
          south: 'red',
          east: 'red',
          west: 'red',
        };
      case 'eastWestGreen':
        return {
          north: 'red',
          south: 'red',
          east: 'green',
          west: 'green',
        };
      case 'eastWestYellow':
        return {
          north: 'red',
          south: 'red',
          east: 'yellow',
          west: 'yellow',
        };
    }
  }

  /**
   * 指定方向の信号機を取得
   * @param direction - 方向
   * @returns 信号機、存在しない場合null
   */
  getTrafficLight(direction: Direction): TrafficLight | null {
    return this.trafficLights.get(direction) ?? null;
  }

  /**
   * 現在のサイクル番号を取得
   * @returns サイクル番号
   */
  getCycleCount(): number {
    return this.cycleCount;
  }

  /**
   * 現在のサイクル内経過時間を取得
   * @returns 経過時間（秒）
   */
  getTimeInCycle(): number {
    // 現在のフェーズまでの累積時間
    let elapsedTime = 0;

    const phaseOrder: ControlPhase[] = [
      'northSouthGreen',
      'northSouthYellow',
      'allRed1',
      'eastWestGreen',
      'eastWestYellow',
      'allRed2',
    ];

    for (const phase of phaseOrder) {
      if (phase === this.currentPhase) {
        break;
      }
      elapsedTime += this.getPhaseDuration(phase);
    }

    return elapsedTime + this.timeInPhase;
  }

  /**
   * サイクル長を取得
   * @returns サイクル長（秒）
   */
  getCycleLength(): number {
    return this.config.cycleLength;
  }

  /**
   * リセット
   */
  reset(): void {
    this.currentPhase = 'northSouthGreen';
    this.timeInPhase = 0;
    this.cycleCount = 0;

    // すべての信号機をリセット
    for (const light of this.trafficLights.values()) {
      light.reset('red');
    }

    // 初期フェーズを適用
    this.applyCurrentPhase();
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      currentPhase: this.currentPhase,
      timeInPhase: this.timeInPhase,
      cycleCount: this.cycleCount,
      timeInCycle: this.getTimeInCycle(),
      cycleLength: this.config.cycleLength,
    };
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    return `SignalController(phase=${this.currentPhase}, cycle=${this.cycleCount}, time=${this.timeInPhase.toFixed(1)}s)`;
  }
}
