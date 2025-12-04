/**
 * Chart Manager
 * グラフ管理システム
 *
 * Chart.jsを使用したデータ可視化
 */

import { Chart, registerables } from 'chart.js';
import type { SimulationResults, QueueLengthRecord } from './types';

// Chart.jsの全てのコンポーネントを登録
Chart.register(...registerables);

export class ChartManager {
  private queueLengthChart: Chart | null = null;
  private travelTimeChart: Chart | null = null;
  private throughputChart: Chart | null = null;

  /**
   * キュー長グラフを作成
   * @param canvasId - Canvasのid
   * @param results - シミュレーション結果
   */
  createQueueLengthChart(canvasId: string, results: SimulationResults): void {
    console.log(`📊 Creating queue length chart with canvasId: "${canvasId}"`);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`❌ Canvas with id "${canvasId}" not found`);
      return;
    }
    console.log(`✅ Canvas element found:`, canvas);

    // 既存のチャートを破棄
    if (this.queueLengthChart) {
      this.queueLengthChart.destroy();
    }

    // データの準備
    console.log(`📈 Queue length history records: ${results.queueLengthHistory.length}`);
    const { labels, datasets } = this.prepareQueueLengthData(results.queueLengthHistory);
    console.log(`📈 Prepared ${labels.length} labels and ${datasets.length} datasets`);

    // チャートの作成
    this.queueLengthChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'キュー長の時系列変化',
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '時刻 (秒)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'キュー長 (台)',
            },
            beginAtZero: true,
          },
        },
      },
    });
    console.log(`✅ Queue length chart created successfully`);
  }

  /**
   * 走行時間分布グラフを作成
   * @param canvasId - Canvasのid
   * @param results - シミュレーション結果
   */
  createTravelTimeChart(canvasId: string, results: SimulationResults): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`Canvas with id "${canvasId}" not found`);
      return;
    }

    // 既存のチャートを破棄
    if (this.travelTimeChart) {
      this.travelTimeChart.destroy();
    }

    // データの準備
    const { labels, data } = this.prepareTravelTimeData(results);

    // チャートの作成
    this.travelTimeChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '車両数',
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '走行時間の分布',
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '走行時間 (秒)',
            },
          },
          y: {
            title: {
              display: true,
              text: '車両数',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /**
   * スループットグラフを作成
   * @param canvasId - Canvasのid
   * @param results - シミュレーション結果
   */
  createThroughputChart(canvasId: string, results: SimulationResults): void {
    console.log(`📊 Creating throughput chart with canvasId: "${canvasId}"`);
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`❌ Canvas with id "${canvasId}" not found`);
      return;
    }
    console.log(`✅ Canvas element found:`, canvas);

    // 既存のチャートを破棄
    if (this.throughputChart) {
      this.throughputChart.destroy();
    }

    // データの準備
    console.log(`📈 Statistics:`, results.statistics.byDirection);
    const { labels, data } = this.prepareThroughputData(results);
    console.log(`📈 Prepared ${labels.length} labels and ${data.length} data points:`, data);

    // チャートの作成
    this.throughputChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'スループット (台/時)',
            data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '方向別スループット',
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '方向',
            },
          },
          y: {
            title: {
              display: true,
              text: 'スループット (台/時)',
            },
            beginAtZero: true,
          },
        },
      },
    });
    console.log(`✅ Throughput chart created successfully`);
  }

  /**
   * キュー長データの準備
   */
  private prepareQueueLengthData(history: QueueLengthRecord[]) {
    const labels = history.map((record) => record.time.toFixed(0));

    const datasets = [
      {
        label: '北',
        data: history.map((record) => record.queueLengths.north),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
      },
      {
        label: '南',
        data: history.map((record) => record.queueLengths.south),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1,
      },
      {
        label: '東',
        data: history.map((record) => record.queueLengths.east),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.1)',
        tension: 0.1,
      },
      {
        label: '西',
        data: history.map((record) => record.queueLengths.west),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
      },
    ];

    return { labels, datasets };
  }

  /**
   * 走行時間データの準備
   */
  private prepareTravelTimeData(results: SimulationResults) {
    // 走行時間をヒストグラムに変換
    const travelTimes = results.vehicleData.map((v) => v.totalTravelTime);
    const binSize = 10; // 10秒ごとのビン
    const maxTime = Math.max(...travelTimes);
    const numBins = Math.ceil(maxTime / binSize);

    const bins = new Array(numBins).fill(0);
    const labels = new Array(numBins).fill(0).map((_, i) => `${i * binSize}-${(i + 1) * binSize}`);

    for (const time of travelTimes) {
      const binIndex = Math.min(Math.floor(time / binSize), numBins - 1);
      bins[binIndex]++;
    }

    return { labels, data: bins };
  }

  /**
   * スループットデータの準備
   */
  private prepareThroughputData(results: SimulationResults) {
    const labels = ['北', '南', '東', '西'];
    const data = [
      results.statistics.byDirection.north.throughput,
      results.statistics.byDirection.south.throughput,
      results.statistics.byDirection.east.throughput,
      results.statistics.byDirection.west.throughput,
    ];

    return { labels, data };
  }

  /**
   * すべてのチャートを作成
   * @param results - シミュレーション結果
   */
  createAllCharts(results: SimulationResults): void {
    console.log(`📊 Creating all charts...`);
    console.log(`📊 Results summary:`, {
      totalVehicles: results.statistics.totalVehicles,
      queueLengthRecords: results.queueLengthHistory.length,
      vehicleDataRecords: results.vehicleData.length
    });
    this.createQueueLengthChart('queue-chart', results);
    this.createThroughputChart('throughput-chart', results);
    console.log(`✅ All charts created`);
  }

  /**
   * すべてのチャートを破棄
   */
  destroyAllCharts(): void {
    if (this.queueLengthChart) {
      this.queueLengthChart.destroy();
      this.queueLengthChart = null;
    }
    if (this.travelTimeChart) {
      this.travelTimeChart.destroy();
      this.travelTimeChart = null;
    }
    if (this.throughputChart) {
      this.throughputChart.destroy();
      this.throughputChart = null;
    }
  }
}
