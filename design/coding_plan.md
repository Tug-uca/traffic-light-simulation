# 交差点信号機シミュレーション - 実装計画

## メタ情報
- **作成日**: 2025-12-03
- **ステータス**: レビュー待ち
- **参照ドキュメント**:
  - design/odd_document.md
  - design/implementation_plan.md
  - design/README.md

---

## 事前確認事項

### [Question 1] ディレクトリ構造について
implementation_plan.mdには以下のようなディレクトリ構造が提案されていますが、「ディレクトリ構造はフラットに保つ」という指示をいただきました。

提案されている構造:
```
src/
├── core/
├── entities/
├── systems/
├── data/
├── rendering/
├── ui/
├── utils/
└── types/
```

以下のどちらで進めますか？
- A) フラットな構造にする（全てのファイルをsrc/直下に配置）
- B) implementation_plan.mdの構造を採用する
- C) その他（具体的に指示してください）

[Answer 1]


### [Question 2] リポジトリの扱いについて
「リポジトリはインメモリであると想定」という指示をいただきました。これは以下のどちらを意味しますか？
- A) データの永続化は行わず、全てメモリ上で処理する（LocalStorageやIndexedDBは使わない）
- B) データのインポート/エクスポートはJSONの保存/読込のみで、データベースは使わない
- C) その他（具体的に説明してください）

[Answer 2]


### [Question 3] 再利用する標準コンポーネントについて
「ログやその他のユーティリティには標準的なコンポーネントを再利用」という指示をいただきました。
以下のどれを使用しますか？
- A) ブラウザ標準のconsole.log/console.error（カスタムロギングは実装しない）
- B) 既存のログライブラリ（具体的に指定してください）
- C) その他（具体的に説明してください）

[Answer 3]


### [Question 4] 乱数生成ライブラリについて
implementation_plan.mdでは`seedrandom.js`の使用が提案されていますが、採用しますか？
- A) seedrandom.jsを使用する
- B) ブラウザ標準のMath.random()を使用する（再現性は犠牲にする）
- C) その他のライブラリを使用する（具体的に指定してください）

[Answer 4]


### [Question 5] グラフライブラリについて
implementation_plan.mdでは結果表示にChart.js（オプション）が提案されていますが、採用しますか？
- A) Chart.jsを使用する
- B) Canvas APIで自作する
- C) グラフ機能は実装しない（数値表示のみ）
- D) その他のライブラリを使用する（具体的に指定してください）

[Answer 5]


---

## 実装ステップ

### フェーズ1: プロジェクトセットアップ（1日目）

#### ステップ1.1: プロジェクト初期化
- [ ] package.jsonの作成（dependencies, devDependencies, scriptsの定義）
- [ ] tsconfig.jsonの作成（TypeScriptコンパイラオプション設定）
- [ ] vite.config.tsの作成（Vite設定）
- [ ] .gitignoreの作成（node_modules, dist等を除外）

#### ステップ1.2: 基本ファイル作成
- [ ] public/index.htmlの作成（基本HTML構造）
- [ ] public/styles.cssの作成（基本スタイル）
- [ ] src/main.tsの作成（エントリーポイント）

#### ステップ1.3: 開発環境確認
- [ ] npm installの実行
- [ ] npm run devでの開発サーバー起動確認
- [ ] ブラウザでHello World表示確認

**成果物チェック:**
- [ ] 開発サーバーがlocalhost:5173で起動する
- [ ] TypeScriptのコンパイルが正常に動作する
- [ ] ホットリロードが機能する

---

### フェーズ2: ユーティリティとタイプ定義（2日目）

#### ステップ2.1: タイプ定義
- [ ] types/index.ts（またはtypes.ts）の作成
  - [ ] Direction型（"north" | "south" | "east" | "west"）
  - [ ] TurnIntent型（"straight" | "left" | "right"）
  - [ ] SignalPhase型（"green" | "yellow" | "red"）
  - [ ] VehicleStatus型（"approaching" | "waiting" | "crossing" | "exited"）
  - [ ] VehicleConfig, TrafficLightConfig, SimulationConfig等のインターフェース

#### ステップ2.2: Vector2Dユーティリティ
- [ ] Vector2Dクラスの実装（position管理用）
  - [ ] constructor(x: number, y: number)
  - [ ] add(other: Vector2D): Vector2D
  - [ ] subtract(other: Vector2D): Vector2D
  - [ ] scale(scalar: number): Vector2D
  - [ ] magnitude(): number
  - [ ] normalize(): Vector2D
  - [ ] distance(other: Vector2D): number

#### ステップ2.3: 乱数ユーティリティ
- [ ] Random/Randomクラスの実装（シード固定乱数）
  - [ ] constructor(seed: number)
  - [ ] random(): number（0-1の一様乱数）
  - [ ] 注: [Answer 4]の回答に基づいて実装方法を決定

#### ステップ2.4: 設定管理
- [ ] Configクラス/オブジェクトの実装
  - [ ] デフォルトパラメータの定義
  - [ ] 設定の読み込みと検証

**成果物チェック:**
- [ ] 全ての型定義が正しくエクスポートされている
- [ ] Vector2Dの単体テストが通る
- [ ] 乱数生成器が同じシードで同じ結果を返す

---

### フェーズ3: コアエンティティの実装（3-4日目）

#### ステップ3.1: Vehicleクラス
- [ ] Vehicleクラスの実装（odd_document.md 3.3.1参照）
  - [ ] プロパティ定義（id, position, velocity, direction等）
  - [ ] constructor(config: VehicleConfig)
  - [ ] update(dt: number, frontVehicle: Vehicle | null, trafficLight: TrafficLight)メソッド
  - [ ] calculateTargetSpeed()メソッド
  - [ ] calculateAcceleration()メソッド（IDM簡易版）
  - [ ] getDirectionVector()メソッド

#### ステップ3.2: TrafficLightクラス
- [ ] TrafficLightクラスの実装（odd_document.md 1.2.1参照）
  - [ ] プロパティ定義（id, direction, phase, timeInPhase等）
  - [ ] constructor(config: TrafficLightConfig)
  - [ ] setPhase(newPhase: SignalPhase)メソッド
  - [ ] tick(dt: number)メソッド
  - [ ] canPass(): booleanメソッド

#### ステップ3.3: Roadクラス
- [ ] Roadクラスの実装
  - [ ] プロパティ定義（direction, numLanes, length, laneWidth）
  - [ ] constructor(config: RoadConfig)
  - [ ] 車線の位置計算メソッド

#### ステップ3.4: Intersectionクラス
- [ ] Intersectionクラスの実装
  - [ ] プロパティ定義（type, dimensions, roads）
  - [ ] constructor(config: IntersectionConfig)
  - [ ] addRoad(direction: Direction, road: Road)メソッド
  - [ ] getDirections(): Direction[]メソッド
  - [ ] 交差点境界の定義

**成果物チェック:**
- [ ] 各クラスのインスタンスが正しく生成できる
- [ ] Vehicleの速度・位置更新が正しく動作する
- [ ] TrafficLightのフェーズ遷移が正しく動作する

---

### フェーズ4: シミュレーションシステム（5-6日目）

#### ステップ4.1: VehicleGeneratorクラス
- [ ] VehicleGeneratorクラスの実装（odd_document.md 3.3.3参照）
  - [ ] constructor(config, rng)
  - [ ] tryGenerate(direction: Direction, dt: number): Vehicle | null
  - [ ] createVehicle(direction: Direction): Vehicle
  - [ ] chooseTurnIntent(): TurnIntent
  - [ ] getEntryPosition(direction: Direction): Vector2D

#### ステップ4.2: SignalControllerクラス
- [ ] SignalControllerクラスの実装（odd_document.md 3.3.2参照）
  - [ ] constructor(trafficLights, config)
  - [ ] buildSchedule(): PhaseSchedule[]
  - [ ] update(dt: number)メソッド
  - [ ] getCurrentPhase(): PhaseSchedule
  - [ ] applyPhase(phase: PhaseSchedule)メソッド

#### ステップ4.3: MovementSystemモジュール
- [ ] 車両移動ロジックの実装
  - [ ] updateVehicles(vehicles: Vehicle[], dt: number, trafficLights, intersection)
  - [ ] findFrontVehicle(vehicle: Vehicle, vehicles: Vehicle[]): Vehicle | null
  - [ ] calculateGap(vehicle: Vehicle, frontVehicle: Vehicle): number

#### ステップ4.4: CollisionAvoidanceシステム
- [ ] 衝突回避ロジックの実装
  - [ ] checkCollisions(vehicles: Vehicle[])
  - [ ] resolveOverlap(v1: Vehicle, v2: Vehicle)

**成果物チェック:**
- [ ] 車両が確率的に生成される
- [ ] 信号機が固定サイクルで動作する
- [ ] 車両が前方車両との距離を維持する
- [ ] 衝突が発生しない

---

### フェーズ5: データ収集と統計（7日目）

#### ステップ5.1: DataCollectorクラス
- [ ] DataCollectorクラスの実装（odd_document.md 3.3.5参照）
  - [ ] constructor()
  - [ ] collect(time: number, vehicles: Vehicle[], trafficLights)メソッド
  - [ ] recordVehicleExit(vehicle: Vehicle)メソッド
  - [ ] reset()メソッド
  - [ ] getStatistics()メソッド

#### ステップ5.2: Statisticsクラス/モジュール
- [ ] 統計計算ロジックの実装
  - [ ] calculateMean(data: number[]): number
  - [ ] calculateMedian(data: number[]): number
  - [ ] calculateStdDev(data: number[]): number
  - [ ] calculatePercentile(data: number[], percentile: number): number

#### ステップ5.3: データエクスポート機能
- [ ] JSONエクスポート機能
  - [ ] exportToJSON(data: any): string
  - [ ] downloadJSON(data: any, filename: string)
- [ ] CSVエクスポート機能（オプション）
  - [ ] exportToCSV(data: any): string
  - [ ] downloadCSV(data: any, filename: string)

**成果物チェック:**
- [ ] 時系列データが正しく記録される
- [ ] 統計値が正しく計算される
- [ ] データのエクスポートが動作する

---

### フェーズ6: Simulationクラス（8日目）

#### ステップ6.1: Simulationクラスの実装
- [ ] Simulationクラスの実装（odd_document.md 1.3, implementation_plan.md参照）
  - [ ] constructor(config: SimulationConfig)
  - [ ] initialize()メソッド
  - [ ] start()メソッド
  - [ ] pause()メソッド
  - [ ] reset()メソッド
  - [ ] step(dt: number)メソッド
  - [ ] animationLoop()メソッド（requestAnimationFrame使用）

#### ステップ6.2: メインループの実装
- [ ] 6フェーズのメインループ実装
  - [ ] 1. 車両生成フェーズ（generateVehicles）
  - [ ] 2. 信号機更新フェーズ（signalController.update）
  - [ ] 3. 車両行動決定・移動フェーズ（updateVehicles）
  - [ ] 4. 退出判定フェーズ（removeExitedVehicles）
  - [ ] 5. データ収集フェーズ（dataCollector.collect）
  - [ ] 6. 可視化更新フェーズ（renderer.render）

#### ステップ6.3: 終了処理
- [ ] シミュレーション終了判定
- [ ] 最終統計の計算
- [ ] onSimulationEnd()コールバック

**成果物チェック:**
- [ ] シミュレーションが開始・停止・リセットできる
- [ ] メインループが正しい順序で実行される
- [ ] コンソールでシミュレーションの動作が確認できる

---

### フェーズ7: 可視化実装（9-11日目）

#### ステップ7.1: Rendererクラス基本実装
- [ ] Rendererクラスの実装
  - [ ] constructor(canvas: HTMLCanvasElement, config)
  - [ ] render(intersection, vehicles, trafficLights)メソッド
  - [ ] clear()メソッド
  - [ ] 座標変換ロジック（ワールド座標→スクリーン座標）

#### ステップ7.2: IntersectionRendererモジュール
- [ ] 交差点の描画
  - [ ] drawIntersection(ctx: CanvasRenderingContext2D, intersection)
  - [ ] 道路の描画
  - [ ] 車線の描画
  - [ ] 停止線の描画

#### ステップ7.3: VehicleRendererモジュール
- [ ] 車両の描画
  - [ ] drawVehicle(ctx: CanvasRenderingContext2D, vehicle)
  - [ ] 車両の向きに応じた描画
  - [ ] 車両のステータスに応じた色分け

#### ステップ7.4: TrafficLightRendererモジュール
- [ ] 信号機の描画
  - [ ] drawTrafficLight(ctx: CanvasRenderingContext2D, trafficLight)
  - [ ] フェーズに応じた色（赤・黄・緑）の表示

#### ステップ7.5: UIRenderer/情報表示
- [ ] リアルタイム情報の描画
  - [ ] 現在時刻の表示
  - [ ] 車両数の表示
  - [ ] キュー長の表示

**成果物チェック:**
- [ ] Canvas上に交差点が正しく描画される
- [ ] 車両がスムーズに動く
- [ ] 信号機の色変化が視認できる
- [ ] アニメーションが60fps程度で動作する

---

### フェーズ8: UIコントロール（12-13日目）

#### ステップ8.1: ControlPanelの実装
- [ ] HTML要素の作成（index.htmlに追加）
  - [ ] 開始ボタン
  - [ ] 停止ボタン
  - [ ] リセットボタン
  - [ ] 速度調整スライダー（オプション）

#### ステップ8.2: ParameterEditorの実装
- [ ] パラメータ入力UIの作成
  - [ ] サイクル長入力（南北・東西）
  - [ ] 車両生成率入力（4方向）
  - [ ] 黄信号・全赤時間入力
  - [ ] 交差点タイプ選択（十字路/T字路）
  - [ ] 乱数シード入力

#### ステップ8.3: ResultsPanelの実装
- [ ] 結果表示UIの作成
  - [ ] リアルタイム統計表示エリア
  - [ ] 最終結果表示エリア
  - [ ] エクスポートボタン

#### ステップ8.4: イベントハンドラの実装
- [ ] ボタンクリックイベント
- [ ] パラメータ変更イベント
- [ ] キーボードショートカット（オプション）

**成果物チェック:**
- [ ] UIからシミュレーションを制御できる
- [ ] パラメータを変更して新しいシミュレーションを開始できる
- [ ] 結果がUIに表示される

---

### フェーズ9: グラフ表示（14日目）※オプション

[Answer 5]の回答に基づいて実装内容を決定

#### ステップ9.1: グラフライブラリのセットアップ（Chart.js使用の場合）
- [ ] Chart.jsのインストールと設定
- [ ] グラフ用のcanvas要素の追加

#### ステップ9.2: グラフの実装
- [ ] キュー長の時系列グラフ
- [ ] 累積通過台数のグラフ
- [ ] 待ち時間分布のヒストグラム（オプション）

#### ステップ9.3: グラフの更新ロジック
- [ ] リアルタイムデータ更新
- [ ] シミュレーション終了時の最終グラフ表示

**成果物チェック:**
- [ ] グラフがリアルタイムで更新される
- [ ] グラフが見やすく表示される

---

### フェーズ10: テストとバリデーション（15日目）

#### ステップ10.1: 単体テスト
- [ ] Vector2Dのテスト
- [ ] Vehicleのテスト
  - [ ] 速度更新のテスト
  - [ ] 位置更新のテスト
  - [ ] 待ち時間計算のテスト
- [ ] TrafficLightのテスト
  - [ ] フェーズ遷移のテスト
- [ ] VehicleGeneratorのテスト
  - [ ] 生成確率のテスト（統計的検証）

#### ステップ10.2: 統合テスト
- [ ] シミュレーション全体の動作テスト
  - [ ] 低交通量シナリオ
  - [ ] 高交通量シナリオ
  - [ ] 非対称交通量シナリオ

#### ステップ10.3: モデル検証
- [ ] ポアソン到着の検証（到着間隔の分布確認）
- [ ] 交通流理論との整合性確認（Q = k * v）
- [ ] 待ち行列理論との比較

#### ステップ10.4: バグ修正
- [ ] テストで発見されたバグの修正
- [ ] エッジケースの対応

**成果物チェック:**
- [ ] 全ての単体テストが通る
- [ ] 統合テストが通る
- [ ] 理論値との乖離が許容範囲内

---

### フェーズ11: 最適化とパフォーマンス（16日目）

#### ステップ11.1: パフォーマンス測定
- [ ] Chrome DevToolsでのプロファイリング
- [ ] ボトルネックの特定

#### ステップ11.2: 描画最適化
- [ ] 不要な再描画の削減
- [ ] オフスクリーンキャンバスの検討（必要に応じて）
- [ ] requestAnimationFrameの適切な使用

#### ステップ11.3: 計算最適化
- [ ] 前方車両検索の最適化（必要に応じて空間インデックス）
- [ ] 不要な計算の削減

#### ステップ11.4: メモリ管理
- [ ] メモリリークのチェック
- [ ] 不要なデータの削除

**成果物チェック:**
- [ ] 60 FPSで安定動作する
- [ ] 500台以上の車両を扱える
- [ ] メモリリークがない

---

### フェーズ12: ドキュメントとREADME（17日目）

#### ステップ12.1: README.mdの作成/更新
- [ ] プロジェクト概要
- [ ] デモリンク（GitHub Pages URL）
- [ ] 使い方
- [ ] パラメータの説明
- [ ] 技術スタック
- [ ] ライセンス情報

#### ステップ12.2: コード内ドキュメント
- [ ] 主要クラスのJSDocコメント追加
- [ ] 複雑なロジックへのコメント追加

#### ステップ12.3: ユーザーガイド
- [ ] UIの使い方の説明（index.html内またはREADME）
- [ ] パラメータ調整のヒント

**成果物チェック:**
- [ ] README.mdが充実している
- [ ] コードが読みやすくドキュメント化されている

---

### フェーズ13: GitHub Pagesデプロイ（18日目）

#### ステップ13.1: ビルド設定
- [ ] vite.config.tsのbase設定（GitHub Pages用）
- [ ] ビルドスクリプトの確認（npm run build）
- [ ] distフォルダの生成確認

#### ステップ13.2: GitHub Actions設定
- [ ] .github/workflows/deploy.ymlの作成
- [ ] ワークフローのテスト

#### ステップ13.3: GitHub Pages設定
- [ ] リポジトリのSettings > Pagesで設定
- [ ] gh-pagesブランチの確認

#### ステップ13.4: デプロイ確認
- [ ] GitHub Pages URLでアクセス確認
- [ ] 全機能の動作確認

**成果物チェック:**
- [ ] GitHub Pagesで公開されている
- [ ] 全ての機能が正常に動作する
- [ ] CI/CDパイプラインが動作する

---

## 追加タスク（時間があれば）

### オプション機能1: シナリオの保存/読込
- [ ] 設定のJSON保存機能
- [ ] 設定のJSON読込機能
- [ ] LocalStorageへの保存（[Answer 2]の回答次第）

### オプション機能2: パラメータスイープ
- [ ] 自動実験機能（複数パラメータの組み合わせを自動実行）
- [ ] 結果の比較表示

### オプション機能3: T字路のサポート
- [ ] T字路用の交差点設定
- [ ] T字路用の信号制御

---

## 開発上の注意事項

### コーディング規約
- [ ] TypeScriptの厳格モード（strict: true）を使用
- [ ] ESLintの設定（必要に応じて）
- [ ] Prettierの設定（必要に応じて）

### Git運用
- [ ] 機能ごとにコミット
- [ ] わかりやすいコミットメッセージ
- [ ] 適宜Pushして進捗を記録

### ブラウザ対応
- [ ] モダンブラウザ（Chrome, Firefox, Safari, Edge最新版）をターゲット
- [ ] レスポンシブデザイン（オプション）

---

## 完了基準

以下の全てを満たしたら実装完了とします:

- [ ] シミュレーションが正常に動作する
- [ ] UIから全てのパラメータを調整できる
- [ ] Canvas上で可視化が表示される
- [ ] 統計データが正しく計算・表示される
- [ ] データのエクスポートができる
- [ ] テストが通る
- [ ] GitHub Pagesで公開されている
- [ ] README.mdが充実している
- [ ] パフォーマンスが許容範囲内（60fps程度）

---

## レビュー待ち事項

以下の質問（Question 1-5）にご回答いただいた後、実装を開始します。

回答をいただき次第、計画を最終調整して実装フェーズに進みます。

---

**作成者**: Claude Code
**作成日**: 2025-12-03
**ステータス**: ✅ 計画作成完了 - レビュー待ち
