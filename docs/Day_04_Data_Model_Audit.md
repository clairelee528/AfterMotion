# AfterMotion Day 4 数据模型审计与重构边界

## 1. 阶段一目标

本阶段只确认现状、目标模型和重构边界，不改变 App 当前行为。后续阶段将在此文档基础上逐步迁移，避免同时修改存储、计算和页面而造成数据丢失或流程回归。

## 2. 当前实现概览

### 已经具备

- Expo Router 页面与主导航结构；
- 使用 AsyncStorage 保存本地 Session；
- 创建、恢复和结束当前 Session；
- Activity 开始、暂停、恢复与结束；
- Baseline 与五个 Recovery checkpoint 的左右膝记录；
- 主观疼痛、僵硬和肿胀记录；
- History 列出已经结束的 Session；
- 温度、时长、评分、百分比和记录时间的集中格式化函数；
- MeasurementDataSource 与 ActivityDataSource 的硬件接口雏形。

### 当前数据流

```text
页面
  └── useSessionStore()
        ├── React Context state
        ├── AsyncStorage JSON
        └── 页面内计算与固定演示值
```

当前 UI 直接读取 `LocalSession`，同时在页面内判断完成状态和下一步。正式领域模型 `ActivitySession` 尚未接入存储或页面。

## 3. 关键问题

### 3.1 存在两套不一致的 Session 模型

`mobile/src/domain/models.ts` 定义了：

- `ActivitySession`
- `KneeMeasurement`
- `ActivityMetrics`
- `SessionStatus`

`mobile/src/state/session-store.tsx` 又单独定义了：

- `LocalSession`
- `StoredMeasurement`
- `CheckpointRecord`
- `ActivityProgress`
- `MeasurementPhase`

实际页面全部依赖第二套模型。第一套模型只被数据源接口引用，造成以下风险：

- 硬件数据返回 `KneeMeasurement`，存储却不能直接保存；
- `KneeMeasurement` 含 `symptoms`，当前存储将症状放在 checkpoint 层；
- 正式模型用测量数组，当前存储使用 `baseline` 和以字符串为键的 `recovery`；
- 正式模型的 `activityMetrics` 在当前 Session 中不存在；
- `SessionStatus` 与 `ActivityProgress` 混合了 Session 生命周期和 Activity 生命周期。

### 3.2 存储缺少版本封装与运行时校验

当前 key 为 `@aftermotion/session-state/v1`，但保存的 JSON 本身没有 `schemaVersion`。读取时直接使用类型断言：

```ts
JSON.parse(savedState) as SessionState
```

因此旧数据、缺失字段或损坏数据可能在页面运行时才报错。写入失败也被静默忽略。

### 3.3 测量数据不完整

当前 `StoredMeasurement` 只有：

- `recordedAt`
- `stretchValue`
- `temperatureCelsius`
- `pain`

缺少：

- 测量 ID；
- Session ID；
- 左右侧；
- checkpoint；
- 数据来源；
- 质量与稳定性状态；
- 原始值和校准信息。

`pain` 同时存在于 measurement 和 checkpoint symptoms，职责重复。

### 3.4 Session 与 Activity 状态职责混合

当前 Session 是否完成主要通过页面临时推导；存储没有唯一的 Session 状态。`endedEarly`、`closedAt` 和 Activity 状态可能出现互相矛盾的组合。

### 3.5 页面重复实现领域判断

以下规则目前散落在页面中：

- Baseline 是否完成；
- Activity 是否正在进行；
- Recovery checkpoint 是否完成；
- Session 是否完整；
- 当前推荐操作；
- 已完成 checkpoint 数量；
- Activity 经过分钟数。

Training 与 Session Overview 分别实现了相似但不完全相同的阶段判断，后续容易产生状态文案不一致。

## 4. 写死数据清单

| 位置 | 固定值 | 后续来源 |
|---|---|---|
| `session-store.tsx` | 温度 `33.4 / 33.7°C`、Stretch `2418`、恢复温差 | Demo 数据源或真实传感器 |
| `activity.tsx` | Activity 名称 `Frisbee`、采样率 `50 Hz` | Session 与 Activity 配置 |
| `activity-summary.tsx` | Load `82 · High`、减速 `18`、冲击 `14` | `ActivityMetrics` |
| `session/[id]/index.tsx` | Load `82 · High` | `ActivityMetrics` |
| `summary.tsx` | 左右反应、温差、疼痛、恢复时间、减速次数 | 计算层与 Session 数据 |
| `measurement.tsx` | 结果 `2418 / 33.4°C`、僵硬 `2`、肿胀 `Mild` | 当前测量与 symptoms |
| Training 首页 | 固定 Recent Session 与 `demo-previous` | 已结束 Session 排序结果 |
| 初始状态 | 只有一个未完成的 `demo-001` | 三套可复现 Demo fixtures |

## 5. 目标领域模型

### 5.1 生命周期分离

```ts
type SessionStatus =
  | 'draft'
  | 'baseline'
  | 'activity'
  | 'recovery'
  | 'complete'
  | 'endedEarly';

type ActivityStatus = 'planned' | 'active' | 'paused' | 'complete';
```

Session 状态描述完整项目处于哪个阶段；Activity 状态只描述运动记录器。

### 5.2 固定 checkpoint 类型

```ts
type RecoveryCheckpoint = 'post' | '15m' | '30m' | '45m' | '60m';
type MeasurementCheckpoint = 'baseline' | RecoveryCheckpoint;
```

不再允许任意字符串 checkpoint，避免 `'0'`、`'post'` 和 `0` 混用。

### 5.3 建议的 Session 结构

```text
Session
├── id / schemaVersion
├── activityType / injuredSide / measurementSource
├── status / createdAt / updatedAt / closedAt
├── endedEarly
├── baseline: CheckpointRecord
├── activity: ActivityRecord
│   ├── status / startedAt / endedAt / elapsedSeconds
│   └── metrics: ActivityMetrics | null
└── recovery: Record<RecoveryCheckpoint, CheckpointRecord>

CheckpointRecord
├── checkpoint
├── left: KneeMeasurement | null
├── right: KneeMeasurement | null
└── symptoms: SymptomRecord | null
```

### 5.4 KneeMeasurement 职责

`KneeMeasurement` 只保存客观测量，不再包含 symptoms：

- `id`
- `sessionId`
- `checkpoint`
- `side`
- `recordedAt`
- `stretchValue`
- `temperatureCelsius`
- `source`
- 可选 `quality`

主观感受保留在 checkpoint 层，因为用户对同一时间点只填写一组整体感受。

### 5.5 ActivityMetrics

统一保存：

- `durationSeconds`
- `sampleCount`
- `movementIntensity`
- `accelerationPeakCount`
- `decelerationEventCount`
- `impactLikeEventCount`
- `loadIndex`
- `loadLevel`

显示层再将秒转换为分钟，不在数据模型中同时保存两个可能不一致的时长。

## 6. 计算层边界

建议新增纯函数或 selector，页面只读取结果：

- `isBaselineComplete(session)`
- `getCheckpointStatus(session, checkpoint)`
- `getCompletedRecoveryCount(session)`
- `isSessionComplete(session)`
- `getSessionStage(session)`
- `getRecommendedAction(session)`
- `getTemperatureSeries(session, side)`
- `getSwellingSeries(session)`
- `getTemperatureDelta(session, side, checkpoint)`
- `getRecoveryTimeMinutes(session)`
- `getLatestClosedSession(sessions)`

计算层不得依赖 React、Router 或 AsyncStorage，确保可以独立测试。

## 7. 存储层目标

建议将持久化结构封装为：

```ts
interface PersistedSessionState {
  schemaVersion: 2;
  currentSessionId: string | null;
  sessions: Record<string, Session>;
}
```

读取流程：

1. 读取 JSON；
2. 判断 schema version；
3. 迁移 v1 数据；
4. 对关键字段进行运行时校验；
5. 无法恢复时回退到安全初始状态，而不是注入进行中的演示 Session；
6. 保存迁移后的 v2 数据。

## 8. Demo 与真实硬件的共同边界

页面和 Store 不应生成传感器数值。不同来源都通过数据源接口返回同一种领域对象：

```text
MockMeasurementSource ─┐
ManualMeasurementSource ├── KneeMeasurement ── Store ── UI
BluetoothMeasurementSource ┘

MockActivitySource ─────┐
BluetoothActivitySource ├── ActivitySample / ActivityMetrics ── Store ── UI
ManualActivitySource ───┘
```

Demo fixture 可以包含完整 Session，但不能在页面中写死结论。

## 9. Day 4 重构边界

### 本日纳入

- 合并两套模型；
- 存储 schema v2 与 v1 迁移；
- Session selector / calculation 层；
- 三套演示数据；
- 将核心页面接入 Session 和 metrics；
- 对迁移、状态判断和计算规则增加测试或可执行验证。

### 本日不纳入

- ESP32、BMI270、TMP117 的真实蓝牙通信；
- 真实 Stretch 与温度校准；
- 真实 IMU 负荷算法；
- 医学阈值或诊断结论；
- 云端账号与跨设备同步。

这些内容分别属于后续硬件、算法与产品化阶段。

## 10. 推荐实施顺序

1. 在 `domain/models.ts` 建立唯一模型；
2. 新增 selector 与计算层；
3. 新增 Demo fixtures；
4. 建立 v1 → v2 数据迁移；
5. 重构 Store 使用正式模型；
6. 页面逐一移除固定值；
7. 验证创建、恢复、部分完成、正常完成和提前结束路径。

## 11. 阶段一结论

现有架构足以继续扩展，不需要推翻页面或导航。主要风险集中在“双模型、无迁移、页面写死和重复计算”四点。Day 4 后续应优先稳定数据边界，再接入三套 Demo 和页面，避免 Day 5 硬件测量继续依赖临时结构。

## 12. Day 4 完成记录

Day 4 已完成以下交付：

- `domain/models.ts` 成为 Session、Activity、Measurement 的唯一模型来源；
- 本地存储升级到 schema v2，并兼容迁移 v1 数据；
- Session 生命周期、checkpoint 完成度、历史排序和图表序列由统一 selector 计算；
- Demo 测量值和 Activity metrics 由可复现的数据源生成；
- Settings 可以加载或重置进行中、完整结束、提前结束三种演示 Session；
- Training、History、Session Overview、Activity Summary 和 Session Summary 已接入正式数据；
- `npm run verify:domain` 可以验证迁移、状态机、fixtures 和计算规则；
- 已完成 iPhone Expo Go 真机主流程回归。

Day 5 可以直接在当前 `MeasurementDataSource` 边界上完善 Baseline 与 Recovery Band 测量流程，无需再次调整 Session 存储结构。
