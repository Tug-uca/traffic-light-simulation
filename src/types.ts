/**
 * Type Definitions for Traffic Light Simulation
 * 交差点信号機シミュレーション - 型定義
 */

// ============================================================================
// Enums and Union Types
// ============================================================================

/**
 * 方向（進入方向）
 */
export type Direction = "north" | "south" | "east" | "west";

/**
 * 進行意図（曲がる方向）
 */
export type TurnIntent = "straight" | "left" | "right";

/**
 * 信号機のフェーズ
 */
export type SignalPhase = "green" | "yellow" | "red";

/**
 * 車両の状態
 */
export type VehicleStatus = "approaching" | "waiting" | "crossing" | "exited";

/**
 * 交差点タイプ
 */
export type IntersectionType = "fourWay" | "threeWay";

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * 車両設定
 */
export interface VehicleConfig {
  id: string;
  direction: Direction;
  turnIntent: TurnIntent;
  position: { x: number; y: number };
  lane?: number;
  maxSpeed?: number;
  maxAcceleration?: number;
  comfortableDeceleration?: number;
  minGap?: number;
  reactionTime?: number;
  length?: number;
}

/**
 * 信号機設定
 */
export interface TrafficLightConfig {
  id: string;
  direction: Direction;
  position: { x: number; y: number };
  greenDuration: number;
  yellowDuration: number;
  allRedDuration: number;
  initialPhase?: SignalPhase;
}

/**
 * 道路設定
 */
export interface RoadConfig {
  direction: Direction;
  numLanes: number;
  length: number;
  laneWidth: number;
}

/**
 * 交差点設定
 */
export interface IntersectionConfig {
  type: IntersectionType;
  width: number;
  approachLength: number;
  laneWidth: number;
  numLanes: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * 信号制御設定
 */
export interface SignalControlConfig {
  cycleLength: number;
  greenDuration: {
    northSouth: number;
    eastWest: number;
  };
  yellowDuration: number;
  allRedDuration: number;
}

/**
 * 車両生成設定
 */
export interface VehicleGenerationConfig {
  spawnRates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  turnProbabilities: {
    straight: number;
    left: number;
    right: number;
  };
}

/**
 * シミュレーション設定
 */
export interface SimulationConfig {
  duration: number;
  timeStep: number;
  warmupPeriod: number;
  randomSeed: number;
  intersection: IntersectionConfig;
  signalControl: SignalControlConfig;
  vehicleGeneration: VehicleGenerationConfig;
  vehicleDefaults: {
    maxSpeed: number;
    maxAcceleration: number;
    comfortableDeceleration: number;
    minGap: number;
    reactionTime: number;
    length: number;
  };
}

// ============================================================================
// Data Structures
// ============================================================================

/**
 * フェーズスケジュール
 */
export interface PhaseSchedule {
  start: number;
  end: number;
  northSouth: SignalPhase;
  eastWest: SignalPhase;
}

/**
 * 車両データ（統計記録用）
 */
export interface VehicleData {
  id: string;
  entryTime: number;
  exitTime: number;
  totalTravelTime: number;
  waitTime: number;
  direction: Direction;
  turnIntent: TurnIntent;
  maxSpeedAchieved: number;
}

/**
 * タイムステップデータ
 */
export interface TimestepData {
  time: number;
  activeVehicles: number;
  queueLengths: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  signalStates: {
    north: SignalPhase;
    south: SignalPhase;
    east: SignalPhase;
    west: SignalPhase;
  };
  throughput: number;
}

/**
 * 統計データ
 */
export interface Statistics {
  totalVehicles: number;
  completedVehicles: number;
  waitTime: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentile90: number;
  };
  travelTime: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  queueLength: {
    mean: number;
    max: number;
    byDirection: {
      north: { mean: number; max: number };
      south: { mean: number; max: number };
      east: { mean: number; max: number };
      west: { mean: number; max: number };
    };
  };
  throughput: {
    total: number;
    perMinute: number;
    perCycle: number;
  };
}

/**
 * シミュレーション結果
 */
export interface SimulationResults {
  metadata: {
    seed: number;
    duration: number;
    timeStep: number;
    intersectionType: IntersectionType;
    completedAt: string;
  };
  parameters: SimulationConfig;
  statistics: Statistics;
  timeseries: TimestepData[];
  vehicles: VehicleData[];
}
