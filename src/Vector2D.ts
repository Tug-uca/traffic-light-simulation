/**
 * 2D Vector Utility Class
 * 2次元ベクトル演算ユーティリティ
 */

export class Vector2D {
  constructor(
    public x: number,
    public y: number
  ) {}

  /**
   * ベクトルの加算
   */
  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  /**
   * ベクトルの減算
   */
  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  /**
   * スカラー倍
   */
  scale(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * ベクトルの大きさ（長さ）
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 正規化（単位ベクトル化）
   */
  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) {
      return new Vector2D(0, 0);
    }
    return new Vector2D(this.x / mag, this.y / mag);
  }

  /**
   * 他のベクトルとの距離
   */
  distance(other: Vector2D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 内積
   */
  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * ベクトルのコピー
   */
  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  /**
   * 等価判定
   */
  equals(other: Vector2D, epsilon: number = 0.001): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon
    );
  }

  /**
   * ゼロベクトルかどうか
   */
  isZero(epsilon: number = 0.001): boolean {
    return Math.abs(this.x) < epsilon && Math.abs(this.y) < epsilon;
  }

  /**
   * 静的メソッド: ゼロベクトル
   */
  static zero(): Vector2D {
    return new Vector2D(0, 0);
  }

  /**
   * 静的メソッド: 単位ベクトル（X方向）
   */
  static unitX(): Vector2D {
    return new Vector2D(1, 0);
  }

  /**
   * 静的メソッド: 単位ベクトル（Y方向）
   */
  static unitY(): Vector2D {
    return new Vector2D(0, 1);
  }

  /**
   * 静的メソッド: 2点間の距離
   */
  static distance(a: Vector2D, b: Vector2D): number {
    return a.distance(b);
  }

  /**
   * 静的メソッド: 線形補間
   */
  static lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return new Vector2D(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }
}
