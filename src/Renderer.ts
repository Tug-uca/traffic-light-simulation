/**
 * Main Renderer
 * メインレンダラー
 *
 * Canvas描画の統括管理
 */

import { Simulation } from './Simulation';
import { IntersectionRenderer } from './IntersectionRenderer';
import { VehicleRenderer } from './VehicleRenderer';
import { TrafficLightRenderer } from './TrafficLightRenderer';

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  // サブレンダラー
  private readonly intersectionRenderer: IntersectionRenderer;
  private readonly vehicleRenderer: VehicleRenderer;
  private readonly trafficLightRenderer: TrafficLightRenderer;

  // カメラパラメータ
  private scale: number = 1.5; // ピクセル/メートル
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    // サブレンダラーの初期化
    this.intersectionRenderer = new IntersectionRenderer(ctx);
    this.vehicleRenderer = new VehicleRenderer(ctx);
    this.trafficLightRenderer = new TrafficLightRenderer(ctx);

    // Canvasサイズの設定
    this.resizeCanvas();
  }

  /**
   * Canvasサイズを調整
   */
  resizeCanvas(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  /**
   * メイン描画関数
   * @param simulation - シミュレーションインスタンス
   */
  render(simulation: Simulation): void {
    // キャンバスをクリア
    this.clear();

    // 座標変換を適用
    this.ctx.save();
    this.applyTransform();

    // 1. 交差点を描画
    this.intersectionRenderer.render(simulation.getIntersection());

    // 2. 車両を描画
    const vehicles = simulation.getAllVehicles();
    for (const vehicle of vehicles) {
      this.vehicleRenderer.render(vehicle);
    }

    // 3. 信号機を描画
    const trafficLights = simulation.getAllTrafficLights();
    for (const light of trafficLights) {
      this.trafficLightRenderer.render(light);
    }

    // 座標変換を元に戻す
    this.ctx.restore();
  }

  /**
   * キャンバスをクリア
   */
  clear(): void {
    this.ctx.fillStyle = '#f5f5f5'; // 背景色
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 座標変換を適用
   */
  private applyTransform(): void {
    // キャンバス中心に原点を移動
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

    // スケールを適用
    this.ctx.scale(this.scale, this.scale);

    // オフセットを適用
    this.ctx.translate(this.offsetX, this.offsetY);

    // Y軸を反転（数学的な座標系にする）
    this.ctx.scale(1, -1);
  }

  /**
   * スケールを設定
   * @param scale - ピクセル/メートル
   */
  setScale(scale: number): void {
    this.scale = Math.max(0.5, Math.min(5, scale));
  }

  /**
   * スケールを取得
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * オフセットを設定
   * @param x - X方向のオフセット（メートル）
   * @param y - Y方向のオフセット（メートル）
   */
  setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  /**
   * ズームイン
   */
  zoomIn(): void {
    this.setScale(this.scale * 1.2);
  }

  /**
   * ズームアウト
   */
  zoomOut(): void {
    this.setScale(this.scale / 1.2);
  }

  /**
   * ビューをリセット
   */
  resetView(): void {
    this.scale = 1.5;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /**
   * スクリーン座標をワールド座標に変換
   * @param screenX - スクリーンX座標
   * @param screenY - スクリーンY座標
   * @returns ワールド座標
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const worldX = (screenX - centerX) / this.scale - this.offsetX;
    const worldY = -((screenY - centerY) / this.scale - this.offsetY);

    return { x: worldX, y: worldY };
  }

  /**
   * ワールド座標をスクリーン座標に変換
   * @param worldX - ワールドX座標
   * @param worldY - ワールドY座標
   * @returns スクリーン座標
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const screenX = (worldX + this.offsetX) * this.scale + centerX;
    const screenY = -(worldY + this.offsetY) * this.scale + centerY;

    return { x: screenX, y: screenY };
  }

  /**
   * Canvasを取得
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * コンテキストを取得
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
