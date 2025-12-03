/**
 * Parameter Editor
 * パラメータ編集UI
 *
 * シミュレーションパラメータの編集機能
 */

import type { SimulationConfig } from './types';
import { exportConfig, importConfig } from './config';

export class ParameterEditor {
  private readonly container: HTMLElement;
  private config: SimulationConfig;

  constructor(containerId: string, initialConfig: SimulationConfig) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    this.config = initialConfig;

    this.render();
  }

  /**
   * パラメータエディタUIを描画
   */
  private render(): void {
    const html = `
      <div class="parameter-editor">
        <h3>シミュレーションパラメータ</h3>

        <div class="param-section">
          <h4>基本設定</h4>
          <label>
            シミュレーション時間 (秒):
            <input type="number" id="param-duration" value="${this.config.duration}" min="60" max="7200" step="60">
          </label>
          <label>
            タイムステップ (秒):
            <input type="number" id="param-timestep" value="${this.config.timeStep}" min="0.1" max="1.0" step="0.1">
          </label>
          <label>
            ウォームアップ期間 (秒):
            <input type="number" id="param-warmup" value="${this.config.warmupPeriod}" min="0" max="600" step="30">
          </label>
        </div>

        <div class="param-section">
          <h4>信号制御</h4>
          <label>
            南北方向の青時間 (秒):
            <input type="number" id="param-green-ns" value="${this.config.signalControl.greenDuration.northSouth}" min="10" max="120" step="5">
          </label>
          <label>
            東西方向の青時間 (秒):
            <input type="number" id="param-green-ew" value="${this.config.signalControl.greenDuration.eastWest}" min="10" max="120" step="5">
          </label>
          <label>
            黄時間 (秒):
            <input type="number" id="param-yellow" value="${this.config.signalControl.yellowDuration}" min="2" max="10" step="1">
          </label>
          <label>
            全赤時間 (秒):
            <input type="number" id="param-allred" value="${this.config.signalControl.allRedDuration}" min="0" max="10" step="1">
          </label>
        </div>

        <div class="param-section">
          <h4>車両生成率 (台/分)</h4>
          <label>
            北方向:
            <input type="number" id="param-spawn-north" value="${this.config.vehicleGeneration.spawnRates.north}" min="0" max="60" step="1">
          </label>
          <label>
            南方向:
            <input type="number" id="param-spawn-south" value="${this.config.vehicleGeneration.spawnRates.south}" min="0" max="60" step="1">
          </label>
          <label>
            東方向:
            <input type="number" id="param-spawn-east" value="${this.config.vehicleGeneration.spawnRates.east}" min="0" max="60" step="1">
          </label>
          <label>
            西方向:
            <input type="number" id="param-spawn-west" value="${this.config.vehicleGeneration.spawnRates.west}" min="0" max="60" step="1">
          </label>
        </div>

        <div class="param-section">
          <h4>進行確率</h4>
          <label>
            直進確率:
            <input type="number" id="param-prob-straight" value="${this.config.vehicleGeneration.turnProbabilities.straight}" min="0" max="1" step="0.1">
          </label>
          <label>
            左折確率:
            <input type="number" id="param-prob-left" value="${this.config.vehicleGeneration.turnProbabilities.left}" min="0" max="1" step="0.1">
          </label>
          <label>
            右折確率:
            <input type="number" id="param-prob-right" value="${this.config.vehicleGeneration.turnProbabilities.right}" min="0" max="1" step="0.1">
          </label>
        </div>

        <div class="param-actions">
          <button id="apply-params-button">適用</button>
          <button id="reset-params-button">デフォルトに戻す</button>
          <button id="export-params-button">エクスポート</button>
          <button id="import-params-button">インポート</button>
        </div>

        <input type="file" id="import-file-input" accept=".json" style="display: none;">
      </div>
    `;

    this.container.innerHTML = html;
    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    const applyButton = document.getElementById('apply-params-button');
    const resetButton = document.getElementById('reset-params-button');
    const exportButton = document.getElementById('export-params-button');
    const importButton = document.getElementById('import-params-button');
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;

    applyButton?.addEventListener('click', () => this.applyChanges());
    resetButton?.addEventListener('click', () => this.resetToDefault());
    exportButton?.addEventListener('click', () => this.exportConfig());
    importButton?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => this.importConfig(e));
  }

  /**
   * 変更を適用
   */
  private applyChanges(): void {
    // フォームから値を読み取り
    this.config.duration = this.getNumberValue('param-duration');
    this.config.timeStep = this.getNumberValue('param-timestep');
    this.config.warmupPeriod = this.getNumberValue('param-warmup');

    this.config.signalControl.greenDuration.northSouth = this.getNumberValue('param-green-ns');
    this.config.signalControl.greenDuration.eastWest = this.getNumberValue('param-green-ew');
    this.config.signalControl.yellowDuration = this.getNumberValue('param-yellow');
    this.config.signalControl.allRedDuration = this.getNumberValue('param-allred');

    // サイクル長を再計算
    this.config.signalControl.cycleLength =
      this.config.signalControl.greenDuration.northSouth +
      this.config.signalControl.yellowDuration +
      this.config.signalControl.allRedDuration +
      this.config.signalControl.greenDuration.eastWest +
      this.config.signalControl.yellowDuration +
      this.config.signalControl.allRedDuration;

    this.config.vehicleGeneration.spawnRates.north = this.getNumberValue('param-spawn-north');
    this.config.vehicleGeneration.spawnRates.south = this.getNumberValue('param-spawn-south');
    this.config.vehicleGeneration.spawnRates.east = this.getNumberValue('param-spawn-east');
    this.config.vehicleGeneration.spawnRates.west = this.getNumberValue('param-spawn-west');

    this.config.vehicleGeneration.turnProbabilities.straight = this.getNumberValue('param-prob-straight');
    this.config.vehicleGeneration.turnProbabilities.left = this.getNumberValue('param-prob-left');
    this.config.vehicleGeneration.turnProbabilities.right = this.getNumberValue('param-prob-right');

    alert('パラメータが適用されました。シミュレーションをリセットして再実行してください。');
  }

  /**
   * デフォルト値に戻す
   */
  private resetToDefault(): void {
    if (confirm('パラメータをデフォルト値に戻しますか？')) {
      // デフォルト設定を読み込んで再描画
      this.render();
    }
  }

  /**
   * 設定をエクスポート
   */
  private exportConfig(): void {
    const json = exportConfig(this.config);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation-config.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * 設定をインポート
   */
  private importConfig(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        this.config = importConfig(json);
        this.render();
        alert('設定がインポートされました');
      } catch (error) {
        alert(`設定の読み込みに失敗しました: ${error}`);
      }
    };

    reader.readAsText(file);
  }

  /**
   * 入力値を数値として取得
   */
  private getNumberValue(id: string): number {
    const input = document.getElementById(id) as HTMLInputElement;
    return parseFloat(input.value);
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): SimulationConfig {
    return this.config;
  }

  /**
   * 設定を更新
   */
  setConfig(config: SimulationConfig): void {
    this.config = config;
    this.render();
  }
}
