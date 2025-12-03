/**
 * Default Configuration and Settings
 * デフォルト設定とパラメータ管理
 */

import type { SimulationConfig } from './types';

/**
 * デフォルトシミュレーション設定
 */
export const DEFAULT_CONFIG: SimulationConfig = {
  // シミュレーション基本設定
  duration: 1800, // 30分
  timeStep: 1.0, // 1秒
  warmupPeriod: 120, // 2分
  randomSeed: 42,

  // 交差点設定
  intersection: {
    type: 'fourWay',
    width: 20, // 交差点中心部の幅（m）
    approachLength: 200, // 進入路の長さ（m）
    laneWidth: 3.5, // 車線幅（m）
    numLanes: {
      north: 2,
      south: 2,
      east: 2,
      west: 2,
    },
  },

  // 信号制御設定
  signalControl: {
    cycleLength: 70, // サイクル長（秒）
    greenDuration: {
      northSouth: 30, // 南北方向の青時間（秒）
      eastWest: 30, // 東西方向の青時間（秒）
    },
    yellowDuration: 3, // 黄時間（秒）
    allRedDuration: 2, // 全赤時間（秒）
  },

  // 車両生成設定
  vehicleGeneration: {
    spawnRates: {
      north: 15, // 台/分
      south: 15,
      east: 15,
      west: 15,
    },
    turnProbabilities: {
      straight: 0.6,
      left: 0.2,
      right: 0.2,
    },
  },

  // 車両デフォルトパラメータ
  vehicleDefaults: {
    maxSpeed: 11.1, // m/s (40 km/h)
    maxAcceleration: 2.0, // m/s²
    comfortableDeceleration: 3.0, // m/s²
    minGap: 2.0, // m
    reactionTime: 1.5, // s
    length: 4.5, // m
  },
};

/**
 * 設定の検証
 * @param config - 検証するシミュレーション設定
 * @throws エラーメッセージの配列
 */
export function validateConfig(config: SimulationConfig): string[] {
  const errors: string[] = [];

  // シミュレーション基本設定の検証
  if (config.duration <= 0) {
    errors.push('Duration must be positive');
  }
  if (config.timeStep <= 0 || config.timeStep > 1) {
    errors.push('Time step must be between 0 and 1');
  }
  if (config.warmupPeriod < 0) {
    errors.push('Warmup period must be non-negative');
  }
  if (config.warmupPeriod >= config.duration) {
    errors.push('Warmup period must be less than duration');
  }

  // 交差点設定の検証
  if (config.intersection.width <= 0) {
    errors.push('Intersection width must be positive');
  }
  if (config.intersection.approachLength <= 0) {
    errors.push('Approach length must be positive');
  }
  if (config.intersection.laneWidth <= 0) {
    errors.push('Lane width must be positive');
  }

  // 車線数の検証
  const directions = ['north', 'south', 'east', 'west'] as const;
  for (const dir of directions) {
    const numLanes = config.intersection.numLanes[dir];
    if (numLanes < 0 || numLanes > 3) {
      errors.push(`Number of lanes for ${dir} must be between 0 and 3`);
    }
  }

  // T字路の場合、1つの方向は車線数0でなければならない
  if (config.intersection.type === 'threeWay') {
    const zeroLaneCount = directions.filter(
      (dir) => config.intersection.numLanes[dir] === 0
    ).length;
    if (zeroLaneCount !== 1) {
      errors.push('Three-way intersection must have exactly one direction with 0 lanes');
    }
  }

  // 信号制御設定の検証
  if (config.signalControl.greenDuration.northSouth <= 0) {
    errors.push('North-South green duration must be positive');
  }
  if (config.signalControl.greenDuration.eastWest <= 0) {
    errors.push('East-West green duration must be positive');
  }
  if (config.signalControl.yellowDuration <= 0) {
    errors.push('Yellow duration must be positive');
  }
  if (config.signalControl.allRedDuration < 0) {
    errors.push('All-red duration must be non-negative');
  }

  // サイクル長の整合性チェック
  const calculatedCycleLength =
    config.signalControl.greenDuration.northSouth +
    config.signalControl.yellowDuration +
    config.signalControl.allRedDuration +
    config.signalControl.greenDuration.eastWest +
    config.signalControl.yellowDuration +
    config.signalControl.allRedDuration;

  if (Math.abs(config.signalControl.cycleLength - calculatedCycleLength) > 0.1) {
    errors.push(
      `Cycle length (${config.signalControl.cycleLength}) does not match ` +
        `calculated value (${calculatedCycleLength})`
    );
  }

  // 車両生成設定の検証
  for (const dir of directions) {
    const rate = config.vehicleGeneration.spawnRates[dir];
    if (rate < 0 || rate > 60) {
      errors.push(`Spawn rate for ${dir} must be between 0 and 60 vehicles/min`);
    }
  }

  // 進行確率の合計チェック
  const probSum =
    config.vehicleGeneration.turnProbabilities.straight +
    config.vehicleGeneration.turnProbabilities.left +
    config.vehicleGeneration.turnProbabilities.right;

  if (Math.abs(probSum - 1.0) > 0.001) {
    errors.push(`Turn probabilities must sum to 1.0 (current sum: ${probSum})`);
  }

  // 車両パラメータの検証
  if (config.vehicleDefaults.maxSpeed <= 0) {
    errors.push('Max speed must be positive');
  }
  if (config.vehicleDefaults.maxAcceleration <= 0) {
    errors.push('Max acceleration must be positive');
  }
  if (config.vehicleDefaults.comfortableDeceleration <= 0) {
    errors.push('Comfortable deceleration must be positive');
  }
  if (config.vehicleDefaults.minGap < 0) {
    errors.push('Min gap must be non-negative');
  }
  if (config.vehicleDefaults.reactionTime <= 0) {
    errors.push('Reaction time must be positive');
  }
  if (config.vehicleDefaults.length <= 0) {
    errors.push('Vehicle length must be positive');
  }

  return errors;
}

/**
 * 設定をマージ（部分的な設定でデフォルト値を上書き）
 * @param partial - 部分的な設定
 * @returns マージされた完全な設定
 */
export function mergeConfig(partial: Partial<SimulationConfig>): SimulationConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    intersection: {
      ...DEFAULT_CONFIG.intersection,
      ...partial.intersection,
      numLanes: {
        ...DEFAULT_CONFIG.intersection.numLanes,
        ...partial.intersection?.numLanes,
      },
    },
    signalControl: {
      ...DEFAULT_CONFIG.signalControl,
      ...partial.signalControl,
      greenDuration: {
        ...DEFAULT_CONFIG.signalControl.greenDuration,
        ...partial.signalControl?.greenDuration,
      },
    },
    vehicleGeneration: {
      ...DEFAULT_CONFIG.vehicleGeneration,
      ...partial.vehicleGeneration,
      spawnRates: {
        ...DEFAULT_CONFIG.vehicleGeneration.spawnRates,
        ...partial.vehicleGeneration?.spawnRates,
      },
      turnProbabilities: {
        ...DEFAULT_CONFIG.vehicleGeneration.turnProbabilities,
        ...partial.vehicleGeneration?.turnProbabilities,
      },
    },
    vehicleDefaults: {
      ...DEFAULT_CONFIG.vehicleDefaults,
      ...partial.vehicleDefaults,
    },
  };
}

/**
 * 設定をJSON文字列にエクスポート
 * @param config - シミュレーション設定
 * @returns JSON文字列
 */
export function exportConfig(config: SimulationConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * JSON文字列から設定をインポート
 * @param json - JSON文字列
 * @returns シミュレーション設定
 * @throws パースエラー
 */
export function importConfig(json: string): SimulationConfig {
  try {
    const config = JSON.parse(json) as SimulationConfig;
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    throw error;
  }
}
