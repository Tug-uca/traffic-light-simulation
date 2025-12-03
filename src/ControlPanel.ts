/**
 * Control Panel
 * コントロールパネル
 *
 * シミュレーションの制御UI
 */

import { Simulation } from './Simulation';

export class ControlPanel {
  private readonly simulation: Simulation;

  // ボタン要素
  private readonly startButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly stepButton: HTMLButtonElement;

  // コールバック
  private onSimulationComplete?: () => void;

  constructor(simulation: Simulation) {
    this.simulation = simulation;

    // ボタン要素を取得
    this.startButton = this.getButton('start-button');
    this.pauseButton = this.getButton('pause-button');
    this.resetButton = this.getButton('reset-button');
    this.stepButton = this.getButton('step-button');

    // イベントリスナーを設定
    this.setupEventListeners();

    // 初期状態を反映
    this.updateButtonStates();
  }

  /**
   * ボタン要素を取得
   */
  private getButton(id: string): HTMLButtonElement {
    const button = document.getElementById(id);
    if (!button || !(button instanceof HTMLButtonElement)) {
      throw new Error(`Button element with id "${id}" not found`);
    }
    return button;
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    this.startButton.addEventListener('click', () => this.handleStart());
    this.pauseButton.addEventListener('click', () => this.handlePause());
    this.resetButton.addEventListener('click', () => this.handleReset());
    this.stepButton.addEventListener('click', () => this.handleStep());
  }

  /**
   * 開始ボタンのハンドラ
   */
  private handleStart(): void {
    const state = this.simulation.getState();

    if (state === 'ready' || state === 'paused') {
      this.simulation.start();
      this.updateButtonStates();
    }
  }

  /**
   * 一時停止ボタンのハンドラ
   */
  private handlePause(): void {
    const state = this.simulation.getState();

    if (state === 'running') {
      this.simulation.pause();
      this.updateButtonStates();
    }
  }

  /**
   * リセットボタンのハンドラ
   */
  private handleReset(): void {
    this.simulation.reset();
    this.updateButtonStates();
  }

  /**
   * ステップ実行ボタンのハンドラ
   */
  private handleStep(): void {
    const state = this.simulation.getState();

    if (state === 'ready' || state === 'paused') {
      this.simulation.step();
      this.updateButtonStates();

      // 完了チェック
      if (this.simulation.getState() === 'completed') {
        this.onSimulationComplete?.();
      }
    }
  }

  /**
   * ボタンの状態を更新
   */
  updateButtonStates(): void {
    const state = this.simulation.getState();

    switch (state) {
      case 'ready':
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.resetButton.disabled = false;
        this.stepButton.disabled = false;
        this.startButton.textContent = '開始';
        break;

      case 'running':
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.resetButton.disabled = false;
        this.stepButton.disabled = true;
        break;

      case 'paused':
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.resetButton.disabled = false;
        this.stepButton.disabled = false;
        this.startButton.textContent = '再開';
        break;

      case 'completed':
        this.startButton.disabled = true;
        this.pauseButton.disabled = true;
        this.resetButton.disabled = false;
        this.stepButton.disabled = true;
        break;
    }
  }

  /**
   * 完了時のコールバックを設定
   * @param callback - コールバック関数
   */
  setOnComplete(callback: () => void): void {
    this.onSimulationComplete = callback;
  }

  /**
   * 進捗バーを更新
   * @param progress - 進捗率（0-1）
   */
  updateProgress(progress: number): void {
    const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;
    if (progressBar) {
      progressBar.value = progress;
    }

    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `${(progress * 100).toFixed(1)}%`;
    }
  }

  /**
   * ステータスメッセージを表示
   * @param message - メッセージ
   */
  displayStatus(message: string): void {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
}
