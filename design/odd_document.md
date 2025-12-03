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

### 2.1.1 交通工学の理論的基盤

本シミュレーションは以下の交通工学の基本原則に基づいています：

#### (1) 車両追従モデル（Car-Following Model）

**Intelligent Driver Model (IDM) の簡易版を採用：**

車両の加速度は以下の要因によって決定されます：

- **自由流動条件**: 前方に障害がない場合、車両は最大速度まで加速
- **相互作用条件**: 前方車両との安全な車間距離を維持
- **安全停止距離**: 信号機や前方車両に対して適切な減速

数学的表現：

```
a(t) = a_max * [1 - (v/v_max)^δ - (d*/d)^2]

ここで：
- a(t): 時刻tでの加速度
- a_max: 最大加速度
- v: 現在速度
- v_max: 希望速度（最大速度）
- δ: 加速度指数（通常4）
- d: 前方車両までの距離
- d*: 希望車間距離
```

#### (2) 交通流理論

**基本的な交通流の関係式：**

```
Q = k * v

ここで：
- Q: 交通流率（台/時）
- k: 交通密度（台/km）
- v: 平均速度（km/h）
```

本シミュレーションでは、この関係式が創発的に再現されることを確認します。

#### (3) 信号機制御理論

**固定サイクル制御の基本原則：**

- **サイクル長**: 全フェーズを1回ずつ表示するのに要する時間
- **スプリット**: 各フェーズへのサイクル長の配分比
- **オフセット**: 隣接交差点との信号タイミングのずれ（本モデルでは単一交差点のため該当せず）

**Webster法による最適サイクル長の理論式：**

```
C_opt = (1.5L + 5) / (1 - Y)

ここで：
- C_opt: 最適サイクル長（秒）
- L: 全赤時間の合計（秒）
- Y: 飽和度の合計
```

本シミュレーションでは、異なるサイクル長の効果を実験的に検証できます。

#### (4) 待ち行列理論（Queuing Theory）

信号機による車両の待ち行列は **M/D/1 モデル** に近似できます：

- M: マルコフ過程（ポアソン到着）
- D: 決定的（信号サイクルは固定）
- 1: 単一のサービス窓口

**平均待ち時間の理論的推定：**

```
W = (C * (1-λ)^2) / (2 * (1-λ*C))

ここで：
- W: 平均待ち時間
- C: サイクル長
- λ: 到着率
```

### 2.1.2 離散イベントシミュレーションの原則

- **同期更新**: すべてのエージェントが同時に状態を更新
- **時間駆動**: 固定タイムステップで時間が進行
- **決定論的信号制御**: 信号機の動作は完全に予測可能
- **確率的車両生成**: 車両の到着はポアソン過程に従う

### 2.1.3 エージェントベースモデリングの原則

- **自律性**: 各車両は独立した意思決定エージェント
- **局所的相互作用**: 車両は近傍の車両と信号機のみを感知
- **創発性**: 渋滞などのマクロな現象はミクロな相互作用から創発
- **異質性**: 車両ごとにパラメータを変化させることが可能（拡張機能）

---

## 2.2 Emergence（創発）

### 2.2.1 システムレベルで創発する現象

本シミュレーションでは、個々の車両の単純な行動ルールから、以下のようなシステムレベルの現象が創発します：

#### (1) 渋滞の形成と消散（Shockwave）

**創発メカニズム：**

1. 赤信号により交差点手前で車両が停止
2. 後続車両が次々と停止し、待ち行列（キュー）が形成
3. 青信号に変わると、先頭車両から順に発進
4. 発進には反応時間と加速時間が必要なため、後方への波が伝播
5. この「発進波」と「停止波」が交互に発生

**観測される創発パターン：**

- **Shockwave（衝撃波）**: 渋滞の境界が後方に伝播する現象
- **キューの周期的成長と縮小**: 信号サイクルに同期した車両数の変動
- **臨界密度の存在**: ある交通量を超えると急激に待ち時間が増加

#### (2) 交通流の相転移

**創発する交通状態：**

1. **自由流（Free Flow）**
   - 車両密度が低い状態
   - 車両は最大速度で走行可能
   - 待ち時間が最小

2. **同期流（Synchronized Flow）**
   - 中程度の密度
   - 車両が信号サイクルに同期して集団移動
   - 適度な待ち時間

3. **渋滞流（Congested Flow）**
   - 高密度状態
   - 長い待ち行列が形成
   - 複数サイクル待ちが発生

#### (3) 最適化の創発的発見

異なる信号サイクルパラメータの実験により、以下が創発的に明らかになります：

- **最適サイクル長の存在**: 待ち時間を最小化するサイクル長
- **方向別の最適スプリット**: 交通量の非対称性に応じた青時間配分
- **交通量との非線形関係**: 交通量増加に対する待ち時間の非線形応答

### 2.2.2 予測される創発的パターン

シミュレーション実行により、以下のパターンが観察されることが予想されます：

1. **プラトゥーン形成**: 信号により解放された車両が集団で移動
2. **デッドロックの回避**: 適切な全赤時間により交差点内の衝突を防止
3. **公平性の創発**: 長時間待機した方向が優先的に処理される傾向

---

## 2.3 Adaptation（適応）

### 2.3.1 車両エージェントの適応行動

本モデルでは、車両は以下の形で環境に適応します：

#### (1) 速度の適応

```
車両は以下の状況に応じて速度を調整：

1. 信号状態への適応
   - 赤/黄信号を検知 → 減速・停止
   - 青信号を検知 → 加速

2. 前方車両への適応
   - 前方車両が減速 → 追従して減速
   - 前方車両が加速 → 追従して加速
   - 安全な車間距離を維持

3. 交差点への適応
   - 交差点進入時 → 慎重な速度
   - 交差点通過後 → 最大速度まで加速
```

#### (2) 待ち行列への適応

```
車両は待ち行列の状況に応じて行動を調整：

- 長い待ち行列を検知 → 早めに減速開始
- 待ち行列の末尾 → 完全停止
- 待ち行列が動き始める → 順次発進
```

### 2.3.2 信号機の適応（固定サイクル方式）

本バージョンでは固定サイクル方式を採用しているため、信号機自体は適応的に動作しません。

**将来の拡張可能性：**

- 感応式制御: 車両検知器の情報に基づいて青時間を延長
- 適応型制御: 交通量の変化に応じてサイクル長を動的に変更
- 強化学習: 過去のデータから最適な制御パターンを学習

### 2.3.3 適応の時間スケール

- **即時適応**: 速度調整（各タイムステップ）
- **短期適応**: 待ち行列への参加・離脱（数秒～数十秒）
- **長期適応**: 本モデルでは該当なし（固定パラメータ）

---

## 2.4 Objectives（目的）

### 2.4.1 車両エージェントの目的

各車両エージェントは以下の目的を持ちます：

#### (1) 主要目的：交差点の安全な通過

```
目的関数（概念的）:
Objective_primary = Minimize(travel_time)
                   subject to:
                   - 信号遵守
                   - 衝突回避
                   - 安全な車間距離維持
```

#### (2) 副次的目的

- **快適性の維持**: 急加速・急減速を避ける
- **燃料効率**: 不要な加減速を最小化（本モデルでは明示的に実装されていないが、行動に反映）

### 2.4.2 信号制御システムの目的

固定サイクル方式の信号機は、以下の目的で設計されます（設計者の視点）：

```
System_Objective = Minimize(平均待ち時間) + Minimize(最大待ち時間)
                  subject to:
                  - 安全性の確保（全赤時間の設定）
                  - 公平性（各方向に適切な青時間配分）
                  - 実現可能性（サイクル長の制約）
```

#### 多目的最適化の構造

```
目的1: min f₁(C, G) = 平均待ち時間
目的2: min f₂(C, G) = 最大待ち時間
目的3: max f₃(C, G) = スループット
目的4: min f₄(C, G) = 最大キュー長

ここで：
- C: サイクル長
- G: 各方向の青時間ベクトル
```

### 2.4.3 シミュレーションユーザーの目的

シミュレーション利用者は以下を目指します：

1. **最適パラメータの発見**: 待ち時間を最小化する信号サイクルの決定
2. **感度分析**: パラメータ変化が性能に与える影響の理解
3. **比較評価**: 複数の交差点設計案の定量的比較

---

## 2.5 Learning（学習）

### 2.5.1 エージェントの学習

**本モデル（v1.0）では学習機能は実装されていません。**

車両エージェントは固定された行動ルールに従います：

- 過去の経験から学習しない
- 行動パターンは常に同一
- パラメータは時間とともに変化しない

### 2.5.2 将来の拡張可能性

以下の学習メカニズムを将来的に追加可能：

#### (1) 車両の経路学習（多交差点モデルへの拡張時）

```
強化学習アプローチ：
- 状態: 現在位置、目的地、交通状況
- 行動: 経路選択
- 報酬: -待ち時間
- 学習: Q-learning or Deep Q-Network
```

#### (2) 信号制御の学習

```
適応型信号制御：
- 状態: 各方向の待ち車両数、待ち時間
- 行動: 青時間の延長/短縮
- 報酬: -総待ち時間
- 学習: Multi-Agent Reinforcement Learning
```

### 2.5.3 学習の時間スケール

現バージョンでは該当なし。将来の実装では：

- エピソード学習: 各シミュレーション実行を1エピソードとする
- バッチ学習: 複数の実行結果から学習
- オンライン学習: シミュレーション実行中にリアルタイムで学習

---

## 2.6 Prediction（予測）

### 2.6.1 車両エージェントの予測能力

車両は以下の限定的な予測を行います：

#### (1) 停止距離の予測

```
予測アルゴリズム：

1. 現在の速度 v と減速度 a から停止距離 d を計算:
   d = v² / (2 * a)

2. 信号機までの距離 d_signal と比較:
   If d < d_signal:
       判断: 信号前で安全に停止可能
   Else:
       判断: 交差点を通過すべき（黄信号のジレンマゾーン）
```

#### (2) 前方車両の動きの予測

```
簡易予測モデル：

前方車両が等速度運動を続けると仮定:
predicted_position(t+Δt) = current_position + velocity * Δt
predicted_gap(t+Δt) = predicted_position - own_position
```

#### (3) 信号変化の予測

本モデルでは、車両は信号の変化タイミングを予測しません：

- 現在の信号状態のみを認識
- 「あと何秒で青になるか」は知らない
- これは現実的なドライバーの行動に近い

**将来の拡張：**

```
信号カウントダウン表示の実装：
- 残り時間の表示
- 車両が残り時間を考慮した行動を選択
- 発進準備行動の実装
```

### 2.6.2 シミュレーションシステムの予測

シミュレーションは以下を予測・推定します：

#### (1) 統計的予測

```
実行中に以下を推定：
- 現在の交通量が続いた場合の平均待ち時間
- 渋滞の発生確率
- サイクルあたりの平均通過台数
```

#### (2) 決定論的予測

```
信号機の動作は完全に予測可能：
- 次のフェーズ変化タイミング
- サイクルの完了時刻
- 各方向の青信号順序
```

---

## 2.7 Sensing（感知）

### 2.7.1 車両エージェントの感知能力

各車両は以下の情報を感知できます：

#### (1) 視覚範囲と感知距離

```
感知可能な情報：

1. 前方車両
   - 感知距離: 100 m
   - 取得情報: 位置、速度、加速度
   - 精度: 完全（本モデルでは誤差なし）

2. 信号機
   - 感知距離: 200 m（進入路全体）
   - 取得情報: 現在のフェーズ（緑/黄/赤）
   - 精度: 完全

3. 交差点構造
   - 感知範囲: 無制限（事前知識として保持）
   - 取得情報: 交差点の位置、サイズ、車線構成
```

#### (2) 感知の制限

**本モデルでは実装されていない制限（現実的には存在）：**

- 視界の遮蔽（前方車両による信号の隠れ）
- 悪天候による視認性低下
- 夜間の視界制限
- 認識遅れ・誤認識

**将来の拡張可能性：**

```
realistic_sensing = {
    "fog_factor": 0.0-1.0,  // 視界の悪化
    "attention_level": 0.0-1.0,  // 注意レベル
    "reaction_delay": 0.5-2.0 s,  // 反応遅れ
    "sensing_noise": Gaussian(0, σ)  // 感知ノイズ
}
```

### 2.7.2 信号機の感知能力（固定サイクル方式）

固定サイクル方式では、信号機は外部情報を感知しません：

- 車両の存在を検知しない
- 待ち行列の長さを測定しない
- 予め設定されたスケジュールに従うのみ

**参考：感応式制御での感知（将来の拡張）：**

```
detector_types = {
    "loop_detector": {
        "location": "停止線の手前50m",
        "detection": "車両の通過を検知",
        "output": "パルス信号"
    },
    "camera_detector": {
        "location": "交差点上空",
        "detection": "待ち行列長を測定",
        "output": "車両数、待ち行列長"
    }
}
```

### 2.7.3 シミュレーションシステムの観測

シミュレーションシステムは全知の視点を持ちます：

```
Observable_State = {
    "all_vehicles": {
        "position": [x, y],
        "velocity": v,
        "wait_time": t,
        "status": state
    },
    "all_traffic_lights": {
        "phase": current_phase,
        "time_in_phase": t
    },
    "queue_lengths": [n1, n2, n3, n4],
    "throughput": vehicles_per_cycle,
    "statistics": {...}
}
```

---

## 2.8 Interaction（相互作用）

### 2.8.1 エージェント間の相互作用

#### (1) 車両-車両相互作用

**直接的相互作用：車両追従**

```
相互作用メカニズム：

前方車両の状態 → 自車両の行動決定

If distance_to_front_vehicle < safe_gap:
    自車両は減速
    acceleration = -deceleration

If front_vehicle.velocity < own.velocity:
    自車両は速度を合わせる
    target_velocity = front_vehicle.velocity
```

**数学的表現（簡易版IDM）：**

```
d* = d_min + v*T + (v*Δv) / (2*√(a*b))

ここで：
- d*: 希望車間距離
- d_min: 最小車間距離 (2m)
- T: 反応時間 (1.5s)
- v: 自車速度
- Δv: 速度差 (v - v_front)
- a: 最大加速度
- b: 快適減速度
```

**間接的相互作用：集団効果**

- 複数車両による待ち行列形成
- プラトゥーン（車両集団）の形成
- 渋滞の伝播

#### (2) 車両-信号機相互作用

**一方向的相互作用（信号機 → 車両）：**

```
信号機の状態が車両の行動を制約：

Signal_State = GREEN:
    車両: 通過可能
    行動: 加速して交差点を通過

Signal_State = YELLOW:
    車両: ジレンマゾーン判定
    行動:
        If 停止可能:
            減速・停止
        Else:
            交差点を通過

Signal_State = RED:
    車両: 停止線で停止
    行動: 減速・停止・待機
```

**固定サイクル方式では車両から信号機への相互作用は存在しません。**

#### (3) 車両-環境相互作用

```
環境要素との相互作用：

1. 停止線との相互作用
   - 車両は停止線を越えて停止しない
   - 停止線位置: 交差点の手前5m

2. 車線との相互作用
   - 車両は指定車線内を走行
   - 本モデルでは車線変更なし

3. 交差点境界との相互作用
   - 交差点内では速度を調整
   - 右折・左折時の軌道計算
```

### 2.8.2 相互作用のネットワーク構造

```
相互作用グラフ：

車両1 ←→ 車両2 ←→ 車両3 ... (追従関係)
  ↓        ↓        ↓
信号機N  信号機E  信号機S  信号機W
  ↓        ↓        ↓        ↓
       交差点管理システム
              ↓
        シミュレーション統計
```

### 2.8.3 相互作用の時間的特性

- **同期的相互作用**: 各タイムステップで同時に評価
- **遅延**: 車両の反応時間を考慮（T = 1.5s）
- **伝播速度**: 渋滞波の伝播速度（約15-20 km/h）

### 2.8.4 衝突回避メカニズム

```
階層的な安全確保：

レベル1: 信号機制御
    - 全赤時間の設定により交差点内の衝突を防止

レベル2: 車間距離維持
    - 最小車間距離の強制 (d_min = 2m)

レベル3: 速度制約
    - 前方車両より速く走行しない

レベル4: 位置検証（フェイルセーフ）
    - 各ステップで位置の重複をチェック
    - 重複検出時は強制的に位置を調整
```

---

## 2.9 Stochasticity（確率性）

### 2.9.1 確率的要素の特定

本シミュレーションには以下の確率的要素が含まれます：

#### (1) 車両の到着（ポアソン過程）

```
確率的車両生成：

各タイムステップ、各方向dで：
    r ~ Uniform(0, 1)  // 一様乱数
    If r < (λ_d * Δt):
        新規車両を生成

ここで：
- λ_d: 方向dの平均到着率（台/秒）
- Δt: タイムステップ（秒）

パラメータ例：
- λ_d = 15台/分 = 0.25台/秒
- Δt = 1秒の場合、生成確率 = 0.25
```

**統計的性質：**

```
到着間隔 T ~ Exponential(λ)
P(T > t) = exp(-λt)

平均到着間隔 = 1/λ = 4秒（15台/分の場合）
```

#### (2) 進行方向の決定

```
各車両の進行意図（直進/左折/右折）をランダムに決定：

turn_intent = random.choice(
    ['straight', 'left', 'right'],
    p=[p_straight, p_left, p_right]
)

デフォルト確率：
- p_straight = 0.6（60%が直進）
- p_left = 0.2（20%が左折）
- p_right = 0.2（20%が右折）
```

#### (3) 車両パラメータのばらつき（オプション）

```
将来の拡張：異質な車両の実装

max_speed ~ Normal(μ=40 km/h, σ=5 km/h)
reaction_time ~ Normal(μ=1.5 s, σ=0.3 s)
aggressiveness ~ Uniform(0.8, 1.2)  // 加速度の係数
```

### 2.9.2 決定論的要素

以下の要素は完全に決定論的です：

```
決定論的プロセス：

1. 信号機の動作
   - 固定されたサイクルに従う
   - ランダム性なし

2. 車両の物理運動
   - 位置更新: x(t+Δt) = x(t) + v*Δt
   - 速度更新: v(t+Δt) = v(t) + a*Δt
   - 決定論的な運動方程式

3. 衝突回避ロジック
   - 確定的な判定基準
```

### 2.9.3 乱数生成と再現性

#### (1) 乱数生成器の設定

```javascript
// 疑似コード
class Simulation {
    constructor(seed) {
        this.rng = new Random(seed);  // シード固定
    }

    generateVehicle() {
        let r = this.rng.random();  // 0-1の一様乱数
        if (r < this.spawnProbability) {
            // 車両生成
        }
    }
}
```

#### (2) 再現性の確保

```
同一シードによる再現：

Simulation_A(seed=123) = Simulation_B(seed=123)
→ 完全に同じ結果が得られる

異なるシードによる統計的分析：

results = []
for seed in [1, 2, 3, ..., 100]:
    sim = Simulation(seed)
    result = sim.run()
    results.append(result)

mean_wait_time = mean(results)
confidence_interval = stats.t_test(results)
```

### 2.9.4 確率分布の選択理由

#### (1) ポアソン到着の妥当性

```
理由：
- 交通工学で広く使用される標準モデル
- 車両の到着が独立事象と仮定
- 実測データとの適合性が高い

検証方法：
- シミュレーション結果の到着間隔分布を分析
- 指数分布との適合度検定
```

#### (2) 一様分布の使用

```
進行方向の決定に一様乱数を使用：
- 単純で実装が容易
- カテゴリカル分布への変換が直接的
- 計算コストが低い
```

---

## 2.10 Observation（観察）

### 2.10.1 データ収集方法

シミュレーションは以下のデータを収集します：

#### (1) 個別車両データ

```
各車両について記録：

vehicle_data = {
    "id": unique_id,
    "entry_time": t_enter,
    "exit_time": t_exit,
    "total_travel_time": t_exit - t_enter,
    "wait_time": 総停止時間,
    "direction": 進入方向,
    "turn_intent": 進行意図,
    "max_speed_achieved": 到達最高速度
}
```

#### (2) 時系列データ（タイムステップごと）

```
各タイムステップtで記録：

timestep_data[t] = {
    "time": t,
    "active_vehicles": 活動中の車両数,
    "queue_lengths": {
        "north": キュー長（台数）,
        "south": キュー長,
        "east": キュー長,
        "west": キュー長
    },
    "signal_states": {
        "north": フェーズ,
        "south": フェーズ,
        "east": フェーズ,
        "west": フェーズ
    },
    "throughput": このステップで退出した車両数
}
```

#### (3) 集計統計データ

```
シミュレーション全体で計算：

statistics = {
    "total_vehicles": 生成された総車両数,
    "completed_vehicles": 交差点を通過した車両数,

    "wait_time": {
        "mean": 平均待ち時間,
        "median": 中央値,
        "std": 標準偏差,
        "min": 最小値,
        "max": 最大値,
        "percentile_90": 90パーセンタイル
    },

    "queue_length": {
        "mean": 平均キュー長,
        "max": 最大キュー長,
        "by_direction": 方向別統計
    },

    "throughput": {
        "total": 総通過台数,
        "per_minute": 毎分の通過台数,
        "per_cycle": サイクルあたりの通過台数
    },

    "travel_time": {
        "mean": 平均移動時間,
        "max": 最大移動時間
    }
}
```

### 2.10.2 観測の空間的・時間的粒度

#### (1) 空間的粒度

```
観測ポイント：

1. 交差点中心（原点）
2. 各方向の停止線位置
3. 各方向の進入路の端（境界）
4. 交差点内の4つのエリア

位置精度：0.1 m（座標の精度）
```

#### (2) 時間的粒度

```
データ収集頻度：

- 高頻度データ: 各タイムステップ（Δt = 1秒）
- 集計データ: シミュレーション終了時
- イベントベース: 車両の生成・退出時

ウォームアップ期間：
- 最初の2分（120秒）はデータから除外
- 統計的定常状態に達するのを待つ
```

### 2.10.3 出力データフォーマット

#### (1) JSON形式での出力

```json
{
    "simulation_metadata": {
        "seed": 12345,
        "duration": 1800,
        "time_step": 1.0,
        "intersection_type": "fourWay",
        "signal_cycle": 70,
        "warmup_period": 120
    },

    "parameters": {
        "spawn_rates": {"north": 15, "south": 15, "east": 15, "west": 15},
        "green_durations": {"north_south": 30, "east_west": 30},
        "yellow_duration": 3,
        "all_red_duration": 2
    },

    "results": {
        "statistics": {...},
        "timeseries": [...],
        "vehicles": [...]
    }
}
```

#### (2) CSV形式での出力

```csv
# 時系列データ
time,queue_north,queue_south,queue_east,queue_west,throughput
0,0,0,0,0,0
1,1,0,1,0,0
2,2,1,1,1,0
...

# 車両データ
vehicle_id,entry_time,exit_time,wait_time,direction,turn_intent
v001,5.0,45.2,12.3,north,straight
v002,7.2,52.1,18.5,south,left
...
```

### 2.10.4 可視化出力

#### (1) リアルタイム可視化

```
GUI表示要素：

1. 交差点の俯瞰図
   - 道路・車線の描画
   - 車両の位置（矩形で表示）
   - 信号機の状態（色で表示）

2. リアルタイムグラフ
   - 各方向のキュー長の時系列
   - 累積通過台数
   - 現在の平均待ち時間

3. 情報パネル
   - シミュレーション時刻
   - 現在の統計値
   - パラメータ設定
```

#### (2) 結果の可視化

```
事後分析用のグラフ：

1. 待ち時間分布のヒストグラム
2. キュー長の時系列プロット
3. スループットの時系列プロット
4. 方向別の統計比較（箱ひげ図）
5. パラメータ感度分析（散布図）
```

### 2.10.5 観測データの用途

#### (1) モデル検証

```
検証項目：
- 交通流理論との整合性
- 待ち行列理論との比較
- 実測データとの照合（可能な場合）
```

#### (2) 最適化

```
最適化アルゴリズム：
1. グリッドサーチ
   - サイクル長を変化させて最適値を探索

2. パラメータスイープ
   - 複数パラメータの組み合わせを網羅的に試行

3. メタヒューリスティクス（将来の拡張）
   - 遺伝的アルゴリズム
   - シミュレーテッドアニーリング
```

#### (3) 意思決定支援

```
レポート生成：
- 複数の設計案の比較表
- 推奨パラメータの提示
- トレードオフの可視化（パレートフロント）
```

---

# 第3部: DETAILS（詳細）

## 3.1 Initialization（初期化）

### 3.1.1 シミュレーション開始時の初期状態

シミュレーションは以下の手順で初期化されます：

#### ステップ1: パラメータ設定の読み込み

```javascript
// 初期化パラメータの構造

initialization_parameters = {
    // シミュレーション設定
    "simulation": {
        "duration": 1800,  // 秒
        "time_step": 1.0,  // 秒
        "warmup_period": 120,  // 秒
        "random_seed": 42  // 再現性のため
    },

    // 交差点設定
    "intersection": {
        "type": "fourWay",  // "fourWay" or "threeWay"
        "width": 20,  // m
        "approach_length": 200,  // m
        "lane_width": 3.5,  // m
        "num_lanes": {
            "north": 2,
            "south": 2,
            "east": 2,
            "west": 2
        }
    },

    // 信号機設定
    "traffic_signals": {
        "cycle_length": 70,  // 秒
        "green_duration": {
            "north_south": 30,  // 秒
            "east_west": 30  // 秒
        },
        "yellow_duration": 3,  // 秒
        "all_red_duration": 2,  // 秒
        "initial_phase": {
            "north_south": "green",
            "east_west": "red"
        }
    },

    // 車両生成設定
    "vehicle_generation": {
        "spawn_rates": {  // 台/分
            "north": 15,
            "south": 15,
            "east": 15,
            "west": 15
        },
        "turn_probabilities": {
            "straight": 0.6,
            "left": 0.2,
            "right": 0.2
        }
    },

    // 車両パラメータ
    "vehicle_defaults": {
        "max_speed": 11.1,  // m/s (40 km/h)
        "max_acceleration": 2.0,  // m/s²
        "comfortable_deceleration": 3.0,  // m/s²
        "min_gap": 2.0,  // m
        "reaction_time": 1.5,  // s
        "length": 4.5  // m
    }
}
```

#### ステップ2: 環境オブジェクトの生成

```javascript
// 疑似コード

function initializeEnvironment(params) {
    // 交差点オブジェクトの作成
    intersection = new Intersection({
        type: params.intersection.type,
        width: params.intersection.width,
        approachLength: params.intersection.approach_length,
        laneWidth: params.intersection.lane_width
    });

    // 各方向の道路を作成
    for (direction of ["north", "south", "east", "west"]) {
        if (intersection.type === "threeWay" && direction === "west") {
            continue;  // T字路の場合、westは存在しない
        }

        road = new Road({
            direction: direction,
            numLanes: params.intersection.num_lanes[direction],
            length: params.intersection.approach_length,
            laneWidth: params.intersection.lane_width
        });

        intersection.addRoad(direction, road);
    }

    return intersection;
}
```

#### ステップ3: 信号機の初期化

```javascript
function initializeTrafficLights(params) {
    trafficLights = {};

    // 南北方向の信号機グループ
    trafficLights["north"] = new TrafficLight({
        id: "TL_north",
        direction: "north",
        position: {x: 0, y: params.intersection.width / 2},
        initialPhase: params.traffic_signals.initial_phase.north_south,
        greenDuration: params.traffic_signals.green_duration.north_south,
        yellowDuration: params.traffic_signals.yellow_duration,
        allRedDuration: params.traffic_signals.all_red_duration
    });

    trafficLights["south"] = new TrafficLight({
        id: "TL_south",
        direction: "south",
        position: {x: 0, y: -params.intersection.width / 2},
        initialPhase: params.traffic_signals.initial_phase.north_south,
        greenDuration: params.traffic_signals.green_duration.north_south,
        yellowDuration: params.traffic_signals.yellow_duration,
        allRedDuration: params.traffic_signals.all_red_duration
    });

    // 東西方向の信号機グループ
    trafficLights["east"] = new TrafficLight({
        id: "TL_east",
        direction: "east",
        position: {x: params.intersection.width / 2, y: 0},
        initialPhase: params.traffic_signals.initial_phase.east_west,
        greenDuration: params.traffic_signals.green_duration.east_west,
        yellowDuration: params.traffic_signals.yellow_duration,
        allRedDuration: params.traffic_signals.all_red_duration
    });

    trafficLights["west"] = new TrafficLight({
        id: "TL_west",
        direction: "west",
        position: {x: -params.intersection.width / 2, y: 0},
        initialPhase: params.traffic_signals.initial_phase.east_west,
        greenDuration: params.traffic_signals.green_duration.east_west,
        yellowDuration: params.traffic_signals.yellow_duration,
        allRedDuration: params.traffic_signals.all_red_duration
    });

    return trafficLights;
}
```

#### ステップ4: データ収集システムの初期化

```javascript
function initializeDataCollector() {
    return {
        // 車両データ
        vehicles: [],

        // 時系列データ
        timeseries: [],

        // 集計統計
        statistics: {
            totalVehicles: 0,
            completedVehicles: 0,
            waitTimes: [],
            travelTimes: [],
            queueLengths: {north: [], south: [], east: [], west: []}
        },

        // 現在のタイムステップデータ
        current: {
            time: 0,
            activeVehicles: 0,
            queueLengths: {north: 0, south: 0, east: 0, west: 0},
            throughput: 0
        }
    };
}
```

#### ステップ5: 乱数生成器の初期化

```javascript
function initializeRandomGenerator(seed) {
    // シード固定の疑似乱数生成器
    return new SeededRandom(seed);
}
```

### 3.1.2 初期車両の配置

**デフォルト設定：初期車両なし**

```
シミュレーション開始時の状態：
- すべての道路は空（車両なし）
- 信号機は初期フェーズ（南北=緑、東西=赤）
- 車両は時間進行とともに確率的に生成される

理由：
- ウォームアップ期間を設けて定常状態に達するまで待つ
- 任意の初期配置による偏りを避ける
```

**オプション：初期車両の配置（将来の拡張）**

```javascript
// 特定の交通状況から開始したい場合

function placeInitialVehicles(params) {
    initialVehicles = [];

    for (direction of ["north", "south", "east", "west"]) {
        // 各方向に一定間隔で車両を配置
        numInitial = params.initial_vehicles[direction];
        spacing = 10;  // m

        for (i = 0; i < numInitial; i++) {
            vehicle = new Vehicle({
                id: `init_${direction}_${i}`,
                direction: direction,
                position: getPositionOnRoad(direction, i * spacing),
                velocity: 0,  // 停止状態から開始
                lane: 0
            });

            initialVehicles.push(vehicle);
        }
    }

    return initialVehicles;
}
```

### 3.1.3 初期化の完全な手順

```javascript
// メイン初期化関数

function initialize(configFile) {
    // 1. 設定ファイルの読み込み
    params = loadConfiguration(configFile);

    // 2. 乱数生成器の初期化
    rng = initializeRandomGenerator(params.simulation.random_seed);

    // 3. 環境の構築
    intersection = initializeEnvironment(params);

    // 4. 信号機の配置
    trafficLights = initializeTrafficLights(params);

    // 5. データ収集システムの準備
    dataCollector = initializeDataCollector();

    // 6. 車両リストの初期化
    activeVehicles = [];

    // 7. 車両生成器の初期化
    vehicleGenerator = new VehicleGenerator({
        rng: rng,
        spawnRates: params.vehicle_generation.spawn_rates,
        turnProbabilities: params.vehicle_generation.turn_probabilities,
        vehicleDefaults: params.vehicle_defaults
    });

    // 8. タイマーの初期化
    currentTime = 0;
    nextVehicleId = 1;

    // 9. 可視化システムの初期化（GUIモードの場合）
    if (params.gui_enabled) {
        renderer = initializeRenderer(intersection, params);
    }

    // 10. 初期化完了のログ
    console.log("Simulation initialized successfully");
    console.log(`Seed: ${params.simulation.random_seed}`);
    console.log(`Duration: ${params.simulation.duration}s`);
    console.log(`Intersection type: ${params.intersection.type}`);

    return {
        params,
        rng,
        intersection,
        trafficLights,
        dataCollector,
        activeVehicles,
        vehicleGenerator,
        currentTime,
        renderer
    };
}
```

---

## 3.2 Input Data（入力データ）

### 3.2.1 外部データソース

本シミュレーションは基本的に **自己完結型** であり、実行時に外部データを必要としません。

#### (1) 必須入力データ：なし

シミュレーションはパラメータのみで実行可能です。

#### (2) オプション入力データ

以下のデータを外部から読み込むことが可能（将来の拡張）：

```
1. 実測交通量データ
   - 形式: CSV, JSON
   - 内容: 時間帯別の車両到着率
   - 例: traffic_data.csv

2. 信号サイクルパターン
   - 形式: JSON
   - 内容: 複数の信号制御パターン
   - 例: signal_patterns.json

3. 交差点ジオメトリ
   - 形式: JSON, GeoJSON
   - 内容: 実際の交差点の座標・形状データ
   - 例: intersection_geometry.json
```

### 3.2.2 入力パラメータの一覧

#### (1) シミュレーション制御パラメータ

| パラメータ名 | 型 | デフォルト値 | 範囲 | 説明 |
|------------|-----|------------|------|------|
| `duration` | number | 1800 | 60-7200 | シミュレーション時間（秒） |
| `time_step` | number | 1.0 | 0.1-1.0 | タイムステップ（秒） |
| `warmup_period` | number | 120 | 0-600 | ウォームアップ期間（秒） |
| `random_seed` | integer | 42 | 任意 | 乱数シード |
| `gui_enabled` | boolean | true | true/false | GUI表示の有無 |

#### (2) 交差点パラメータ

| パラメータ名 | 型 | デフォルト値 | 範囲 | 説明 |
|------------|-----|------------|------|------|
| `intersection_type` | enum | "fourWay" | fourWay/threeWay | 交差点タイプ |
| `intersection_width` | number | 20 | 10-50 | 交差点幅（m） |
| `approach_length` | number | 200 | 100-500 | 進入路長（m） |
| `lane_width` | number | 3.5 | 3.0-4.0 | 車線幅（m） |
| `num_lanes_north` | integer | 2 | 1-3 | 北方向車線数 |
| `num_lanes_south` | integer | 2 | 1-3 | 南方向車線数 |
| `num_lanes_east` | integer | 2 | 1-3 | 東方向車線数 |
| `num_lanes_west` | integer | 2 | 1-3 | 西方向車線数 |

#### (3) 信号機パラメータ

| パラメータ名 | 型 | デフォルト値 | 範囲 | 説明 |
|------------|-----|------------|------|------|
| `green_duration_ns` | number | 30 | 10-90 | 南北青時間（秒） |
| `green_duration_ew` | number | 30 | 10-90 | 東西青時間（秒） |
| `yellow_duration` | number | 3 | 2-5 | 黄時間（秒） |
| `all_red_duration` | number | 2 | 1-5 | 全赤時間（秒） |

#### (4) 車両生成パラメータ

| パラメータ名 | 型 | デフォルト値 | 範囲 | 説明 |
|------------|-----|------------|------|------|
| `spawn_rate_north` | number | 15 | 0-60 | 北方向生成率（台/分） |
| `spawn_rate_south` | number | 15 | 0-60 | 南方向生成率（台/分） |
| `spawn_rate_east` | number | 15 | 0-60 | 東方向生成率（台/分） |
| `spawn_rate_west` | number | 15 | 0-60 | 西方向生成率（台/分） |
| `prob_straight` | number | 0.6 | 0-1 | 直進確率 |
| `prob_left` | number | 0.2 | 0-1 | 左折確率 |
| `prob_right` | number | 0.2 | 0-1 | 右折確率 |

#### (5) 車両行動パラメータ

| パラメータ名 | 型 | デフォルト値 | 範囲 | 説明 |
|------------|-----|------------|------|------|
| `max_speed` | number | 11.1 | 5-20 | 最大速度（m/s） |
| `max_acceleration` | number | 2.0 | 1.0-4.0 | 最大加速度（m/s²） |
| `comfortable_deceleration` | number | 3.0 | 2.0-5.0 | 快適減速度（m/s²） |
| `min_gap` | number | 2.0 | 1.0-5.0 | 最小車間距離（m） |
| `reaction_time` | number | 1.5 | 0.5-3.0 | 反応時間（s） |
| `vehicle_length` | number | 4.5 | 3.0-6.0 | 車両長（m） |

### 3.2.3 入力データのフォーマット

#### (1) 設定ファイル（JSON形式）

```json
{
    "simulation": {
        "duration": 1800,
        "time_step": 1.0,
        "warmup_period": 120,
        "random_seed": 42,
        "gui_enabled": true
    },
    "intersection": {
        "type": "fourWay",
        "width": 20,
        "approach_length": 200,
        "lane_width": 3.5,
        "num_lanes": {
            "north": 2,
            "south": 2,
            "east": 2,
            "west": 2
        }
    },
    "traffic_signals": {
        "green_duration": {
            "north_south": 30,
            "east_west": 30
        },
        "yellow_duration": 3,
        "all_red_duration": 2
    },
    "vehicle_generation": {
        "spawn_rates": {
            "north": 15,
            "south": 15,
            "east": 15,
            "west": 15
        },
        "turn_probabilities": {
            "straight": 0.6,
            "left": 0.2,
            "right": 0.2
        }
    },
    "vehicle_defaults": {
        "max_speed": 11.1,
        "max_acceleration": 2.0,
        "comfortable_deceleration": 3.0,
        "min_gap": 2.0,
        "reaction_time": 1.5,
        "length": 4.5
    }
}
```

#### (2) 外部交通量データ（オプション）

```csv
# traffic_pattern.csv
time_period,direction,vehicles_per_minute
0-600,north,10
0-600,south,10
0-600,east,10
0-600,west,10
600-1200,north,20
600-1200,south,20
600-1200,east,15
600-1200,west,15
1200-1800,north,15
1200-1800,south,15
1200-1800,east,12
1200-1800,west,12
```

### 3.2.4 パラメータの検証

```javascript
function validateParameters(params) {
    errors = [];

    // サイクル長の整合性チェック
    cycleLengthCalculated =
        params.traffic_signals.green_duration.north_south +
        params.traffic_signals.yellow_duration +
        params.traffic_signals.all_red_duration +
        params.traffic_signals.green_duration.east_west +
        params.traffic_signals.yellow_duration +
        params.traffic_signals.all_red_duration;

    // 進行確率の合計チェック
    probSum =
        params.vehicle_generation.turn_probabilities.straight +
        params.vehicle_generation.turn_probabilities.left +
        params.vehicle_generation.turn_probabilities.right;

    if (Math.abs(probSum - 1.0) > 0.001) {
        errors.push("Turn probabilities must sum to 1.0");
    }

    // 生成率の妥当性チェック
    for (direction of ["north", "south", "east", "west"]) {
        rate = params.vehicle_generation.spawn_rates[direction];
        if (rate < 0 || rate > 60) {
            errors.push(`Spawn rate for ${direction} must be between 0 and 60`);
        }
    }

    // エラーがあれば例外を投げる
    if (errors.length > 0) {
        throw new ValidationError(errors.join("; "));
    }

    return true;
}
```

---

## 3.3 Submodels（サブモデル）

### 3.3.1 車両移動サブモデル

このサブモデルは車両の物理的な移動を計算します。

#### アルゴリズム：

```
入力:
- vehicle: 車両オブジェクト
- dt: タイムステップ
- frontVehicle: 前方車両（存在する場合）
- trafficLight: 対応する信号機

出力:
- 更新された車両の位置と速度

手順:
1. 目標速度の決定
   targetSpeed = determineTargetSpeed(vehicle, trafficLight, frontVehicle)

2. 加速度の計算
   acceleration = calculateAcceleration(vehicle, targetSpeed, frontVehicle)

3. 速度の更新
   newVelocity = vehicle.velocity + acceleration * dt
   newVelocity = clamp(newVelocity, 0, vehicle.maxSpeed)

4. 位置の更新
   displacement = newVelocity * dt
   newPosition = vehicle.position + getDirectionVector(vehicle.direction) * displacement

5. 状態の更新
   vehicle.velocity = newVelocity
   vehicle.position = newPosition
   vehicle.totalDistance += displacement
```

#### 詳細な実装：

```javascript
function updateVehiclePosition(vehicle, dt, frontVehicle, trafficLight) {
    // 1. 目標速度の決定
    let targetSpeed = vehicle.maxSpeed;

    // 信号機の影響
    const distanceToSignal = calculateDistance(vehicle.position, trafficLight.position);
    const stoppingDistance = (vehicle.velocity ** 2) / (2 * vehicle.comfortableDeceleration);

    if (trafficLight.phase === "red" || trafficLight.phase === "yellow") {
        if (distanceToSignal < stoppingDistance + 10) {
            targetSpeed = 0;  // 停止
        }
    }

    // 前方車両の影響
    if (frontVehicle !== null) {
        const gap = calculateGap(vehicle, frontVehicle);
        const safeGap = vehicle.minGap + vehicle.velocity * vehicle.reactionTime;

        if (gap < safeGap) {
            targetSpeed = Math.min(targetSpeed, frontVehicle.velocity);
        }
    }

    // 2. 加速度の計算（IDM簡易版）
    let acceleration;

    if (vehicle.velocity < targetSpeed) {
        // 加速
        acceleration = vehicle.maxAcceleration * (1 - (vehicle.velocity / vehicle.maxSpeed) ** 4);
    } else {
        // 減速
        acceleration = -vehicle.comfortableDeceleration;
    }

    // 前方車両との相互作用
    if (frontVehicle !== null) {
        const gap = calculateGap(vehicle, frontVehicle);
        const desiredGap = vehicle.minGap + vehicle.velocity * vehicle.reactionTime;

        if (gap < desiredGap) {
            const brakingTerm = -vehicle.comfortableDeceleration * (desiredGap / gap) ** 2;
            acceleration = Math.min(acceleration, brakingTerm);
        }
    }

    // 3. 速度の更新
    vehicle.velocity += acceleration * dt;
    vehicle.velocity = Math.max(0, Math.min(vehicle.maxSpeed, vehicle.velocity));

    // 4. 位置の更新
    const displacement = vehicle.velocity * dt;
    const directionVector = getDirectionVector(vehicle.direction);

    vehicle.position.x += directionVector.x * displacement;
    vehicle.position.y += directionVector.y * displacement;

    // 5. 待ち時間の更新
    if (vehicle.velocity < 0.5) {  // ほぼ停止
        vehicle.waitTime += dt;
    }

    // 6. 総移動時間の更新
    vehicle.totalTravelTime += dt;
}

function getDirectionVector(direction) {
    const vectors = {
        "north": {x: 0, y: 1},
        "south": {x: 0, y: -1},
        "east": {x: 1, y: 0},
        "west": {x: -1, y: 0}
    };
    return vectors[direction];
}

function calculateGap(vehicle, frontVehicle) {
    const distance = calculateDistance(vehicle.position, frontVehicle.position);
    return distance - frontVehicle.length;
}
```

### 3.3.2 信号制御サブモデル

固定サイクル方式の信号制御ロジックです。

#### アルゴリズム：

```
入力:
- trafficLight: 信号機オブジェクト
- dt: タイムステップ

出力:
- 更新された信号機の状態

手順:
1. 現在のフェーズ時間を進める
   trafficLight.timeInPhase += dt

2. フェーズ転移の判定
   If trafficLight.phase == "green" and trafficLight.timeInPhase >= trafficLight.greenDuration:
       trafficLight.phase = "yellow"
       trafficLight.timeInPhase = 0

   Else If trafficLight.phase == "yellow" and trafficLight.timeInPhase >= trafficLight.yellowDuration:
       trafficLight.phase = "red"
       trafficLight.timeInPhase = 0
       対向方向の信号をトリガー

   Else If trafficLight.phase == "red" and 対向方向の青・黄が完了:
       全赤時間をチェック
       If 全赤時間 >= allRedDuration:
           trafficLight.phase = "green"
           trafficLight.timeInPhase = 0
```

#### 詳細な実装：

```javascript
class TrafficLightController {
    constructor(trafficLights, config) {
        this.lights = trafficLights;
        this.config = config;
        this.cyclePosition = 0;

        // フェーズスケジュールの定義
        this.schedule = this.buildSchedule();
    }

    buildSchedule() {
        const g_ns = this.config.green_duration.north_south;
        const g_ew = this.config.green_duration.east_west;
        const y = this.config.yellow_duration;
        const ar = this.config.all_red_duration;

        return [
            {start: 0, end: g_ns, ns: "green", ew: "red"},
            {start: g_ns, end: g_ns + y, ns: "yellow", ew: "red"},
            {start: g_ns + y, end: g_ns + y + ar, ns: "red", ew: "red"},
            {start: g_ns + y + ar, end: g_ns + y + ar + g_ew, ns: "red", ew: "green"},
            {start: g_ns + y + ar + g_ew, end: g_ns + y + ar + g_ew + y, ns: "red", ew: "yellow"},
            {start: g_ns + y + ar + g_ew + y, end: g_ns + y + ar + g_ew + y + ar, ns: "red", ew: "red"}
        ];

        this.cycleLength = g_ns + y + ar + g_ew + y + ar;
    }

    update(dt) {
        this.cyclePosition += dt;

        // サイクルの繰り返し
        if (this.cyclePosition >= this.cycleLength) {
            this.cyclePosition = this.cyclePosition % this.cycleLength;
        }

        // 現在のフェーズを決定
        for (const phase of this.schedule) {
            if (this.cyclePosition >= phase.start && this.cyclePosition < phase.end) {
                // 南北方向の信号を更新
                this.lights.north.phase = phase.ns;
                this.lights.south.phase = phase.ns;

                // 東西方向の信号を更新
                this.lights.east.phase = phase.ew;
                this.lights.west.phase = phase.ew;

                break;
            }
        }
    }
}
```

### 3.3.3 車両生成サブモデル

車両を確率的に生成するサブモデルです。

#### アルゴリズム：

```
入力:
- direction: 生成方向
- spawnRate: 生成率（台/分）
- dt: タイムステップ
- rng: 乱数生成器

出力:
- 生成された車両オブジェクト（またはnull）

手順:
1. 生成確率の計算
   probability = (spawnRate / 60) * dt

2. 乱数生成
   r = rng.random()  // 0-1の一様乱数

3. 生成判定
   If r < probability:
       vehicle = createVehicle(direction)
       return vehicle
   Else:
       return null
```

#### 詳細な実装：

```javascript
class VehicleGenerator {
    constructor(config, rng) {
        this.spawnRates = config.spawn_rates;
        this.turnProbabilities = config.turn_probabilities;
        this.vehicleDefaults = config.vehicle_defaults;
        this.rng = rng;
        this.nextId = 1;
    }

    tryGenerate(direction, dt) {
        // 生成確率の計算（台/秒に変換）
        const rate = this.spawnRates[direction] / 60;
        const probability = rate * dt;

        // 乱数判定
        if (this.rng.random() < probability) {
            return this.createVehicle(direction);
        }

        return null;
    }

    createVehicle(direction) {
        // 進行意図をランダムに決定
        const turnIntent = this.chooseTurnIntent();

        // 初期位置の決定
        const position = this.getEntryPosition(direction);

        // 車両オブジェクトの作成
        const vehicle = {
            id: `v${this.nextId++}`,
            direction: direction,
            turnIntent: turnIntent,
            position: {...position},
            velocity: 0,
            acceleration: 0,
            waitTime: 0,
            totalTravelTime: 0,
            status: "approaching",
            lane: 0,  // デフォルトは第1車線

            // パラメータ
            maxSpeed: this.vehicleDefaults.max_speed,
            maxAcceleration: this.vehicleDefaults.max_acceleration,
            comfortableDeceleration: this.vehicleDefaults.comfortable_deceleration,
            minGap: this.vehicleDefaults.min_gap,
            reactionTime: this.vehicleDefaults.reaction_time,
            length: this.vehicleDefaults.length
        };

        return vehicle;
    }

    chooseTurnIntent() {
        const r = this.rng.random();
        const p = this.turnProbabilities;

        if (r < p.straight) {
            return "straight";
        } else if (r < p.straight + p.left) {
            return "left";
        } else {
            return "right";
        }
    }

    getEntryPosition(direction) {
        const entryDistance = 200;  // 交差点から200m離れた位置

        const positions = {
            "north": {x: 0, y: -entryDistance},
            "south": {x: 0, y: entryDistance},
            "east": {x: -entryDistance, y: 0},
            "west": {x: entryDistance, y: 0}
        };

        return positions[direction];
    }
}
```

### 3.3.4 交差点通過判定サブモデル

車両が交差点を通過したかを判定し、退出処理を行います。

```javascript
function checkIntersectionCrossing(vehicle, intersection) {
    const intersectionBounds = {
        xMin: -intersection.width / 2,
        xMax: intersection.width / 2,
        yMin: -intersection.width / 2,
        yMax: intersection.width / 2
    };

    // 交差点内にいるかチェック
    const isInside =
        vehicle.position.x >= intersectionBounds.xMin &&
        vehicle.position.x <= intersectionBounds.xMax &&
        vehicle.position.y >= intersectionBounds.yMin &&
        vehicle.position.y <= intersectionBounds.yMax;

    if (vehicle.status === "approaching" && isInside) {
        vehicle.status = "crossing";
    } else if (vehicle.status === "crossing" && !isInside) {
        vehicle.status = "exited";
    }

    // 退出判定（シミュレーション領域外）
    const exitDistance = 200;
    const hasExited =
        Math.abs(vehicle.position.x) > exitDistance ||
        Math.abs(vehicle.position.y) > exitDistance;

    return hasExited;
}
```

### 3.3.5 データ収集サブモデル

```javascript
function collectData(dataCollector, vehicles, trafficLights, currentTime, warmupPeriod) {
    // ウォームアップ期間中はデータを収集しない
    if (currentTime < warmupPeriod) {
        return;
    }

    // 現在のキュー長を計算
    const queueLengths = {north: 0, south: 0, east: 0, west: 0};

    for (const v of vehicles) {
        if (v.velocity < 0.5) {  // 停止中
            queueLengths[v.direction]++;
        }
    }

    // 時系列データに追加
    dataCollector.timeseries.push({
        time: currentTime,
        activeVehicles: vehicles.length,
        queueLengths: {...queueLengths},
        signalStates: {
            north: trafficLights.north.phase,
            south: trafficLights.south.phase,
            east: trafficLights.east.phase,
            west: trafficLights.west.phase
        }
    });

    // 統計の更新
    for (const direction in queueLengths) {
        dataCollector.statistics.queueLengths[direction].push(queueLengths[direction]);
    }
}

function recordVehicleExit(dataCollector, vehicle) {
    dataCollector.vehicles.push({
        id: vehicle.id,
        direction: vehicle.direction,
        turnIntent: vehicle.turnIntent,
        waitTime: vehicle.waitTime,
        travelTime: vehicle.totalTravelTime
    });

    dataCollector.statistics.waitTimes.push(vehicle.waitTime);
    dataCollector.statistics.travelTimes.push(vehicle.totalTravelTime);
    dataCollector.statistics.completedVehicles++;
}
```

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
