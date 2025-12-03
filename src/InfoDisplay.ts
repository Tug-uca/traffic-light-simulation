/**
 * Info Display
 * 情報表示システム
 *
 * シミュレーション情報をHTMLで表示
 */

import { Simulation } from './Simulation';
import type { Statistics } from './types';

export class InfoDisplay {
  private readonly container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
  }

  /**
   * シミュレーション情報を更新
   * @param simulation - シミュレーションインスタンス
   */
  update(simulation: Simulation): void {
    const debugInfo = simulation.getDebugInfo();
    const progress = simulation.getProgress();

    const html = `
      <div class="info-section">
        <h3>シミュレーション状態</h3>
        <p><strong>時刻:</strong> ${debugInfo.time}s</p>
        <p><strong>状態:</strong> ${this.translateState(debugInfo.state)}</p>
        <p><strong>進捗:</strong> ${(progress * 100).toFixed(1)}%</p>
      </div>

      <div class="info-section">
        <h3>車両情報</h3>
        <p><strong>現在車両数:</strong> ${debugInfo.vehicleCount}台</p>
        <p><strong>通過車両数:</strong> ${debugInfo.collectedVehicles}台</p>
      </div>

      <div class="info-section">
        <h3>信号情報</h3>
        <p><strong>サイクル数:</strong> ${debugInfo.signalCycle}</p>
      </div>

      <div class="info-section">
        <h3>安全性</h3>
        <p><strong>衝突:</strong> ${debugInfo.collisions}件</p>
        <p><strong>ニアミス:</strong> ${debugInfo.nearMisses}件</p>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * 統計情報を表示
   * @param statistics - 統計データ
   */
  displayStatistics(statistics: Statistics): void {
    const html = `
      <div class="info-section">
        <h3>全体統計</h3>
        <p><strong>総車両数:</strong> ${statistics.totalVehicles}台</p>
        <p><strong>平均走行時間:</strong> ${statistics.averageTravelTime.toFixed(2)}秒</p>
        <p><strong>平均待ち時間:</strong> ${statistics.averageWaitTime.toFixed(2)}秒</p>
        <p><strong>スループット:</strong> ${statistics.throughput.toFixed(1)}台/時</p>
        <p><strong>平均キュー長:</strong> ${statistics.averageQueueLength.toFixed(2)}台</p>
      </div>

      <div class="info-section">
        <h3>方向別統計</h3>
        ${this.generateDirectionStats(statistics)}
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * 方向別統計のHTML生成
   */
  private generateDirectionStats(statistics: Statistics): string {
    const directions = [
      { key: 'north', label: '北' },
      { key: 'south', label: '南' },
      { key: 'east', label: '東' },
      { key: 'west', label: '西' },
    ];

    return directions
      .map((dir) => {
        const stats = statistics.byDirection[dir.key as 'north' | 'south' | 'east' | 'west'];
        return `
        <div class="direction-stats">
          <h4>${dir.label}方向</h4>
          <p>車両数: ${stats.vehicleCount}台</p>
          <p>平均走行時間: ${stats.averageTravelTime.toFixed(2)}秒</p>
          <p>平均待ち時間: ${stats.averageWaitTime.toFixed(2)}秒</p>
          <p>スループット: ${stats.throughput.toFixed(1)}台/時</p>
        </div>
      `;
      })
      .join('');
  }

  /**
   * 状態を日本語に翻訳
   */
  private translateState(state: string): string {
    switch (state) {
      case 'ready':
        return '準備完了';
      case 'running':
        return '実行中';
      case 'paused':
        return '一時停止';
      case 'completed':
        return '完了';
      default:
        return state;
    }
  }

  /**
   * メッセージを表示
   * @param message - メッセージ
   * @param type - メッセージタイプ
   */
  displayMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const className = `message-${type}`;
    const html = `<div class="${className}">${message}</div>`;
    this.container.innerHTML = html;
  }

  /**
   * 表示をクリア
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
