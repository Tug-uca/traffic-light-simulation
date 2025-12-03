/**
 * Results Panel
 * 結果表示パネル
 *
 * シミュレーション結果の表示とエクスポート
 */

import type { SimulationResults } from './types';
import { DataExporter } from './DataExporter';

export class ResultsPanel {
  private readonly container: HTMLElement;
  private results: SimulationResults | null = null;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
  }

  /**
   * 結果を表示
   * @param results - シミュレーション結果
   */
  displayResults(results: SimulationResults): void {
    this.results = results;

    const html = `
      <div class="results-panel">
        <h3>シミュレーション結果</h3>

        <div class="results-section">
          <h4>全体統計</h4>
          <table class="results-table">
            <tr>
              <th>指標</th>
              <th>値</th>
            </tr>
            <tr>
              <td>総車両数</td>
              <td>${results.statistics.totalVehicles}台</td>
            </tr>
            <tr>
              <td>平均走行時間</td>
              <td>${results.statistics.averageTravelTime.toFixed(2)}秒</td>
            </tr>
            <tr>
              <td>平均待ち時間</td>
              <td>${results.statistics.averageWaitTime.toFixed(2)}秒</td>
            </tr>
            <tr>
              <td>スループット</td>
              <td>${results.statistics.throughput.toFixed(1)}台/時</td>
            </tr>
            <tr>
              <td>平均遅延</td>
              <td>${results.statistics.averageDelay.toFixed(2)}秒</td>
            </tr>
            <tr>
              <td>平均キュー長</td>
              <td>${results.statistics.averageQueueLength.toFixed(2)}台</td>
            </tr>
          </table>
        </div>

        <div class="results-section">
          <h4>方向別統計</h4>
          ${this.generateDirectionTable(results)}
        </div>

        <div class="results-section">
          <h4>安全性指標</h4>
          <table class="results-table">
            <tr>
              <th>指標</th>
              <th>値</th>
            </tr>
            <tr>
              <td>衝突数</td>
              <td>${results.collisionEvents.filter((e) => e.severity === 'collision').length}件</td>
            </tr>
            <tr>
              <td>ニアミス数</td>
              <td>${results.collisionEvents.filter((e) => e.severity === 'near-miss').length}件</td>
            </tr>
          </table>
        </div>

        <div class="results-actions">
          <button id="export-json-button">JSON形式でエクスポート</button>
          <button id="export-csv-button">CSV形式でエクスポート</button>
          <button id="save-local-button">ローカルに保存</button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.setupEventListeners();
  }

  /**
   * 方向別統計テーブルを生成
   */
  private generateDirectionTable(results: SimulationResults): string {
    const directions = [
      { key: 'north', label: '北' },
      { key: 'south', label: '南' },
      { key: 'east', label: '東' },
      { key: 'west', label: '西' },
    ];

    const rows = directions
      .map((dir) => {
        const stats = results.statistics.byDirection[dir.key as 'north' | 'south' | 'east' | 'west'];
        return `
        <tr>
          <td>${dir.label}</td>
          <td>${stats.vehicleCount}台</td>
          <td>${stats.averageTravelTime.toFixed(2)}秒</td>
          <td>${stats.averageWaitTime.toFixed(2)}秒</td>
          <td>${stats.throughput.toFixed(1)}台/時</td>
          <td>${stats.averageQueueLength.toFixed(2)}台</td>
        </tr>
      `;
      })
      .join('');

    return `
      <table class="results-table">
        <tr>
          <th>方向</th>
          <th>車両数</th>
          <th>平均走行時間</th>
          <th>平均待ち時間</th>
          <th>スループット</th>
          <th>平均キュー長</th>
        </tr>
        ${rows}
      </table>
    `;
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    const exportJsonButton = document.getElementById('export-json-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const saveLocalButton = document.getElementById('save-local-button');

    exportJsonButton?.addEventListener('click', () => this.exportJSON());
    exportCsvButton?.addEventListener('click', () => this.exportCSV());
    saveLocalButton?.addEventListener('click', () => this.saveLocal());
  }

  /**
   * JSON形式でエクスポート
   */
  private exportJSON(): void {
    if (!this.results) {
      alert('結果がありません');
      return;
    }

    DataExporter.downloadResults(this.results);
  }

  /**
   * CSV形式でエクスポート
   */
  private exportCSV(): void {
    if (!this.results) {
      alert('結果がありません');
      return;
    }

    DataExporter.downloadVehicleDataAsCSV(this.results);
  }

  /**
   * ローカルストレージに保存
   */
  private saveLocal(): void {
    if (!this.results) {
      alert('結果がありません');
      return;
    }

    try {
      DataExporter.saveToLocalStorage('latest-simulation-results', this.results);
      alert('結果がローカルストレージに保存されました');
    } catch (error) {
      alert(`保存に失敗しました: ${error}`);
    }
  }

  /**
   * 表示をクリア
   */
  clear(): void {
    this.container.innerHTML = '';
    this.results = null;
  }

  /**
   * サマリーを表示
   */
  displaySummary(message: string): void {
    this.container.innerHTML = `
      <div class="results-summary">
        <p>${message}</p>
      </div>
    `;
  }
}
