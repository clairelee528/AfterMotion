# AfterMotion — Knee Response Monitor
## 产品需求文档 PRD V1.1

**版本：** V1.1  
**产品类型：** 膝关节 Return-to-Sport 可穿戴监测系统  
**核心场景：** 膝关节损伤康复后期 / Return-to-Sport 阶段  
**产品形态：** Motion Knee Sleeve + Recovery Band + Mobile App  
**核心逻辑：** Baseline → Load → Response → Recovery

---

# 1. 项目背景

膝关节损伤患者在医院复查之间通常存在较长的“信息空窗期”。

医生可以通过 MRI、影像学检查、肌力测试和临床评估判断患者在某一个时间点的恢复情况，但患者在日常生活和居家康复过程中往往无法持续了解：

- 当前膝关节能够承受多大的真实运动负荷；
- 一次运动是否超过当前膝关节的承受能力；
- 运动后的肿胀、发热和不适是否明显高于过去；
- 相似运动量下，膝关节是否比过去恢复得更快；
- 从基础康复逐渐返回飞盘、羽毛球、网球等真实运动的过程中，恢复趋势是否在改善。

尤其是在 Return-to-Sport 阶段，患者可能已经能够正常行走和进行基础训练，但面对包含跑动、急停、变向、跳跃和落地的真实运动时，仍缺乏能够连续观察“运动刺激—膝关节反应”的工具。

AfterMotion 希望填补这一信息缺口。

---

# 2. 产品定位

## 2.1 产品定义

AfterMotion 是一套面向膝关节损伤恢复人群的可穿戴运动监测系统。

系统由两类硬件组成：

1. **Motion Knee Sleeve**  
   用于运动过程中记录机械运动负荷。

2. **Recovery Band**  
   用于运动前和运动后，在标准化静态条件下测量膝部围度变化趋势与皮肤温度变化。

系统结合用户主观症状记录，建立：

**Baseline → Load → Response → Recovery**

即：

**运动前基线 → 运动负荷 → 膝关节反应 → 恢复过程**

的完整数据链。

产品的核心目的不是判断膝关节“有没有受伤”，而是帮助用户理解：

> **How well is my knee handling real-world movement?**

---

## 2.2 核心价值主张

传统运动设备主要告诉用户：

> How much did you move?

传统康复设备主要告诉用户：

> How well can your knee move?

AfterMotion 希望回答：

> **How did your knee respond to what you just did — and how quickly did it recover?**

因此产品的核心不是单纯 Activity Tracking，而是：

### Recovery Response Monitoring

---

# 3. 目标用户

## Primary User

处于膝关节损伤后期康复阶段，并正在逐步恢复 recreational sports 的成年人。

典型情况包括：

- 软骨损伤康复；
- 半月板损伤；
- ACL 等膝关节手术后期恢复；
- 运动相关膝关节损伤；
- 经医生允许开始逐步恢复运动的人群。

典型运动包括：

- 飞盘；
- 羽毛球；
- 网球；
- Pickleball；
- 慢跑；
- 徒步；
- 健身训练；
- 其他包含变向、减速和落地的运动。

---

# 4. 非目标范围

V1.1 **不作为医疗诊断设备**。

产品不应直接输出：

- “炎症程度”；
- “软骨损伤程度”；
- “ACL 再损伤概率”；
- “膝关节恢复了 83%”；
- “你现在可以安全回归比赛”；
- “存在关节积液”等医学诊断结论。

产品只能提供：

- Activity Load；
- Circumference Response Trend；
- Temperature Response；
- Symptom Response；
- Recovery Time；
- Contralateral Comparison；
- Personal Baseline Comparison。

最终医疗判断仍由医生或康复专业人员完成。

---

# 5. 核心产品模型

AfterMotion 的核心数据结构为：

```text
BASELINE
运动前膝关节状态
       ↓
LOAD
运动过程中受到的机械刺激
       ↓
RESPONSE
运动后膝关节产生的反应
       ↓
RECOVERY
多久恢复到个人基线
```

长期积累后形成：

```text
Personal Recovery Baseline
```

系统优先比较：

> **今天的我 vs 过去的我**

并增加：

> **受伤侧 vs 健侧**

作为 within-subject reference。

---

# 6. 产品系统构成

## 6.1 Motion Knee Sleeve

### 角色

只负责：

> **这次运动给膝关节带来了多大的机械刺激？**

### 核心传感器

- 6-axis IMU；
- BLE 主控；
- 电池。

### 主要输出

- activity duration；
- acceleration intensity；
- angular velocity；
- deceleration events；
- impact-like events；
- movement intensity；
- Activity Load Index。

### 设计原则

- 轻量；
- 不影响真实运动；
- 不集成 swelling 与 temperature 作为核心测量；
- 避免因厚护膝、汗液和持续压迫影响静态生理指标测量。

---

## 6.2 Recovery Band

### 角色

只负责：

> **膝盖在运动前后发生了什么变化？**

Recovery Band 是一条独立于运动护膝的轻量测量带。

### 核心传感器

- Stretch / Strain Sensor；
- Skin Temperature Sensor；
- 固定张力结构；
- 标准化定位结构。

### 主要输出

- Circumference Response Trend；
- Temperature Response；
- Left–Right Difference；
- Recovery Curve。

### 使用方式

- 运动前测 baseline；
- 运动后脱掉 Motion Knee Sleeve；
- 用 Recovery Band 分别测量左右膝；
- 在固定时间点重复测量。

---

# 7. Recovery Band 结构设计

## 7.1 可调节闭环结构

Recovery Band 应采用：

### Adjustable Closed-Loop Band with Fixed Starting Tension

即：

- 可根据不同用户腿围调整；
- 但每次正式测量时拥有相同的起始张力；
- 避免用户每次“拉得松或紧不一样”。

---

## 7.2 固定起始张力机制

可采用以下任一种结构：

### 方案 A — 固定扣位

通过磁吸扣 / 机械扣 / 卡扣，使测量带每次达到同一闭合位置。

### 方案 B — 张力指示区

Stretch Sensor 同时承担佩戴张力确认功能。

App 显示：

```text
Band Tension

█████░

Correct ✓
```

仅当预紧力进入标准区间后：

```text
Ready to Measure
```

### 方案 C — Mechanical Stop

通过机械限位结构确保每次闭合后的预张力基本一致。

V1 原型优先推荐：

**方案 A + App Calibration**

---

## 7.3 测量位置标准化

为了减少不同位置导致的围度差异，Recovery Band 必须具备明确的定位结构。

例如：

```text
        │
        │ Alignment Line
        │
════════╪════════
 Recovery Band
        │
        ○
     Patella
```

定位方式可以是：

- 髌骨中心对齐线；
- 髌骨上方固定距离；
- 护膝 / App 提示用户测量位置；
- 测量带上的视觉刻度。

V1 建议统一使用：

### Fixed Distance Above Patella

例如：

> 5 cm above patella

最终具体距离可在原型测试后调整。

---

# 8. 核心功能列表

## F01 — Pre-Activity Baseline Measurement

运动前使用 Recovery Band 分别测量左右膝。

流程：

```text
Measure Left Knee
↓
Measure Right Knee
↓
Record Baseline
```

每侧记录：

- stretch baseline；
- skin temperature；
- pain；
- stiffness。

App 输出：

```text
Baseline Complete ✓
```

---

## F02 — Contralateral Comparison

使用健侧腿作为同一用户的内部参照。

记录：

```text
Left Knee Baseline
Right Knee Baseline
```

计算：

### Circumference Difference

```text
R0 - L0
```

### Temperature Difference

```text
TR0 - TL0
```

系统不称其为 clinical control group，而定义为：

### Within-Subject Reference

或：

### Contralateral Comparison

---

## F03 — Activity Load Monitoring

运动过程中由 Motion Knee Sleeve 中的 IMU 记录运动刺激。

V1 建议采集：

- 三轴加速度；
- 三轴角速度；
- 活动持续时间；
- acceleration peaks；
- deceleration events；
- movement intensity；
- impact-like events；
- directional-change intensity。

输出：

### Activity Load Index

例如：

```text
TODAY'S SESSION

Duration                68 min
Movement Intensity      High
Sharp Decelerations      18
High-Impact Events       14

Activity Load

████████░░
HIGH
```

---

## F04 — Post-Activity Static Measurement

运动结束后：

1. 停止运动；
2. 脱掉 Motion Knee Sleeve；
3. 擦干明显汗液；
4. 静息 2–3 分钟；
5. 使用 Recovery Band；
6. 分别测量左右膝；
7. 每侧静止 30–60 秒。

记录：

- circumference / stretch response；
- skin temperature；
- pain；
- stiffness。

---

## F05 — Circumference Response Trend

Stretch Sensor 只用于：

### 静态、标准化、固定张力测量

而不是运动中实时测量。

计算：

```text
Right Response
=
(R1 - R0) / R0
```

```text
Left Response
=
(L1 - L0) / L0
```

例如：

```text
Right Knee
+1.8%

Left Knee
+0.4%
```

同时计算：

### Change in Asymmetry

```text
Post Difference - Baseline Difference
```

输出：

```text
Right-side circumference response
+1.4 percentage points
above contralateral side
```

V1 只表达：

### Circumference / Swelling Trend

不表达：

- fluid volume；
- effusion volume；
- clinical swelling diagnosis。

---

## F06 — Skin Temperature Response

Recovery Band 内侧集成小型皮肤温度传感器。

记录：

```text
Baseline
Post
+15 min
+30 min
+45 min
+60 min
```

重点关注：

### Δ Temperature

即：

```text
Current Temperature
-
Personal Baseline
```

以及：

### Left–Right Difference

例如：

```text
Right Knee
+0.8°C

Left Knee
+0.4°C

Contralateral Difference
+0.4°C
```

温度数据只作为：

### Post-Activity Thermal Response Indicator

不作为 inflammation detection。

---

## F07 — Temperature Measurement Quality Control

为了降低以下因素的干扰：

- 汗液；
- 环境温度；
- 护膝保温；
- 运动后全身产热；
- 局部血流增加；

系统使用标准化检测协议：

```text
Finish Activity
↓
Remove Sleeve
↓
Dry Visible Sweat
↓
Rest 2–3 min
↓
Apply Recovery Band
↓
Remain Still
↓
Measure 30–60 s
```

V1 可增加环境温湿度记录作为后续优化方向，但不是必需。

---

## F08 — Self-Reported Symptoms

App 允许用户记录：

### Pain
0–10

### Stiffness
0–10

### Subjective Swelling
Normal / Mild / Moderate / Significant

可选：

- discomfort；
- instability；
- fatigue。

---

## F09 — Recovery Curve

推荐时间点：

```text
Baseline
0 min
15 min
30 min
45 min
60 min
```

若仍未恢复，可继续：

```text
90 min
120 min
```

记录：

- circumference response；
- temperature response；
- pain；
- stiffness。

输出：

```text
Response
│
│      ●
│     / \
│    /   ●
│   /      \
│ ●          ●
│              ●
└────────────────── Time
0   15   30   45   60 min
```

---

## F10 — Recovery Time

定义：

主要恢复指标重新进入个人 baseline tolerance range 所需时间。

系统不以绝对医学阈值为核心，而优先使用：

### Personal Baseline Range

例如：

```text
Expected Recovery
45–65 min

Actual Recovery
92 min
```

---

## F11 — Long-Term Personal Baseline

系统经过多次活动建立：

```text
YOUR NORMAL RESPONSE

Light Activity
Typical Recovery
20–30 min

Moderate Activity
40–60 min

High Activity
70–100 min
```

长期比较：

```text
Similar Frisbee Sessions

                 MAY        JULY

Activity Load     82          80
Circumference    +1.8%       +0.7%
Temperature      +0.8°C      +0.3°C
Pain              4/10        1/10
Recovery Time      95 min      42 min
```

---

# 9. 用户流程

## Step 01 — Baseline

运动前使用 Recovery Band。

### Left Knee

- align band；
- adjust to correct tension；
- remain still；
- measure 30–60 s。

### Right Knee

重复相同步骤。

App记录：

```text
Baseline Complete ✓
```

---

## Step 02 — Wear Motion Knee Sleeve

穿上带 IMU 的运动护膝。

Sensor Pod 自动连接 App。

---

## Step 03 — Start Activity

选择：

```text
Frisbee
Badminton
Tennis
Running
Gym
Other
```

点击：

### Start Session

---

## Step 04 — During Activity

IMU 持续记录：

```text
Acceleration
Gyroscope
Timestamp
```

用户正常运动。

系统尽量不打断运动。

---

## Step 05 — Finish Activity

运动结束。

App显示：

```text
SESSION COMPLETE

Duration
68 min

Activity Load
HIGH
```

---

## Step 06 — Transition to Recovery Measurement

用户：

```text
Remove Knee Sleeve
↓
Dry Visible Sweat
↓
Rest 2–3 min
↓
Use Recovery Band
```

---

## Step 07 — Measure Left and Right Knee

依次测量左右膝。

每次：

```text
Align
↓
Correct Tension
↓
Remain Still
↓
30–60 s Measurement
```

---

## Step 08 — Repeat Recovery Checks

推荐：

```text
0 min
15 min
30 min
45 min
60 min
```

若未恢复，可延长。

---

## Step 09 — Recovery Summary

示例：

```text
TODAY'S FRISBEE SESSION

Activity Load
HIGH

Right Knee Circumference Response
+1.5%

Left Knee Circumference Response
+0.4%

Right-side Difference
+1.1 percentage points

Temperature Response
Right +0.7°C
Left  +0.3°C

Pain
2 / 10

Recovery Time
48 min
```

---

# 10. 技术架构

```text
                 AFTERMOTION SYSTEM

        ┌────────────────────────┐
        │ Motion Knee Sleeve     │
        │                        │
        │ IMU                    │
        │ MCU + BLE              │
        │ Battery                │
        └───────────┬────────────┘
                    │
                    ↓
              Activity Load


        ┌────────────────────────┐
        │ Recovery Band          │
        │                        │
        │ Stretch Sensor         │
        │ Temperature Sensor     │
        │ Fixed-Tension System   │
        └───────────┬────────────┘
                    │
                    ↓
        Circumference + Thermal
               Response


                    ↓
              Mobile App

        Baseline → Load
                 ↓
             Response
                 ↓
             Recovery
```

---

# 11. Motion Knee Sleeve 技术要求

## 11.1 MCU

推荐：

### ESP32-S3 Development Board

功能：

- Bluetooth Low Energy；
- sensor acquisition；
- basic filtering；
- timestamp；
- battery management interface。

---

## 11.2 IMU

推荐：

### BMI270

替代：

- MPU6050；
- ICM-42688；
- LSM6DS3。

记录：

- acceleration；
- angular velocity。

Prototype 推荐采样：

### 50–100 Hz

---

## 11.3 Battery

推荐：

### 3.7 V LiPo

容量：

### 500–1000 mAh

---

# 12. Recovery Band 技术要求

## 12.1 Stretch Sensor

推荐：

### Conductive Rubber Stretch Sensor

或：

### Conductive Elastic Sensor

用途：

- 检测周向形变；
- 辅助确认 band tension；
- 输出 normalized circumference response。

注意：

V1 不要求直接输出医学级 mm 级围度值。

优先输出：

```text
Relative Change %
```

---

## 12.2 Skin Temperature Sensor

推荐：

### TMP117

要求：

- small form factor；
- digital output；
- skin-side placement；
- stable contact。

Prototype 推荐：

### 1 sample / second

---

## 12.3 Band Tension Control

必须满足：

- 可调节；
- 每次相同起始张力；
- 可重复定位；
- 正确张力状态可被用户确认。

V1 可通过：

- mechanical clasp；
- pre-marked tension zone；
- stretch sensor calibration；

实现。

---

# 13. 数据处理

## 13.1 Activity Load

基础处理：

```text
Raw Acceleration
↓
Filtering
↓
Vector Magnitude
↓
Peak Detection
↓
Session Features
```

输出：

- intensity；
- peak count；
- impact-like event count；
- deceleration event count；
- session load。

---

## 13.2 Circumference Response

运动前：

```text
Left = L0
Right = R0
```

运动后：

```text
Left = L1
Right = R1
```

单腿变化：

```text
Left Response
=
(L1-L0)/L0
```

```text
Right Response
=
(R1-R0)/R0
```

左右差异：

```text
Contralateral Difference
=
Right Response - Left Response
```

---

## 13.3 Temperature Response

```text
Right ΔT
=
Right Current - Right Baseline
```

```text
Left ΔT
=
Left Current - Left Baseline
```

左右差值：

```text
ΔT Asymmetry
=
Right ΔT - Left ΔT
```

---

# 14. Measurement Protocol

所有 Recovery Band 数据必须尽量采用相同条件。

## Before Activity

- 相似室内 / 环境条件；
- 静息；
- 相同测量位置；
- 相同 band tension；
- 同一条 Recovery Band 分别测左右腿。

## After Activity

1. 脱掉运动护膝；
2. 擦去明显汗液；
3. 静息 2–3 分钟；
4. 使用 Recovery Band；
5. 对准定位标志；
6. 调整到标准张力；
7. 保持腿部姿势一致；
8. 静止 30–60 秒；
9. 测量左右腿。

---

# 15. 原型硬件采购清单 BOM

## A. Motion Knee Sleeve

| 硬件 | 数量 | 推荐规格 | 用途 |
|---|---:|---|---|
| ESP32-S3 Dev Board | 1 | DevKitC 等 | 主控 + BLE |
| BMI270 Breakout | 1 | 6-axis IMU | Activity Load |
| 3.7V LiPo | 1 | 500–1000mAh | 供电 |
| LiPo Charger | 1 | USB-C | 充电 |
| 运动护膝 | 1–2 | 稳定、舒适 | IMU载体 |
| Silicone Wire | 少量 | 细软线 | 模块连接 |
| Velcro / Snap | 若干 | — | 固定 Sensor Pod |
| 3D Printed Pod | 1 | PLA / PETG / TPU | 电子模块外壳 |

---

## B. Recovery Band

| 硬件 | 数量 | 推荐规格 | 用途 |
|---|---:|---|---|
| Stretch Sensor | 2–3 | Conductive Rubber / Elastic | 围度变化 |
| TMP117 | 1 | I²C Temperature Sensor | 皮肤温度 |
| 弹力织带 | 若干 | 柔软、可调 | Band主体 |
| 磁吸扣 / 卡扣 | 若干 | Fixed Closure | 固定起始张力 |
| Alignment Marker | 1套 | Printed / Sewn | 测量定位 |
| Silicone Wire | 少量 | 细软线 | Sensor连接 |
| 小型 MCU | 1 | ESP32-C3 / ESP32-S3 可选 | Recovery Band独立读取 |
| 小型 LiPo | 1 | 200–500mAh | Recovery Band供电 |

### MVP 简化版

Recovery Band 可以暂时：

- 不集成独立 MCU；
- 用导线接到主控；
- 或先手动记录 stretch / temperature 数据。

后续再无线化。

---

## C. 开发工具

- 面包板；
- 杜邦线；
- 电阻包；
- 万用表；
- 电烙铁；
- 焊锡；
- 热缩管；
- 剥线钳；
- 针线包；
- 热熔胶枪（可选）。

---

# 16. 推荐原型路线

## Prototype 01 — Manual Validation

目标：

先验证“这个数据有没有价值”。

方式：

- IMU 记录 Activity Load；
- Recovery Band 可先使用手工软尺 + 温度计；
- App 手动录入左右腿数据。

验证：

```text
Load
↓
Left / Right Response
↓
Recovery Trend
```

---

## Prototype 02 — Sensorized Recovery Band

加入：

- Stretch Sensor；
- TMP117；
- Fixed-Tension Structure。

验证：

- 相同位置重复测量；
- 相同张力重复测量；
- 左右腿差异；
- 运动前后差异。

---

## Prototype 03 — Integrated Motion Sleeve

实现：

```text
IMU
↓
ESP32
↓
BLE
↓
App
```

---

## Prototype 04 — Full AfterMotion System

完成：

```text
Baseline
↓
Motion Knee Sleeve
↓
Activity
↓
Recovery Band
↓
Post-Activity Measurements
↓
Recovery Curve
↓
Historical Comparison
```

---

# 17. MVP Success Criteria

V1 不要求证明医学有效性。

项目成立的基本标准：

## Motion Data

IMU 可以稳定记录：

- session duration；
- activity intensity；
- acceleration changes；
- impact-like events。

## Recovery Band

能够在固定位置和固定起始张力下：

- 重复读取 stretch 数据；
- 重复读取 skin temperature；
- 左右腿测量具有可重复性。

## Workflow

用户能够完成：

```text
Baseline
→ Exercise
→ Measure
→ Recover
→ Review
```

## Data Value

至少能够呈现：

- Activity Load；
- Left–Right Circumference Response；
- Temperature Response；
- Pain / Stiffness；
- Recovery Curve。

---

# 18. 产品核心差异化

AfterMotion 的差异化不依赖某一种新型 sensor，而来自以下四部分组合：

## 01 — Return-to-Sport

聚焦从基础康复重新回到真实运动的过渡阶段。

## 02 — Load–Response Coupling

将：

```text
What I did
```

与：

```text
How my knee responded
```

联系起来。

## 03 — Contralateral Comparison

使用健侧作为同一用户的内部参照。

## 04 — Personal Recovery Baseline

比较：

> Me vs. My Past

而不是：

> Me vs. Average Population

---

# 19. 核心 UX 原则

避免：

```text
Your knee is inflamed.
```

改为：

```text
Your post-activity temperature response
was higher than your recent baseline.
```

避免：

```text
Your knee is swollen.
```

改为：

```text
Your right-knee circumference response
was higher than the contralateral side.
```

避免：

```text
Your knee is 72% recovered.
```

改为：

```text
Under a similar activity load,
your knee returned to baseline
26 minutes faster than four weeks ago.
```

---

# 20. 产品一句话定义

> **AfterMotion is a wearable system that helps people returning to sport understand how their knee responds to real-world physical load — and how quickly it recovers.**

短版：

> **Know not only how much you moved, but how your knee handled it.**

---

# 21. 系统概念表达

AfterMotion 不再是“一个万能智能护膝”。

而是两个清晰分工的工具：

### MOVE with the Sleeve

记录运动负荷。

### MEASURE with the Band

记录运动前后膝关节反应。

最终形成：

```text
MOVE
↓
MEASURE
↓
COMPARE
↓
UNDERSTAND
```

---

# 22. 作品集核心 Research Question

> **How might we make post-activity knee responses visible, so people recovering from injury can better understand their tolerance to real-world physical activity?**

项目最终讨论的不是：

> 如何做一个智能护膝？

而是：

> **如何让真实运动后的膝关节反应变得可见、可比较、可理解。**
