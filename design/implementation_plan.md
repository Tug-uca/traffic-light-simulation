# 交差点信号機シミュレーション - 実装計画

## メタ情報

- **作成日**: 2025-12-03
- **対象**: GitHub Pages公開可能なWebベースシミュレーション
- **技術スタック**: JavaScript/TypeScript + HTML5 Canvas/SVG

---

## 1. 技術スタック選定

### 1.1 採用技術

#### (1) プログラミング言語

**TypeScript**

理由：
- 型安全性によるバグの早期発見
- IDEサポートが充実（自動補完、リファクタリング）
- JavaScriptへのトランスパイルで広範なブラウザ対応
- オブジェクト指向プログラミングに適している

代替案：
- Pure JavaScript: 学習コストは低いが、大規模開発では型の欠如が問題
- WebAssembly (Rust/C++): 高速だが開発コストが高い

#### (2) 可視化ライブラリ

**HTML5 Canvas API**

理由：
- ブラウザ標準API（追加ライブラリ不要）
- リアルタイム描画に適している
- 軽量で高速
- GitHub Pagesで即座に動作

補助的に使用：
- SVG: UIコントロール（ボタン、スライダー）
- CSS3: レイアウトとスタイリング

代替案：
- Three.js: 3D表示には適しているが、2Dシミュレーションには過剰
- D3.js: データ可視化には強力だが、リアルタイムアニメーションには不向き
- PixiJS: 高性能だが追加の学習コストあり

#### (3) UIフレームワーク

**軽量フレームワークなし（Vanilla TS + HTML/CSS）**

理由：
- シンプルなUIで十分
- ビルドサイズの最小化
- 依存関係の削減
- GitHub Pagesへの簡単なデプロイ

使用するライブラリ：
- Chart.js: 結果グラフの描画（オプション）
- 乱数生成: seedrandom.js（シード固定の疑似乱数）

#### (4) ビルドツール

**Vite**

理由：
- 高速な開発サーバー
- TypeScript標準サポート
- 最小限の設定
- GitHub Pages向けの簡単なビルド

代替案：
- Webpack: 高機能だが設定が複雑
- Parcel: シンプルだがカスタマイズ性が低い

### 1.2 開発環境

```
開発環境構成：

- エディタ: VS Code（推奨）
- Node.js: v18以上
- npm: v9以上
- Git: バージョン管理
- ブラウザ: Chrome/Firefox（開発用）
```

---

## 2. システムアーキテクチャ

### 2.1 モジュール構成

```
project-root/
├── src/
│   ├── main.ts                    # エントリーポイント
│   ├── core/
│   │   ├── Simulation.ts          # シミュレーション制御
│   │   ├── Intersection.ts        # 交差点クラス
│   │   └── Clock.ts               # 時刻管理
│   ├── entities/
│   │   ├── Vehicle.ts             # 車両クラス
│   │   ├── TrafficLight.ts        # 信号機クラス
│   │   └── Road.ts                # 道路クラス
│   ├── systems/
│   │   ├── VehicleGenerator.ts   # 車両生成システム
│   │   ├── MovementSystem.ts     # 車両移動システム
│   │   ├── SignalController.ts   # 信号制御システム
│   │   └── CollisionAvoidance.ts # 衝突回避システム
│   ├── data/
│   │   ├── DataCollector.ts      # データ収集
│   │   └── Statistics.ts         # 統計計算
│   ├── rendering/
│   │   ├── Renderer.ts            # レンダリングエンジン
│   │   ├── IntersectionRenderer.ts # 交差点描画
│   │   ├── VehicleRenderer.ts    # 車両描画
│   │   └── UIRenderer.ts          # UI描画
│   ├── ui/
│   │   ├── ControlPanel.ts        # コントロールパネル
│   │   ├── ParameterEditor.ts     # パラメータ編集
│   │   └── ResultsPanel.ts        # 結果表示パネル
│   ├── utils/
│   │   ├── Vector2D.ts            # 2Dベクトル演算
│   │   ├── Random.ts              # 乱数生成
│   │   └── Config.ts              # 設定管理
│   └── types/
│       └── index.ts               # 型定義
├── public/
│   ├── index.html                 # HTMLエントリー
│   └── styles.css                 # スタイルシート
├── tests/
│   └── *.test.ts                  # ユニットテスト
├── docs/
│   └── README.md                  # ドキュメント
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 2.2 クラス図（主要クラス）

```
┌─────────────────┐
│   Simulation    │ <── メイン制御
├─────────────────┤
│ +start()        │
│ +pause()        │
│ +reset()        │
│ +step()         │
└────────┬────────┘
         │
         ├─── has ───> Intersection
         ├─── has ───> VehicleGenerator
         ├─── has ───> SignalController
         ├─── has ───> DataCollector
         └─── has ───> Renderer

┌─────────────────┐         ┌─────────────────┐
│  Intersection   │         │     Vehicle     │
├─────────────────┤         ├─────────────────┤
│ -roads: Road[]  │ 1    *  │ -position: Vec2 │
│ -width: number  │ ◄────── │ -velocity: num  │
└─────────────────┘         │ -direction: Dir │
                            │ +update(dt)     │
                            └─────────────────┘

┌─────────────────┐
│  TrafficLight   │
├─────────────────┤
│ -phase: Phase   │
│ -timeInPhase: n │
│ +update(dt)     │
└─────────────────┘

┌──────────────────┐       ┌──────────────────┐
│ SignalController │       │  DataCollector   │
├──────────────────┤       ├──────────────────┤
│ +update(dt)      │       │ +collect(state)  │
│ +getPhase(dir)   │       │ +getStatistics() │
└──────────────────┘       └──────────────────┘
```

### 2.3 データフロー

```
ユーザー入力（パラメータ設定）
    ↓
Simulation.initialize()
    ↓
メインループ (requestAnimationFrame)
    ↓
┌────────────────────────────────────┐
│ 1. VehicleGenerator.tryGenerate()  │
│ 2. SignalController.update()       │
│ 3. MovementSystem.updateAll()      │
│ 4. CollisionAvoidance.check()      │
│ 5. DataCollector.collect()         │
│ 6. Renderer.render()               │
└────────────────────────────────────┘
    ↓
結果出力（グラフ、統計、エクスポート）
```

---

## 3. 開発フェーズ

### フェーズ1: プロジェクトセットアップ（1日目）

**目標**: 開発環境の構築と基本構造の作成

#### タスク：
- [ ] プロジェクトディレクトリの作成
- [ ] package.jsonの設定（dependencies, devDependencies）
- [ ] TypeScript設定（tsconfig.json）
- [ ] Vite設定（vite.config.ts）
- [ ] 基本的なHTMLとCSSの作成
- [ ] Hello World的な動作確認
- [ ] Git初期化とGitHub リポジトリ作成

#### 成果物：
- 開発サーバーが起動し、ブラウザで表示可能
- TypeScriptのコンパイルが正常に動作
- ホットリロードが機能

---

### フェーズ2: コアエンティティの実装（2-3日目）

**目標**: 基本的なエンティティクラスの実装

#### タスク：
- [ ] Vector2Dユーティリティクラス
- [ ] Vehicleクラス（状態変数、基本メソッド）
- [ ] TrafficLightクラス（フェーズ管理）
- [ ] Intersectionクラス（交差点構造）
- [ ] Roadクラス（道路表現）
- [ ] 型定義（types/index.ts）

#### 成果物：
- 各クラスの単体テスト
- 基本的なエンティティが生成可能

---

### フェーズ3: シミュレーションロジックの実装（4-6日目）

**目標**: シミュレーションの核となるロジックの実装

#### タスク：
- [ ] Simulationクラス（メインループ）
- [ ] VehicleGenerator（車両生成ロジック）
- [ ] SignalController（固定サイクル制御）
- [ ] MovementSystem（IDMベースの移動）
- [ ] CollisionAvoidanceシステム
- [ ] 車両の交差点通過判定
- [ ] Randomユーティリティ（シード固定乱数）

#### 成果物：
- コンソールでシミュレーションが実行可能
- ログ出力で車両の動きを確認可能
- 基本的な動作の検証

---

### フェーズ4: データ収集と統計（7日目）

**目標**: シミュレーションデータの収集と分析機能

#### タスク：
- [ ] DataCollectorクラス
- [ ] Statisticsクラス（平均、中央値、標準偏差など）
- [ ] 時系列データの記録
- [ ] 車両ごとのデータ記録
- [ ] JSON/CSVエクスポート機能

#### 成果物：
- シミュレーション終了後に統計データが取得可能
- データのエクスポートが可能

---

### フェーズ5: 可視化の実装（8-10日目）

**目標**: Canvas/SVGによる可視化

#### タスク：
- [ ] Rendererクラス（基本描画エンジン）
- [ ] IntersectionRenderer（交差点の描画）
- [ ] VehicleRenderer（車両の描画）
- [ ] TrafficLightRenderer（信号機の描画）
- [ ] アニメーションループ
- [ ] カメラ/ズーム機能（オプション）
- [ ] リアルタイムグラフ（キュー長の時系列）

#### 成果物：
- ブラウザでシミュレーションが視覚的に確認可能
- 車両の動きがスムーズにアニメーション
- 信号機の状態変化が可視化

---

### フェーズ6: UIとインタラクション（11-12日目）

**目標**: ユーザーインターフェースの実装

#### タスク：
- [ ] ControlPanel（開始/停止/リセットボタン）
- [ ] ParameterEditor（パラメータ調整UI）
  - [ ] スライダー（サイクル長、生成率など）
  - [ ] ドロップダウン（交差点タイプ）
  - [ ] 数値入力フィールド
- [ ] ResultsPanel（統計表示）
  - [ ] リアルタイム統計
  - [ ] 最終結果表示
- [ ] 速度調整（スロー/ファスト再生）
- [ ] シード入力（再現性のため）

#### 成果物：
- 直感的に操作可能なUI
- パラメータを変更してすぐに実行可能
- 結果が見やすく表示される

---

### フェーズ7: テストとバリデーション（13-14日目）

**目標**: モデルの検証とバグ修正

#### タスク：
- [ ] 単体テストの充実
- [ ] 統合テスト
- [ ] シナリオテスト
  - [ ] 低交通量（自由流）
  - [ ] 高交通量（渋滞）
  - [ ] 非対称交通量
- [ ] 理論値との比較
  - [ ] 待ち行列理論との照合
  - [ ] 交通流理論との整合性確認
- [ ] エッジケースのテスト
  - [ ] 生成率=0
  - [ ] 極端なサイクル長
- [ ] ブラウザ互換性テスト

#### 成果物：
- テストカバレッジ70%以上
- 既知のバグがすべて修正
- 複数ブラウザで動作確認

---

### フェーズ8: 最適化とパフォーマンス向上（15日目）

**目標**: パフォーマンスの最適化

#### タスク：
- [ ] プロファイリング（Chrome DevTools）
- [ ] ボトルネックの特定
- [ ] 描画の最適化
  - [ ] オフスクリーンキャンバス
  - [ ] 差分描画
- [ ] 計算の最適化
  - [ ] 不要な計算の削減
  - [ ] データ構造の最適化
- [ ] メモリリーク対策

#### 成果物：
- 60 FPSでスムーズに動作
- 1000台以上の車両を扱える

---

### フェーズ9: ドキュメントとチュートリアル（16日目）

**目標**: ユーザー向けドキュメントの作成

#### タスク：
- [ ] README.mdの充実
  - [ ] 使い方
  - [ ] パラメータ説明
  - [ ] 技術スタック
- [ ] インラインヘルプ（UIにツールチップ）
- [ ] チュートリアル動画またはGIF
- [ ] サンプル設定ファイル
- [ ] FAQページ

#### 成果物：
- 初心者でも使えるドキュメント
- GitHub READMEが充実

---

### フェーズ10: デプロイとGitHub Pages公開（17日目）

**目標**: GitHub Pagesへのデプロイ

#### タスク：
- [ ] ビルドスクリプトの作成
- [ ] GitHub Actions設定（CI/CD）
- [ ] distフォルダの生成と確認
- [ ] GitHub Pages設定
- [ ] カスタムドメイン設定（オプション）
- [ ] OGP設定（SNSシェア用）
- [ ] Google Analytics設定（オプション）

#### 成果物：
- `https://<username>.github.io/<repo>/`でアクセス可能
- 自動デプロイのCI/CDパイプライン

---

### フェーズ11（オプション）: 拡張機能（18日目以降）

**目標**: 追加機能の実装

#### 可能な拡張：
- [ ] 複数シナリオの保存/読込
- [ ] パラメータスイープ（自動実験）
- [ ] 3D可視化（Three.js）
- [ ] 歩行者の追加
- [ ] 右左折専用車線
- [ ] 感応式信号制御
- [ ] 強化学習による信号最適化
- [ ] リアルタイム交通データの取り込み
- [ ] マルチ交差点ネットワーク

---

## 4. クラス詳細設計

### 4.1 Vehicleクラス

```typescript
/**
 * 車両エージェントクラス
 */
export class Vehicle {
    // 識別情報
    public readonly id: string;
    public readonly direction: Direction;
    public readonly turnIntent: TurnIntent;

    // 物理状態
    public position: Vector2D;
    public velocity: number;
    public acceleration: number;

    // シミュレーション状態
    public status: VehicleStatus;
    public lane: number;
    public waitTime: number;
    public totalTravelTime: number;

    // パラメータ
    public readonly maxSpeed: number;
    public readonly maxAcceleration: number;
    public readonly comfortableDeceleration: number;
    public readonly minGap: number;
    public readonly reactionTime: number;
    public readonly length: number;

    constructor(config: VehicleConfig) {
        // 初期化
    }

    /**
     * 車両の状態を1タイムステップ更新
     */
    public update(dt: number, frontVehicle: Vehicle | null, trafficLight: TrafficLight): void {
        // IDMベースの速度計算
        const targetSpeed = this.calculateTargetSpeed(frontVehicle, trafficLight);
        const acceleration = this.calculateAcceleration(targetSpeed, frontVehicle);

        // 速度・位置更新
        this.velocity = Math.max(0, Math.min(this.maxSpeed, this.velocity + acceleration * dt));
        this.position = this.position.add(this.getDirectionVector().scale(this.velocity * dt));

        // 統計更新
        if (this.velocity < 0.5) {
            this.waitTime += dt;
        }
        this.totalTravelTime += dt;
    }

    private calculateTargetSpeed(frontVehicle: Vehicle | null, trafficLight: TrafficLight): number {
        // ロジック実装
    }

    private calculateAcceleration(targetSpeed: number, frontVehicle: Vehicle | null): number {
        // IDM実装
    }

    private getDirectionVector(): Vector2D {
        // 方向ベクトル
    }
}
```

### 4.2 TrafficLightクラス

```typescript
/**
 * 信号機クラス
 */
export class TrafficLight {
    public readonly id: string;
    public readonly direction: Direction;
    public readonly position: Vector2D;

    public phase: SignalPhase;  // "green" | "yellow" | "red"
    public timeInPhase: number;

    private readonly greenDuration: number;
    private readonly yellowDuration: number;
    private readonly redDuration: number;

    constructor(config: TrafficLightConfig) {
        // 初期化
    }

    /**
     * 信号機の状態を更新（外部制御による）
     */
    public setPhase(newPhase: SignalPhase): void {
        if (this.phase !== newPhase) {
            this.phase = newPhase;
            this.timeInPhase = 0;
        }
    }

    /**
     * フェーズ内の経過時間を進める
     */
    public tick(dt: number): void {
        this.timeInPhase += dt;
    }

    /**
     * 車両が通過可能か
     */
    public canPass(): boolean {
        return this.phase === "green";
    }
}
```

### 4.3 SignalControllerクラス

```typescript
/**
 * 固定サイクル信号制御
 */
export class SignalController {
    private trafficLights: Map<Direction, TrafficLight>;
    private cyclePosition: number = 0;
    private readonly schedule: PhaseSchedule[];
    private readonly cycleLength: number;

    constructor(trafficLights: Map<Direction, TrafficLight>, config: SignalConfig) {
        this.trafficLights = trafficLights;
        this.schedule = this.buildSchedule(config);
        this.cycleLength = this.calculateCycleLength(config);
    }

    /**
     * 信号制御を1タイムステップ更新
     */
    public update(dt: number): void {
        this.cyclePosition += dt;

        // サイクルの繰り返し
        if (this.cyclePosition >= this.cycleLength) {
            this.cyclePosition = this.cyclePosition % this.cycleLength;
        }

        // 現在のフェーズを適用
        const currentPhase = this.getCurrentPhase();
        this.applyPhase(currentPhase);
    }

    private buildSchedule(config: SignalConfig): PhaseSchedule[] {
        // スケジュール構築
    }

    private getCurrentPhase(): PhaseSchedule {
        // 現在時刻に対応するフェーズを取得
    }

    private applyPhase(phase: PhaseSchedule): void {
        // 各信号機にフェーズを適用
    }
}
```

### 4.4 Simulationクラス

```typescript
/**
 * シミュレーション制御クラス
 */
export class Simulation {
    private config: SimulationConfig;
    private intersection: Intersection;
    private vehicles: Vehicle[] = [];
    private vehicleGenerator: VehicleGenerator;
    private signalController: SignalController;
    private dataCollector: DataCollector;
    private renderer: Renderer;

    private currentTime: number = 0;
    private isRunning: boolean = false;
    private animationId: number | null = null;

    constructor(config: SimulationConfig) {
        this.config = config;
        this.initialize();
    }

    private initialize(): void {
        // 各コンポーネントの初期化
    }

    /**
     * シミュレーション開始
     */
    public start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animationLoop();
        }
    }

    /**
     * シミュレーション停止
     */
    public pause(): void {
        this.isRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * シミュレーションリセット
     */
    public reset(): void {
        this.pause();
        this.currentTime = 0;
        this.vehicles = [];
        this.dataCollector.reset();
        this.initialize();
    }

    /**
     * メインループ
     */
    private animationLoop = (): void => {
        if (!this.isRunning) return;

        const dt = this.config.timeStep;

        // 1. 車両生成
        this.generateVehicles(dt);

        // 2. 信号制御更新
        this.signalController.update(dt);

        // 3. 車両移動
        this.updateVehicles(dt);

        // 4. 退出判定
        this.removeExitedVehicles();

        // 5. データ収集
        this.dataCollector.collect(this.currentTime, this.vehicles, this.signalController);

        // 6. 描画
        this.renderer.render(this.intersection, this.vehicles, this.signalController);

        // 時刻を進める
        this.currentTime += dt;

        // 終了判定
        if (this.currentTime < this.config.duration) {
            this.animationId = requestAnimationFrame(this.animationLoop);
        } else {
            this.onSimulationEnd();
        }
    };

    private generateVehicles(dt: number): void {
        for (const direction of this.intersection.getDirections()) {
            const vehicle = this.vehicleGenerator.tryGenerate(direction, dt);
            if (vehicle !== null) {
                this.vehicles.push(vehicle);
            }
        }
    }

    private updateVehicles(dt: number): void {
        for (const vehicle of this.vehicles) {
            const frontVehicle = this.findFrontVehicle(vehicle);
            const trafficLight = this.signalController.getLight(vehicle.direction);
            vehicle.update(dt, frontVehicle, trafficLight);
        }
    }

    private findFrontVehicle(vehicle: Vehicle): Vehicle | null {
        // 同じ方向・車線の前方車両を検索
    }

    private removeExitedVehicles(): void {
        this.vehicles = this.vehicles.filter(v => !this.hasExited(v));
    }

    private hasExited(vehicle: Vehicle): boolean {
        // 退出判定
    }

    private onSimulationEnd(): void {
        this.pause();
        const statistics = this.dataCollector.getStatistics();
        console.log("Simulation completed", statistics);
        // UIに結果を表示
    }
}
```

---

## 5. テスト計画

### 5.1 単体テスト

```typescript
// tests/Vehicle.test.ts
describe("Vehicle", () => {
    test("初期化が正しく行われる", () => {
        const vehicle = new Vehicle({...});
        expect(vehicle.velocity).toBe(0);
        expect(vehicle.position).toEqual(new Vector2D(0, -200));
    });

    test("加速が正しく計算される", () => {
        // テストケース
    });

    test("前方車両との車間距離を維持する", () => {
        // テストケース
    });
});

// tests/TrafficLight.test.ts
describe("TrafficLight", () => {
    test("フェーズ転移が正しく行われる", () => {
        // テストケース
    });
});

// tests/SignalController.test.ts
describe("SignalController", () => {
    test("固定サイクルが正しく動作する", () => {
        // テストケース
    });
});
```

### 5.2 統合テスト

```typescript
// tests/integration.test.ts
describe("Simulation Integration", () => {
    test("基本シナリオが正常に実行される", () => {
        const sim = new Simulation({...});
        sim.start();
        // アサーション
    });

    test("高交通量でも安定動作する", () => {
        // テストケース
    });
});
```

---

## 6. デプロイ設定

### 6.1 package.json

```json
{
  "name": "traffic-light-simulation",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "seedrandom": "^3.0.5"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/seedrandom": "^3.0.8",
    "gh-pages": "^6.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 6.2 GitHub Actions（.github/workflows/deploy.yml）

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 7. まとめ

### 7.1 開発期間見積もり

| フェーズ | 期間 | 累積 |
|---------|------|------|
| 1. セットアップ | 1日 | 1日 |
| 2. エンティティ | 2日 | 3日 |
| 3. ロジック | 3日 | 6日 |
| 4. データ収集 | 1日 | 7日 |
| 5. 可視化 | 3日 | 10日 |
| 6. UI | 2日 | 12日 |
| 7. テスト | 2日 | 14日 |
| 8. 最適化 | 1日 | 15日 |
| 9. ドキュメント | 1日 | 16日 |
| 10. デプロイ | 1日 | 17日 |

**総開発期間: 約17日間（実働）**

### 7.2 必要リソース

- 開発者: 1名
- 作業時間: 1日6-8時間
- ハードウェア: 標準的な開発PC

### 7.3 リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| TypeScript学習コスト | 中 | 事前学習、簡単な部分からスタート |
| パフォーマンス問題 | 高 | 早期プロファイリング、段階的最適化 |
| ブラウザ互換性 | 中 | モダンブラウザに限定、ポリフィル使用 |
| スコープクリープ | 高 | MVP優先、拡張機能は後回し |

---

**実装計画ステータス**: 完成
**次のアクション**: ODDドキュメントと実装計画のレビュー、開発開始の承認待ち
