/**
 * Data Exporter
 * データエクスポートシステム
 *
 * シミュレーション結果とデータのJSON出力
 */

import type { SimulationResults, SimulationConfig } from './types';

export class DataExporter {
  /**
   * シミュレーション結果をJSON文字列にエクスポート
   * @param results - シミュレーション結果
   * @returns JSON文字列
   */
  static exportResults(results: SimulationResults): string {
    return JSON.stringify(results, null, 2);
  }

  /**
   * 設定をJSON文字列にエクスポート
   * @param config - シミュレーション設定
   * @returns JSON文字列
   */
  static exportConfig(config: SimulationConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * JSONファイルとしてダウンロード
   * @param data - エクスポートするデータ
   * @param filename - ファイル名
   */
  static downloadJSON(data: object, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // クリーンアップ
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * シミュレーション結果をダウンロード
   * @param results - シミュレーション結果
   * @param filename - ファイル名（省略時は自動生成）
   */
  static downloadResults(
    results: SimulationResults,
    filename?: string
  ): void {
    const defaultFilename = this.generateResultsFilename(results);
    this.downloadJSON(results, filename ?? defaultFilename);
  }

  /**
   * 設定をダウンロード
   * @param config - シミュレーション設定
   * @param filename - ファイル名（省略時は自動生成）
   */
  static downloadConfig(
    config: SimulationConfig,
    filename?: string
  ): void {
    const defaultFilename = 'simulation-config.json';
    this.downloadJSON(config, filename ?? defaultFilename);
  }

  /**
   * 結果ファイル名を自動生成
   * @param results - シミュレーション結果
   * @returns ファイル名
   */
  private static generateResultsFilename(results: SimulationResults): string {
    const timestamp = new Date(results.timestamp).toISOString().replace(/[:.]/g, '-');
    return `simulation-results-${timestamp}.json`;
  }

  /**
   * JSON文字列から結果をインポート
   * @param json - JSON文字列
   * @returns シミュレーション結果
   * @throws パースエラー
   */
  static importResults(json: string): SimulationResults {
    try {
      const results = JSON.parse(json) as SimulationResults;
      this.validateResults(results);
      return results;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * JSON文字列から設定をインポート
   * @param json - JSON文字列
   * @returns シミュレーション設定
   * @throws パースエラー
   */
  static importConfig(json: string): SimulationConfig {
    try {
      const config = JSON.parse(json) as SimulationConfig;
      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * ファイルから結果を読み込み
   * @param file - ファイルオブジェクト
   * @returns Promise<SimulationResults>
   */
  static async loadResultsFromFile(file: File): Promise<SimulationResults> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const results = this.importResults(json);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * ファイルから設定を読み込み
   * @param file - ファイルオブジェクト
   * @returns Promise<SimulationConfig>
   */
  static async loadConfigFromFile(file: File): Promise<SimulationConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const config = this.importConfig(json);
          resolve(config);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * 結果オブジェクトの検証
   * @param results - シミュレーション結果
   * @throws 検証エラー
   */
  private static validateResults(results: SimulationResults): void {
    if (!results.config) {
      throw new Error('Missing config in results');
    }
    if (!results.statistics) {
      throw new Error('Missing statistics in results');
    }
    if (!results.vehicleData) {
      throw new Error('Missing vehicleData in results');
    }
    if (typeof results.timestamp !== 'string') {
      throw new Error('Invalid timestamp in results');
    }
  }

  /**
   * CSV形式でエクスポート（車両データ）
   * @param results - シミュレーション結果
   * @returns CSV文字列
   */
  static exportVehicleDataAsCSV(results: SimulationResults): string {
    const headers = [
      'id',
      'direction',
      'turnIntent',
      'entryTime',
      'exitTime',
      'totalTravelTime',
      'waitTime',
      'maxSpeedAchieved',
    ];

    const rows = results.vehicleData.map((v) => [
      v.id,
      v.direction,
      v.turnIntent,
      v.entryTime.toFixed(2),
      v.exitTime.toFixed(2),
      v.totalTravelTime.toFixed(2),
      v.waitTime.toFixed(2),
      v.maxSpeedAchieved.toFixed(2),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  }

  /**
   * CSV形式でダウンロード（車両データ）
   * @param results - シミュレーション結果
   * @param filename - ファイル名（省略時は自動生成）
   */
  static downloadVehicleDataAsCSV(
    results: SimulationResults,
    filename?: string
  ): void {
    const csv = this.exportVehicleDataAsCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const defaultFilename = 'vehicle-data.csv';
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? defaultFilename;
    document.body.appendChild(a);
    a.click();

    // クリーンアップ
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * LocalStorageに結果を保存
   * @param key - 保存キー
   * @param results - シミュレーション結果
   */
  static saveToLocalStorage(key: string, results: SimulationResults): void {
    try {
      const json = this.exportResults(results);
      localStorage.setItem(key, json);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Failed to save results to local storage');
    }
  }

  /**
   * LocalStorageから結果を読み込み
   * @param key - 読み込みキー
   * @returns シミュレーション結果、存在しない場合null
   */
  static loadFromLocalStorage(key: string): SimulationResults | null {
    try {
      const json = localStorage.getItem(key);
      if (!json) {
        return null;
      }
      return this.importResults(json);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * LocalStorageから結果を削除
   * @param key - 削除キー
   */
  static removeFromLocalStorage(key: string): void {
    localStorage.removeItem(key);
  }
}
