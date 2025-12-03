/**
 * Seeded Random Number Generator
 * シード固定乱数生成器（再現性確保のため）
 */

import seedrandom from 'seedrandom';

export class Random {
  private rng: seedrandom.PRNG;

  /**
   * コンストラクタ
   * @param seed - 乱数シード
   */
  constructor(seed: number) {
    this.rng = seedrandom(seed.toString());
    console.log(`🎲 Random generator initialized with seed: ${seed}`);
  }

  /**
   * 0から1の一様乱数を生成
   * @returns 0以上1未満の乱数
   */
  random(): number {
    return this.rng();
  }

  /**
   * 指定範囲の一様乱数を生成
   * @param min - 最小値
   * @param max - 最大値
   * @returns minからmaxの間の乱数
   */
  randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /**
   * 指定範囲の整数乱数を生成
   * @param min - 最小値（含む）
   * @param max - 最大値（含まない）
   * @returns minからmax-1の間の整数
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max));
  }

  /**
   * 確率に基づいてtrueまたはfalseを返す
   * @param probability - 確率（0-1）
   * @returns 指定確率でtrue
   */
  randomBool(probability: number = 0.5): boolean {
    return this.random() < probability;
  }

  /**
   * 配列からランダムに要素を選択
   * @param array - 配列
   * @returns ランダムに選択された要素
   */
  randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.randomInt(0, array.length)];
  }

  /**
   * 重み付き選択
   * @param choices - 選択肢の配列
   * @param weights - 各選択肢の重み
   * @returns 重みに基づいてランダムに選択された要素
   */
  randomWeightedChoice<T>(choices: T[], weights: number[]): T {
    if (choices.length !== weights.length) {
      throw new Error('Choices and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.random() * totalWeight;

    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }

    // フォールバック（浮動小数点誤差対策）
    return choices[choices.length - 1];
  }

  /**
   * 正規分布に従う乱数を生成（Box-Muller変換）
   * @param mean - 平均
   * @param stdDev - 標準偏差
   * @returns 正規分布に従う乱数
   */
  randomNormal(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller変換
    const u1 = this.random();
    const u2 = this.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * 指数分布に従う乱数を生成
   * @param lambda - パラメータλ（平均 = 1/λ）
   * @returns 指数分布に従う乱数
   */
  randomExponential(lambda: number): number {
    return -Math.log(1 - this.random()) / lambda;
  }

  /**
   * ポアソン分布に従う乱数を生成
   * @param lambda - パラメータλ（平均・分散）
   * @returns ポアソン分布に従う整数
   */
  randomPoisson(lambda: number): number {
    if (lambda < 30) {
      // 小さいλの場合：直接法
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;

      do {
        k++;
        p *= this.random();
      } while (p > L);

      return k - 1;
    } else {
      // 大きいλの場合：正規分布近似
      return Math.max(0, Math.round(this.randomNormal(lambda, Math.sqrt(lambda))));
    }
  }
}
