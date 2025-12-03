/**
 * Traffic Light Simulation - Main Entry Point
 * 交差点信号機シミュレーション - メインエントリーポイント
 */

console.log('交差点信号機シミュレーション起動中...');

// Canvas要素の取得
const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 初期描画テスト
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('交差点信号機シミュレーション', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('プロジェクトセットアップ完了', canvas.width / 2, canvas.height / 2 + 20);

    console.log('✅ Canvas初期化完了');
  } else {
    console.error('❌ Canvas 2Dコンテキストの取得に失敗しました');
  }
} else {
  console.error('❌ Canvas要素が見つかりません');
}

// ボタンのイベントリスナー設定
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

if (startBtn) {
  startBtn.addEventListener('click', () => {
    console.log('開始ボタンがクリックされました');
  });
}

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    console.log('停止ボタンがクリックされました');
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    console.log('リセットボタンがクリックされました');
  });
}

console.log('✅ プロジェクトセットアップ完了 - フェーズ1完了');
