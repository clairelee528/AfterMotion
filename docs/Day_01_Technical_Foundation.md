# AfterMotion Day 1 技术基础

## 当日结论

AfterMotion 移动端采用 React Native、Expo 和 TypeScript，首要验证平台为 iOS。开发前期通过 Expo Go 在实体手机上运行，不安装本地 Xcode。需要接入自定义 BLE 原生库时，优先使用 EAS 云端 development build。

十天版本以完整、稳定地展示 Baseline、Load、Response 和 Recovery 数据闭环为目标。硬件数据通过可替换的数据来源接口进入 App，因此真实硬件进度不会阻塞交互、计算和作品集演示。

## 技术栈

| 层级 | 选择 | Day 1 决策理由 |
|---|---|---|
| 移动端 | React Native | 保留 iOS 和 Android 的跨平台能力 |
| 开发框架 | Expo SDK 57 | 简化真机预览、依赖管理和云端构建 |
| 语言 | TypeScript | 严格类型降低左右侧、单位和状态字段错误 |
| 导航 | Expo Router | 使用官方推荐的文件路由方案 |
| 当前运行方式 | Expo Go | 无需安装 Xcode即可完成 P0 开发 |
| 后期原生构建 | EAS Development Build | 支持 BLE 原生库并避免本地 Xcode 体积 |
| 数据存储 | 本地优先 | MVP 不依赖账户、服务器或网络 |
| 硬件接入 | Adapter Interface | Mock、Manual 和 Bluetooth 可替换 |

## 项目结构

```text
AfterMotion
├── docs
│   └── Day_01_Technical_Foundation.md
├── mobile
│   ├── assets
│   ├── src
│   │   ├── app
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
│   │   ├── data
│   │   │   └── measurement-source.ts
│   │   ├── domain
│   │   │   ├── calculations.ts
│   │   │   └── models.ts
│   │   └── theme
│   │       └── tokens.ts
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── AfterMotion_10_Day_Development_Plan.md
└── AfterMotion_PRD_V1.1.md
```

`src/app` 只存放路由页面。业务数据、计算、硬件数据接口和视觉 token 放在独立目录中，防止页面组件承担过多职责。

## MVP 状态模型

一次 Session 使用以下状态：

```text
draft
→ baselineComplete
→ active
→ recovering
→ complete
```

- `draft`：已选择运动或建立 Session，但 Baseline 尚未完成。
- `baselineComplete`：左右膝 Baseline 均已记录。
- `active`：运动记录进行中。
- `recovering`：运动已结束，正在完成恢复时间点测量。
- `complete`：已满足结束条件或由用户结束追踪，可查看总结。

## 核心数据模型

### ActivitySession

保存运动类型、受伤侧、状态、开始结束时间、Baseline、恢复测量和负荷指标。

### KneeMeasurement

每条记录必须包含：

- Session ID；
- 左右侧；
- 时间戳；
- 距离运动结束的分钟数；
- Stretch 原始或标准化值；
- 摄氏温度；
- Pain、Stiffness 和 Subjective Swelling；
- Mock、Manual 或 Bluetooth 数据来源。

### ActivityMetrics

保存运动时长、运动强度、加速度峰值数、减速事件数、冲击样事件数、Load Index 和负荷等级。

## 数据来源策略

```text
App Workflow and Calculations
              ↓
MeasurementDataSource and ActivityDataSource
              ↓
┌────────────────┬────────────────┬────────────────┐
│ Mock Adapter   │ Manual Adapter │ BLE Adapter    │
│ P0             │ P0             │ P1             │
└────────────────┴────────────────┴────────────────┘
```

### Mock

用于界面开发、自动测试和稳定的作品集演示。固定输入必须产生固定输出。

### Manual

用于 Prototype 01。用户可以输入软尺、温度计或串口工具获得的数据，以便在 BLE 完成前进行真实流程测试。

### Bluetooth

用于连接 Motion Knee Sleeve 和 Recovery Band。它遵循与 Mock 和 Manual 相同的接口，不直接侵入页面和领域计算。

## P0 范围

- 创建 Session 并选择运动类型；
- 设置受伤侧；
- 左右膝运动前 Baseline；
- Activity Session 开始和结束；
- Activity Load 汇总；
- 0、15、30、45 和 60 分钟恢复测量；
- Pain、Stiffness 和 Subjective Swelling；
- Circumference Response；
- Temperature Response；
- Contralateral Comparison；
- Recovery Curve 和 Recovery Time；
- Session Summary；
- 历史 Session 浏览和两次相似 Session 比较。

## P1 范围

- Motion Knee Sleeve BLE 数据接入；
- Recovery Band BLE 数据接入；
- EAS development build；
- 测量提醒；
- 更完整的数据质量判断；
- 相似负荷自动匹配。

## 非目标范围

- 医疗诊断或疾病风险预测；
- 云端账户和多人数据共享；
- 医生端 Dashboard；
- 医疗级精度声明；
- 后台持续 BLE 采集；
- App Store 发布；
- 量产硬件结构和认证。

## 计算原则

所有核心计算保持为纯 TypeScript 函数，独立于页面和硬件来源。这样可以用固定样例验证结果，并避免相同公式在多个页面重复实现。

当前建立：

```text
Relative Response = (Current - Baseline) / Baseline
Temperature Delta = Current Temperature - Baseline Temperature
Contralateral Difference = Injured Side Response - Contralateral Response
```

Recovery Time 的 tolerance range 将在获得测试数据后定义。在此之前不得伪造医学阈值。

## 风险与处理

| 风险 | 当前处理方式 |
|---|---|
| 本机没有 Xcode | 使用 Expo Go，后期使用 EAS 云端构建 |
| BLE 延误 | Mock 和 Manual Adapter 保证主流程可完成 |
| 传感器数据不稳定 | 保留原始值、来源和时间戳，计算层不做医学推断 |
| 十天范围过大 | P0 优先，BLE 和提醒不阻塞演示版本 |
| 用户误解健康数据 | 文案只描述 response、difference 和 trend |
| 个人基线样本不足 | 显示数据不足，不生成虚假正常范围 |

## 硬件采购结论

当前尚未采购硬件。详细优先级见 `docs/Hardware_Procurement_Priority.md`。

第一批采购用于 USB 台架验证，包括 ESP32-S3、BMI270 Breakout、TMP117 Breakout、Conductive Rubber Stretch Sensor、基础接线工具和 Recovery Band 结构材料。第一批不购买锂电池、充电模块、独立 Band 主控和 3D 打印外壳。

原型首先通过 USB 串口输出真实数据，随后才开发 BLE。此顺序可以将传感器读数问题与无线连接问题分开排查。

## Day 1 完成标准

- Expo 项目可以在 Expo Go 中运行；
- Expo Router 和 TypeScript strict mode 已配置；
- 核心领域模型和数据来源接口通过类型检查；
- Mock、Manual 和 Bluetooth 路径在架构上可替换；
- P0、P1 和非目标范围已经记录；
- Expo Doctor 无阻断问题；
- 工作区改动可作为独立的 Day 1 commit 提交。
