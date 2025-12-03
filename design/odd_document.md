# 交差点信号機シミュレーション - ODDプロトコルドキュメント

## メタ情報

- **プロジェクト名**: 交差点信号機シミュレーション（Traffic Light Simulation）
- **バージョン**: 1.0
- **作成日**: 2025-12-03
- **ODDプロトコルバージョン**: ODD+D (Overview, Design concepts, Details + Decision making)

---

# 第1部: OVERVIEW（概要）

## 1.1 Purpose（目的）

### 1.1.1 シミュレーションの目的

本シミュレーションは、交差点における信号機の切り替えルールを設計・評価するためのエージェントベースモデルです。主要な目的は以下の通りです：

1. **車両の待ち時間削減の検証**
   - 異なる信号サイクルパターンにおける車両の平均待ち時間を測定
   - 最大待ち時間の最小化による利用者満足度の向上

2. **信号制御パラメータの最適化**
   - 固定サイクル方式における各方向の青信号時間の最適配分
   - 黄信号および全赤時間の適切な設定

3. **交差点設計の比較評価**
   - 異なる交差点構造（十字路、T字路など）での交通効率の比較
   - 車線数の変更による影響の分析

### 1.1.2 対象とする問い

このシミュレーションは以下の研究課題に答えることを目指します：

- **Q1**: 固定サイクル方式において、どのような信号サイクルが車両の平均待ち時間を最小化するか？
- **Q2**: 交差点の構造（十字路 vs T字路）は、交通効率にどの程度影響を与えるか？
- **Q3**: 交通量が時間帯によって変化する場合、最適な信号サイクルは異なるか？
- **Q4**: 渋滞長（キューの長さ）と待ち時間の関係性はどのようなものか？

### 1.1.3 期待される成果

- 交通エンジニアや都市計画者が信号制御パラメータを調整するための定量的根拠の提供
- 交差点設計の初期段階での複数案の比較評価ツール
- 信号機制御に関する教育・学習用のインタラクティブなシミュレーションツール

---

## 1.2 Entities, State Variables, and Scales（エンティティ、状態変数、スケール）

### 1.2.1 エンティティの種類

本シミュレーションには以下のエンティティが存在します：

#### (1) Vehicle（車両エージェント）

車両は交差点を通過しようとする個別のエージェントです。

**状態変数：**

| 変数名 | 型 | 説明 | 単位 |
|--------|-----|------|------|
| `id` | string | 車両の一意識別子 | - |
| `position` | {x: number, y: number} | 現在位置（2D座標） | m |
| `velocity` | number | 現在速度 | m/s |
| `acceleration` | number | 加速度 | m/s² |
| `direction` | enum | 進行方向（north, south, east, west） | - |
| `turnIntent` | enum | 進行意図（straight, left, right） | - |
| `lane` | number | 走行車線（0から始まるインデックス） | - |
| `waitTime` | number | 停止開始からの経過時間 | s |
| `totalTravelTime` | number | シミュレーション参加からの総時間 | s |
| `status` | enum | 車両状態（approaching, waiting, crossing, exited） | - |
| `maxSpeed` | number | 最大速度（車両タイプ依存） | m/s |
| `length` | number | 車両長 | m |

**パラメータ：**

- `maxSpeed`: 11.1 m/s（40 km/h）※デフォルト値
- `maxAcceleration`: 2.0 m/s²
- `comfortableDeceleration`: 3.0 m/s²
- `minGap`: 2.0 m（前方車両との最小車間距離）
- `length`: 4.5 m（標準的な乗用車）

#### (2) TrafficLight（信号機エージェント）

各交差点の方向ごとに配置される信号機です。

**状態変数：**

| 変数名 | 型 | 説明 | 単位 |
|--------|-----|------|------|
| `id` | string | 信号機の一意識別子 | - |
| `direction` | enum | 制御する方向（north, south, east, west） | - |
| `currentPhase` | enum | 現在の信号状態（green, yellow, red） | - |
| `timeInPhase` | number | 現在のフェーズに入ってからの経過時間 | s |
| `cyclePosition` | number | サイクル内の位置 | s |
| `controlledLanes` | array | 制御する車線のリスト | - |

**パラメータ（信号サイクル）：**

- `greenDuration`: 30 s（青信号の持続時間）※デフォルト値、調整可能
- `yellowDuration`: 3 s（黄信号の持続時間）
- `redDuration`: 30 s（赤信号の持続時間）※対向方向の青+黄に対応
- `allRedDuration`: 2 s（全赤時間）
- `cycleDuration`: 68 s（1サイクルの合計時間）

#### (3) Intersection（交差点環境）

シミュレーション空間全体と交差点の物理的構造を管理します。

**状態変数：**

| 変数名 | 型 | 説明 | 単位 |
|--------|-----|------|------|
| `type` | enum | 交差点タイプ（fourWay, threeWay） | - |
| `dimensions` | {width: number, height: number} | 交差点の寸法 | m |
| `lanes` | object | 各方向の車線情報 | - |
| `approachLength` | number | 交差点への進入路の長さ | m |
| `spawnRates` | object | 各方向の車両生成率 | vehicles/min |

**パラメータ：**

- `intersectionWidth`: 20 m（交差点中心部の幅）
- `laneWidth`: 3.5 m（1車線の幅）
- `approachLength`: 200 m（シミュレーション領域の各方向の長さ）

### 1.2.2 空間的スケール

**座標系：**
- 2次元デカルト座標系（x, y）
- 原点（0, 0）は交差点の中心
- x軸: 東西方向（東が正）
- y軸: 南北方向（北が正）

**空間範囲：**
- 各方向に交差点中心から200 mまでをシミュレーション領域とする
- 合計範囲: 400 m × 400 m

**交差点構造：**

```
        ↑ North (y+)
        |
   -----+-----
        |
West ---+--- East (x+)
        |
   -----+-----
        |
        ↓ South (y-)
```

**設定可能な交差点タイプ：**

1. **十字路（Four-Way Intersection）**
   - 4方向すべてから車両が進入可能
   - 各方向に1～3車線（設定可能）

2. **T字路（Three-Way Intersection）**
   - 3方向から車両が進入（1方向は閉鎖）
   - 各方向に1～2車線（設定可能）

### 1.2.3 時間的スケール

**タイムステップ：**
- 基本タイムステップ: Δt = 1.0 s（デフォルト）
- 設定可能範囲: 0.1 s ～ 1.0 s
- より精密なシミュレーションには0.1 sを推奨

**シミュレーション期間：**
- 標準実行時間: 10分～30分（600 s ～ 1800 s）
- ウォームアップ期間: 2分（120 s）※統計収集前の安定化期間
- 統計収集期間: 8分～28分（本データ収集期間）

**時間の進行：**
- 離散時間シミュレーション
- 各タイムステップで全エージェントが同期的に更新

---

## 1.3 Process Overview and Scheduling（プロセス概要とスケジューリング）

### 1.3.1 シミュレーションの初期化

シミュレーション開始時に以下の処理を実行します：

1. **環境の初期化**
   - 交差点タイプの設定（ユーザー選択）
   - 車線構成の設定
   - 座標系と空間境界の設定

2. **信号機の初期化**
   - 各方向の信号機を配置
   - 信号サイクルパラメータの設定
   - 初期フェーズの設定（例：南北方向が青、東西方向が赤）

3. **統計データ収集の準備**
   - データ収集用の配列・変数の初期化
   - タイマーのリセット

4. **車両生成の準備**
   - 各方向の車両生成率の設定
   - 乱数シードの設定（再現性のため）

### 1.3.2 メインループ（各タイムステップでの処理）

各タイムステップ t において、以下の順序で処理を実行します：

```
時刻 t におけるステップ:

1. 車両生成フェーズ
   └─> 各方向で確率的に新規車両を生成

2. 信号機更新フェーズ
   └─> 各信号機のフェーズを更新（緑→黄→赤のサイクル進行）

3. 車両行動決定フェーズ（全車両に対して）
   ├─> 前方の信号状態を感知
   ├─> 前方車両との距離を計算
   ├─> 加速・減速・停止を決定
   └─> 進路変更の判定（必要に応じて）

4. 車両位置更新フェーズ（全車両に対して）
   ├─> 速度と位置を更新
   ├─> 交差点通過判定
   └─> シミュレーション領域外への退出判定

5. データ収集フェーズ
   ├─> 各車両の待ち時間を記録
   ├─> 交差点通過台数をカウント
   ├─> 各方向のキュー長を測定
   └─> その他の統計量を更新

6. 可視化更新フェーズ
   └─> 画面描画（GUIモード時）

7. 時刻を進める: t = t + Δt
```

### 1.3.3 詳細な処理フロー

#### フェーズ1: 車両生成

```
For each direction d in [north, south, east, west]:
    If direction d is active:
        Generate random number r ~ Uniform(0, 1)
        If r < (spawnRate[d] * Δt / 60):
            Create new vehicle at entry point of direction d
            Assign random turn intent (straight, left, right) based on probabilities
            Add vehicle to active vehicle list
```

**車両生成パラメータ（デフォルト値）：**
- 生成率: 15 台/分（各方向）
- 直進確率: 0.6
- 左折確率: 0.2
- 右折確率: 0.2

#### フェーズ2: 信号機更新

```
For each traffic light TL:
    TL.timeInPhase += Δt

    If TL.currentPhase == GREEN and TL.timeInPhase >= TL.greenDuration:
        TL.currentPhase = YELLOW
        TL.timeInPhase = 0

    Else If TL.currentPhase == YELLOW and TL.timeInPhase >= TL.yellowDuration:
        TL.currentPhase = RED
        TL.timeInPhase = 0
        Trigger next phase for opposing direction

    Else If TL.currentPhase == RED and TL.timeInPhase >= TL.redDuration:
        Check if all-red period is complete
        If yes:
            TL.currentPhase = GREEN
            TL.timeInPhase = 0
```

**信号機制御ロジック（固定サイクル）：**

十字路の場合の標準サイクル：

```
時間 0-30s:  南北方向 = 緑、東西方向 = 赤
時間 30-33s: 南北方向 = 黄、東西方向 = 赤
時間 33-35s: 全方向 = 赤（全赤時間）
時間 35-65s: 南北方向 = 赤、東西方向 = 緑
時間 65-68s: 南北方向 = 赤、東西方向 = 黄
時間 68-70s: 全方向 = 赤（全赤時間）
時間 70s:    サイクル繰り返し
```

#### フェーズ3: 車両行動決定（Intelligent Driver Model 簡易版）

各車両 v に対して：

```
1. 前方状況の感知
   - 前方車両までの距離 d_front
   - 前方車両の速度 v_front
   - 信号機までの距離 d_signal
   - 信号機の状態 signal_state

2. 目標速度の決定
   If signal_state == RED or signal_state == YELLOW:
       If d_signal < stopping_distance:
           target_speed = 0  # 停止
       Else:
           target_speed = v.maxSpeed
   Else:  # GREEN
       target_speed = v.maxSpeed

3. 前方車両との車間距離維持
   If front vehicle exists:
       safe_gap = v.minGap + v.velocity * T  # T = 1.5s (反応時間)
       If d_front < safe_gap:
           Reduce target_speed based on gap

4. 加速度の計算
   If v.velocity < target_speed:
       acceleration = min(v.maxAcceleration, (target_speed - v.velocity) / Δt)
   Else:
       acceleration = max(-v.comfortableDeceleration, (target_speed - v.velocity) / Δt)

5. 待ち時間の更新
   If v.velocity < 0.5 m/s:  # ほぼ停止状態
       v.waitTime += Δt
```

#### フェーズ4: 車両位置更新

```
For each vehicle v:
    # 速度更新
    v.velocity = max(0, v.velocity + v.acceleration * Δt)
    v.velocity = min(v.maxSpeed, v.velocity)

    # 位置更新（方向に応じて）
    If v.direction == NORTH:
        v.position.y += v.velocity * Δt
    Else If v.direction == SOUTH:
        v.position.y -= v.velocity * Δt
    Else If v.direction == EAST:
        v.position.x += v.velocity * Δt
    Else If v.direction == WEST:
        v.position.x -= v.velocity * Δt

    # 交差点通過判定
    If v is in intersection and v.status == CROSSING:
        If v has exited intersection area:
            v.status = EXITED
            Record statistics for v

    # シミュレーション領域外への退出
    If v is outside simulation boundary:
        Remove v from active vehicle list
        Record final statistics
```

#### フェーズ5: データ収集

```
# ウォームアップ期間後のみ統計を収集
If current_time > warmup_period:

    For each vehicle v in active vehicles:
        If v.status == WAITING:
            total_wait_time += v.waitTime
            max_wait_time = max(max_wait_time, v.waitTime)

    For each direction d:
        queue_length[d] = count vehicles with status WAITING in direction d
        max_queue_length[d] = max(max_queue_length[d], queue_length[d])

    throughput = count of vehicles that exited during this time step
    total_throughput += throughput
```

### 1.3.4 終了条件

シミュレーションは以下のいずれかの条件で終了します：

1. **時間ベース終了**: 設定されたシミュレーション時間に到達（例: 1800 s）
2. **ユーザー中断**: ユーザーが手動で停止ボタンを押下

### 1.3.5 エージェントのスケジューリング順序

**同期更新方式**を採用：
- 各タイムステップで全エージェントが同時に状態を更新
- 更新順序による影響を排除するため、状態の読み取りと書き込みを分離
- すべてのエージェントは前のタイムステップの情報に基づいて行動決定

**処理の並行性：**
- 車両間の行動決定は独立（並行処理可能）
- 信号機の更新は独立
- 統計収集は全更新完了後に実行

---

# 第2部: DESIGN CONCEPTS（設計概念）

## 2.1 Basic Principles（基本原則）

（このセクションは次のステップで作成します）

---

# 第3部: DETAILS（詳細）

## 3.1 Initialization（初期化）

（このセクションは次のステップで作成します）

---

# 付録

## 用語集

- **ODD**: Overview, Design concepts, Details（エージェントベースモデル記述のための標準プロトコル）
- **エージェント**: シミュレーション内で自律的に行動する個体（本モデルでは車両）
- **タイムステップ**: シミュレーションの最小時間単位
- **フェーズ**: 信号機の状態（緑、黄、赤）
- **サイクル**: 信号機が1回の緑→黄→赤の繰り返しを完了する期間

## 参考文献

- Grimm, V., et al. (2006). "A standard protocol for describing individual-based and agent-based models." Ecological Modelling, 198(1-2), 115-126.
- Grimm, V., et al. (2010). "The ODD protocol: A review and first update." Ecological Modelling, 221(23), 2760-2768.
- Treiber, M., Hennecke, A., & Helbing, D. (2000). "Congested traffic states in empirical observations and microscopic simulations." Physical Review E, 62(2), 1805.

---

**ドキュメントステータス**: 第1部（Overview）完成、第2部・第3部は作成中
