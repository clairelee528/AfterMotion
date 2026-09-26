# AfterMotion Day 2 信息架构

## 文档目的

本文件将核心用户任务转化为移动端导航结构和页面清单。信息架构需要同时满足三个要求：用户能找到当前任务、开发阶段可以复用页面、Session 中断后可以从正确位置继续。

## 架构结论

App 采用三项底部导航：

```text
Training      History      Settings
```

进行中的 Session 不放入底部导航，而是作为一条独立的全屏任务流。用户进入 Session 后，界面优先显示当前任务，减少跳转到无关页面的机会。

## 一级导航

## Training

### 角色

Training 是训练任务中心，帮助用户开始、继续或查看最近一次 Session。

### 内容优先级

1. 进行中 Session 和下一步操作；
2. 新建 Session；
3. 下一次 Recovery Check 倒计时；
4. 最近一次 Session 摘要；
5. 设备连接概况。

### 不承担

- 完整历史趋势；
- 设备高级设置；
- 原始传感器数据；
- 医学建议。

## History

### 角色

History 用于浏览已完成 Session 和理解长期变化。

### 内容

- Session 列表；
- Activity Type 筛选；
- 单次 Session Detail；
- 相似 Session Comparison；
- Recovery Time 趋势。

### 数据不足状态

历史数据不足时，优先说明需要完成更多 Session，不显示空图表或人群平均值。

## Settings

### 角色

Settings 保存不会频繁修改的个人和设备配置。

### 内容

- Injured Side；
- 默认 Measurement Source；
- Motion Sleeve 状态；
- Recovery Band 状态；
- 测量位置说明；
- 数据与隐私说明；
- 非医疗声明；
- App 与固件版本。

### Day 2 范围

Day 2 只制作设置列表和关键状态占位，不实现设备管理和账户功能。

## Session 任务流

```text
Training
  ↓
New Session
  ↓
Baseline Preparation
  ↓
Measurement
  ├── Left Baseline
  └── Right Baseline
  ↓
Baseline Complete
  ↓
Motion Sleeve Setup
  ↓
Active Session
  ↓
Activity Summary
  ↓
Recovery Preparation
  ↓
Measurement
  ├── Left Recovery
  └── Right Recovery
  ↓
Recovery Timeline
  ├── Next Check
  └── Extended Check
  ↓
Session Summary
```

## 页面复用决策

左右膝、Baseline 和 Recovery 不创建四套独立页面，而是复用一个 Measurement 页面，通过参数决定内容：

```text
phase = baseline | recovery
side = left | right
checkpoint = baseline | 0 | 15 | 30 | 45 | 60 | 90 | 120
```

同一个 Measurement 页面负责：

- 显示当前侧别；
- 显示 Baseline 或 Recovery 阶段；
- 显示计划时间点；
- 张力和稳定性状态；
- 测量倒计时；
- 症状记录；
- 数据来源标记；
- 重新测量。

这种复用可以确保左右侧和不同时间点使用相同的交互规则，减少实现差异。

## 页面清单

| 编号 | 页面 | 主要任务 | Day 2 |
|---|---|---|---|
| P01 | Training | 开始或继续当前 Session | 实现 |
| P02 | History | 浏览历史 Session | 实现低保真 |
| P03 | Settings | 查看基础设置和设备状态 | 实现低保真 |
| P04 | New Session | 选择运动、受伤侧和数据来源 | 实现 |
| P05 | Baseline Preparation | 说明运动前测量条件 | 实现 |
| P06 | Measurement | 复用左右侧和不同阶段的测量流程 | 实现 |
| P07 | Baseline Complete | 确认左右膝数据完整 | 实现 |
| P08 | Motion Sleeve Setup | 确认 Activity 数据来源 | 实现 |
| P09 | Active Session | 显示活动时间和结束操作 | 实现 |
| P10 | Activity Summary | 显示本次负荷摘要 | 实现 |
| P11 | Recovery Preparation | 标准化静息和测量准备 | 实现 |
| P12 | Recovery Timeline | 管理重复时间点和下一步 | 实现 |
| P13 | Session Summary | 展示 Load、Response、Recovery | 实现 |
| P14 | Session Detail | 从 History 查看一次完整 Session | 使用 Summary 页面复用 |
| P15 | Session Comparison | 比较相似 Session | Day 2 占位 |
| P16 | Measurement Position Guide | 查看定位说明 | Day 2 使用简化模态页 |

## 页面与任务映射

| 核心用户任务 | 页面 |
|---|---|
| 查看当前状态 | Training |
| 创建运动 Session | New Session |
| 建立和恢复 Session | Session Overview |
| 测量左膝和右膝 | Measurement |
| 准备 Motion Sleeve | Motion Sleeve Setup |
| 进行运动 | Active Session |
| 查看负荷摘要 | Activity Summary |
| 完成 Recovery Check | Measurement |
| 查看恢复进度 | Session Overview、Checkpoint Detail |
| 理解本次结果 | Session Summary |
| 回顾历史数据 | History、Session Detail、Session Comparison |

## Expo Router 路由规划

```text
src/app
├── _layout.tsx
├── (tabs)
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── history.tsx
│   └── settings.tsx
├── session
│   ├── new.tsx
│   └── [sessionId]
│       ├── index.tsx
│       ├── measurement.tsx
│       ├── checkpoint.tsx
│       ├── feelings.tsx
│       ├── sleeve-setup.tsx
│       ├── activity.tsx
│       ├── activity-summary.tsx
│       └── summary.tsx
├── comparison
│   └── [comparisonId].tsx
└── measurement-position.tsx
```

### 路由参数示例

```text
/session/demo-001/measurement
  ?phase=baseline
  &side=left
  &checkpoint=baseline
```

```text
/session/demo-001/measurement
  ?phase=recovery
  &side=right
  &checkpoint=15
```

Day 2 使用模拟传感器读数，但 Session、测量完成状态和活动状态已接入本地持久化，为后续真实硬件数据提供统一入口。

## 导航层级

```text
Root Stack
├── Tabs
│   ├── Training
│   ├── History
│   └── Settings
├── Session Flow
│   ├── Setup
│   ├── Baseline
│   ├── Activity
│   ├── Recovery
│   └── Summary
└── Modal
    └── Measurement Position Guide
```

底部 Tab Bar 只在 Training、History 和 Settings 显示。进入 Session Flow 后隐藏 Tab Bar，以保持任务专注。

## 返回规则

## 尚未创建 Session

从 New Session 返回 Training，不产生草稿数据。

## 已创建但未完成 Baseline

- 返回时显示确认提示；
- 可以保存草稿并退出；
- 再次进入时回到第一个未完成步骤。

## Baseline 已完成但 Activity 未开始

- 返回 Training 时保留 Session；
- Training 显示 `Continue to activity`；
- 用户可以显式删除草稿，但不能意外覆盖。

## Activity 进行中

- 系统返回手势不能直接退出活动；
- 需要选择 `Continue`, `Pause` 或 `Finish activity`；
- 回到 App 时继续显示 Active Session。

## Recovery 进行中

- 可以返回 Training；
- Training 显示下一时间点和倒计时；
- 到达时间点后主要按钮变为 `Start next check`；
- 不丢失已完成测量。

## Session 已完成

- 返回进入 Training；
- Summary 可从 History 再次打开；
- 完成后的原始测量在 MVP 中不可直接编辑。

## Resume 规则

App 启动时根据当前 Session 状态决定 Training 的主要行动：

| Session 状态 | Training 主要行动 |
|---|---|
| 无 Session | Start a session |
| draft，无 Baseline | Continue baseline |
| baselineComplete | Start activity |
| active | Return to activity |
| recovering，未到时间 | View recovery timeline |
| recovering，到达时间 | Start next check |
| complete | View session summary |

如果某个状态内部存在部分完成数据，例如左膝已完成、右膝未完成，则直接恢复到右膝 Measurement。

## 页面通用区域

Session Flow 页面采用一致结构：

```text
Top Bar
  Back or Close
  Session Stage

Progress
  Current step
  Remaining steps

Main Content
  One task

Primary Action
  One clear next step

Secondary Action
  Help, retry, or exit
```

### 页面必须显示的上下文

- Baseline、Activity 或 Recovery 阶段；
- Left 或 Right；
- 当前 checkpoint；
- Demo、Manual 或 Bluetooth 数据来源；
- 当前 Session 是否已保存。

## 模态页使用原则

仅以下内容使用模态页：

- Measurement Position Guide；
- 退出或结束 Session 确认；
- 重新测量确认；
- 数据质量说明。

核心步骤不放入模态页，避免用户关闭弹窗后丢失流程位置。

## Day 2 低保真实现边界

### 实现

- 三个一级 Tab；
- 完整 Session Flow；
- Measurement 页面复用；
- 模拟传感器读数与本地 Session 状态；
- 基础返回和继续操作；
- 页面阶段、侧别和时间点标签；
- History 与 Settings 占位内容。

### 暂不实现

- 真实计时后台恢复；
- 系统通知；
- BLE 连接；
- 正式图表；
- 动画与触觉反馈；
- 完整错误恢复；
- 正式组件视觉。

## 第二阶段完成标准

- 所有核心用户任务都映射到明确页面；
- 一级导航不超过三项；
- Session Flow 与浏览型页面分离；
- 左右侧和不同 checkpoint 复用 Measurement 页面；
- 路由结构可以直接转化为 Expo Router 文件；
- 返回和恢复规则覆盖所有 Session 状态；
- 下一阶段可以据此定义异常流程并开始低保真实现。
# Local session state

The prototype now uses one persisted local Session model rather than page-level demo values. The Training home, Session overview, measurements, Activity timer, feelings editor, and Recovery checkpoints all read and update the same record.

The local record stores:

- current Session identifier and setup choices;
- left/right baseline completion and result summaries;
- Activity status, elapsed time, start time, and end time;
- left/right results and subjective feelings for post-activity and 15/30/45/60-minute checkpoints.

Only compact results and workflow state are retained. Future high-frequency BMI270 samples should be processed separately and discarded or downsampled after summary metrics are calculated.
