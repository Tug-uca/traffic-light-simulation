/**
 * Traffic Light Simulation - Main Entry Point
 * 交差点信号機シミュレーション - メインエントリーポイント
 */

import { Simulation } from './Simulation';
import { Renderer } from './Renderer';
import { ControlPanel } from './ControlPanel';
import { ParameterEditor } from './ParameterEditor';
import { ResultsPanel } from './ResultsPanel';
import { InfoDisplay } from './InfoDisplay';
import { ChartManager } from './ChartManager';
import { DEFAULT_CONFIG } from './config';

console.log('交差点信号機シミュレーション起動中...');

// グローバル状態
let simulation: Simulation;
let renderer: Renderer;
let controlPanel: ControlPanel;
let resultsPanel: ResultsPanel;
let infoDisplay: InfoDisplay;
let chartManager: ChartManager;

/**
 * アプリケーションの初期化
 */
function initializeApp(): void {
  try {
    // Canvas要素の取得
    const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // シミュレーションの初期化
    simulation = new Simulation(DEFAULT_CONFIG);
    console.log('✅ Simulation initialized');

    // レンダラーの初期化
    renderer = new Renderer(canvas);
    console.log('✅ Renderer initialized');

    // UIコンポーネントの初期化
    controlPanel = new ControlPanel(simulation);
    controlPanel.setOnComplete(handleSimulationComplete);
    console.log('✅ Control panel initialized');

    // Initialize parameter editor (accessible via DOM)
    new ParameterEditor('parameter-editor', DEFAULT_CONFIG);
    console.log('✅ Parameter editor initialized');

    resultsPanel = new ResultsPanel('results-panel');
    console.log('✅ Results panel initialized');

    infoDisplay = new InfoDisplay('info-display');
    console.log('✅ Info display initialized');

    chartManager = new ChartManager();
    console.log('✅ Chart manager initialized');

    // アニメーションループの開始
    startAnimationLoop();
    console.log('✅ Animation loop started');

    // ウィンドウリサイズイベント
    window.addEventListener('resize', () => {
      renderer.resizeCanvas();
    });

    console.log('✅ アプリケーション初期化完了');
  } catch (error) {
    console.error('❌ アプリケーション初期化エラー:', error);
    alert(`初期化エラー: ${error}`);
  }
}

/**
 * アニメーションループ
 */
function startAnimationLoop(): void {
  function animate() {
    // シミュレーションの状態に応じて処理
    if (simulation.getState() === 'running') {
      simulation.step();
      controlPanel.updateButtonStates();
      controlPanel.updateProgress(simulation.getProgress());
    }

    // 描画
    renderer.render(simulation);

    // 情報表示の更新
    infoDisplay.update(simulation);

    // 次のフレームをリクエスト
    requestAnimationFrame(animate);
  }

  animate();
}

/**
 * シミュレーション完了時のハンドラ
 */
function handleSimulationComplete(): void {
  console.log('✅ シミュレーション完了');

  // 結果を取得
  const results = simulation.getResults();

  // 統計を表示
  infoDisplay.displayStatistics(results.statistics);

  // 結果パネルを更新
  resultsPanel.displayResults(results);

  // グラフを作成
  chartManager.createAllCharts(results);

  // ボタンの状態を更新
  controlPanel.updateButtonStates();

  alert('シミュレーションが完了しました！結果を確認してください。');
}

/**
 * エラーハンドリング
 */
window.addEventListener('error', (event) => {
  console.error('グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未処理のPromise拒否:', event.reason);
});

// DOMContentLoadedイベントでアプリケーションを初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
