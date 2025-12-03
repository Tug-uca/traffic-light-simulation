/**
 * Intersection Class
 * 交差点クラス
 *
 * 交差点全体の構造と境界を管理
 */

import { Road } from './Road';
import type { Direction, IntersectionType, IntersectionConfig } from './types';

export class Intersection {
  // 交差点の基本情報
  public readonly type: IntersectionType;
  public readonly width: number;
  public readonly approachLength: number;
  public readonly laneWidth: number;

  // 道路の集合
  private roads: Map<Direction, Road>;

  // 交差点境界
  private readonly bounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };

  constructor(config: IntersectionConfig) {
    this.type = config.type;
    this.width = config.width;
    this.approachLength = config.approachLength;
    this.laneWidth = config.laneWidth;

    // 道路の初期化
    this.roads = new Map();
    this.initializeRoads(config);

    // 交差点境界の設定
    this.bounds = {
      xMin: -this.width / 2,
      xMax: this.width / 2,
      yMin: -this.width / 2,
      yMax: this.width / 2,
    };

    console.log(`✅ Intersection initialized: ${this.type}, ${this.getActiveDirections().length} directions`);
  }

  /**
   * 道路を初期化
   */
  private initializeRoads(config: IntersectionConfig): void {
    const directions: Direction[] = ['north', 'south', 'east', 'west'];

    for (const direction of directions) {
      const numLanes = config.numLanes[direction];

      // 車線数が0より大きい場合のみ道路を作成
      if (numLanes > 0) {
        const road = new Road({
          direction,
          numLanes,
          length: this.approachLength,
          laneWidth: this.laneWidth,
        });
        this.roads.set(direction, road);
      }
    }

    // T字路の検証
    if (this.type === 'threeWay' && this.roads.size !== 3) {
      console.warn(`⚠️ Three-way intersection should have exactly 3 roads, but has ${this.roads.size}`);
    }
  }

  /**
   * 指定方向の道路を取得
   */
  getRoad(direction: Direction): Road | undefined {
    return this.roads.get(direction);
  }

  /**
   * 全ての道路を取得
   */
  getAllRoads(): Road[] {
    return Array.from(this.roads.values());
  }

  /**
   * 有効な方向（道路が存在する方向）のリストを取得
   */
  getActiveDirections(): Direction[] {
    return Array.from(this.roads.keys());
  }

  /**
   * 指定方向が有効かチェック
   */
  isDirectionActive(direction: Direction): boolean {
    return this.roads.has(direction);
  }

  /**
   * 交差点の幅を取得
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * 進入路の長さを取得
   */
  getApproachLength(): number {
    return this.approachLength;
  }

  /**
   * 交差点境界を取得
   */
  getBounds() {
    return { ...this.bounds };
  }

  /**
   * 指定位置が交差点内にあるかチェック
   */
  isInIntersection(x: number, y: number): boolean {
    return (
      x >= this.bounds.xMin &&
      x <= this.bounds.xMax &&
      y >= this.bounds.yMin &&
      y <= this.bounds.yMax
    );
  }

  /**
   * 指定方向の進入路の開始位置を取得
   */
  getEntryPosition(direction: Direction, laneIndex: number = 0): { x: number; y: number } {
    const road = this.roads.get(direction);
    if (!road) {
      throw new Error(`No road found for direction: ${direction}`);
    }

    const position = road.getEntryPosition(laneIndex);
    return { x: position.x, y: position.y };
  }

  /**
   * 指定方向の停止線位置を取得
   */
  getStopLinePosition(direction: Direction, laneIndex: number = 0): { x: number; y: number } {
    const road = this.roads.get(direction);
    if (!road) {
      throw new Error(`No road found for direction: ${direction}`);
    }

    const position = road.getStopLinePosition(laneIndex, this.width);
    return { x: position.x, y: position.y };
  }

  /**
   * 指定方向の信号機位置を取得
   */
  getTrafficLightPosition(direction: Direction): { x: number; y: number } {
    // 信号機は停止線の近くに配置
    const stopLine = this.getStopLinePosition(direction, 0);

    // 方向に応じて位置を調整
    switch (direction) {
      case 'north':
        return { x: stopLine.x + 5, y: stopLine.y };
      case 'south':
        return { x: stopLine.x - 5, y: stopLine.y };
      case 'east':
        return { x: stopLine.x, y: stopLine.y + 5 };
      case 'west':
        return { x: stopLine.x, y: stopLine.y - 5 };
    }
  }

  /**
   * シミュレーション領域の境界距離を取得
   */
  getBoundaryDistance(): number {
    return this.approachLength + this.width / 2;
  }

  /**
   * 交差点の総面積を計算
   */
  getArea(): number {
    return this.width * this.width;
  }

  /**
   * 交差点の総車線数を計算
   */
  getTotalLanes(): number {
    return this.getAllRoads().reduce((sum, road) => sum + road.numLanes, 0);
  }

  /**
   * 対向方向を取得
   */
  getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case 'north':
        return 'south';
      case 'south':
        return 'north';
      case 'east':
        return 'west';
      case 'west':
        return 'east';
    }
  }

  /**
   * 垂直方向を取得（信号制御グループ用）
   */
  getPerpendicularDirections(direction: Direction): Direction[] {
    switch (direction) {
      case 'north':
      case 'south':
        return ['east', 'west'].filter((d) => this.isDirectionActive(d as Direction)) as Direction[];
      case 'east':
      case 'west':
        return ['north', 'south'].filter((d) => this.isDirectionActive(d as Direction)) as Direction[];
    }
  }

  /**
   * デバッグ用文字列表現
   */
  toString(): string {
    const directions = this.getActiveDirections().join(', ');
    return `Intersection(${this.type}, ${this.width}m × ${this.width}m, directions: ${directions})`;
  }

  /**
   * 交差点情報のスナップショット取得
   */
  getSnapshot() {
    return {
      type: this.type,
      width: this.width,
      approachLength: this.approachLength,
      laneWidth: this.laneWidth,
      activeDirections: this.getActiveDirections(),
      totalLanes: this.getTotalLanes(),
      area: this.getArea(),
      bounds: this.getBounds(),
    };
  }
}
