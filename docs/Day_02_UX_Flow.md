# AfterMotion Day 2 用户体验流程

## 文档目的

本文件定义 AfterMotion 十天 MVP 的核心用户任务、主流程和交互边界。Day 2 的目标不是完成视觉设计，而是确保用户能够在没有专业人员陪同的情况下，从运动前测量一路完成到恢复总结，并始终理解当前状态和下一步操作。

## 第一阶段 核心用户任务

### 核心用户目标

用户希望在一次真实运动后回答：

> 这次运动给我的膝盖带来了多大负荷，我的受伤侧与另一侧相比产生了什么反应，以及它用了多久恢复到个人基线范围。

App 必须帮助用户完成一条连续任务链：

```text
准备
→ 建立运动前基线
→ 记录运动负荷
→ 记录运动后反应
→ 追踪恢复过程
→ 理解本次结果
```

### 流程设计原则

1. 一次只要求用户完成一个明确动作。
2. 系统可以推荐 Left → Right 的测量顺序，但用户可以从 Session 总览直接选择任一侧或任一恢复时间点。
3. 每个测量页面必须同时显示侧别、阶段和剩余时间。
4. 系统提示尚未完成的 Baseline，但不通过单向页面流程锁死其他阶段。
5. 测量失败时保留已完成的数据，不让用户从头开始。
6. 用户可以中断并恢复 Session，但系统必须记录真实测量时间。
7. 缺失或延迟的数据必须明确标注，不能自动补齐。
8. 结果只描述 Load、Response、Difference 和 Recovery，不提供医疗诊断。
9. 设备异常不能完全阻断体验；MVP 允许切换到手动输入或模拟数据。
10. 每个页面只提供一个主要行动按钮，次要操作降低视觉优先级。
11. Session 是可中断、可恢复的项目；Training 首页必须展示进行中 Session 的继续入口。
12. 所有 Session 页面必须提供返回 Training 首页的通路。
13. 主观感受允许独立修改，不要求用户重新完成传感器测量。

## Task 01 查看当前状态

### 用户意图

了解今天是否有进行中的 Session、下一步应该做什么，以及最近一次恢复结果。

### 进入条件

- 用户打开 App；
- 或从其他页面返回 Training。

### 页面必须回答

- 当前是否有进行中的 Session；
- 当前处于 Baseline、Activity 还是 Recovery；
- 下一步动作是什么；
- 下一次测量还有多久；
- 没有任务时如何开始新的 Session。

### 主要行动

- 无进行中 Session：`Start a session`；
- 有进行中 Session：`Continue session`；
- 等待恢复测量：`View recovery timeline`。

### 完成条件

用户进入正确的当前任务，不需要自己从菜单中寻找流程位置。

## Task 02 创建运动 Session

### 用户意图

开始记录一次真实运动。

### 输入

- Activity Type：Frisbee、Badminton、Tennis、Running、Gym、Other；
- Injured Side：Left 或 Right；
- Measurement Source：Mock、Manual 或 Bluetooth。

### 默认行为

- 自动带入上一次使用的 Injured Side；
- MVP 默认使用 Mock；
- 有已连接设备时可以使用 Bluetooth；
- 用户可以主动选择 Manual。

### 主要行动

`Continue to baseline`

### 完成条件

- 创建状态为 `draft` 的 Session；
- Activity Type 和 Injured Side 已保存；
- 用户进入 Baseline Preparation。

### 限制

- 同一时间只允许一个未完成的 Session；
- 创建新 Session 时如已有未完成 Session，应优先提示继续或结束旧 Session。

## Task 03 准备 Baseline 测量

### 用户意图

在相对一致的条件下完成运动前测量。

### 页面内容

- 坐下并保持腿部姿势稳定；
- 确认测量位置；
- Recovery Band 对准定位标志；
- 确认皮肤干燥；
- 保持相同起始张力；
- 说明将按照 Left → Right 顺序测量。

### 主要行动

`I'm ready`

### 完成条件

用户确认已经满足基本测量条件，进入左膝测量。

### 设计限制

准备说明保持在一个屏幕内，不在此处解释传感器原理。

## Task 04 测量左膝 Baseline

### 用户意图

完成左膝运动前 Stretch 与 Temperature 记录。

### 页面必须持续显示

- `Baseline`；
- `Left knee`；
- 张力状态；
- 稳定性状态；
- 测量倒计时；
- 当前数据来源。

### 测量状态

```text
Position band
→ Adjust tension
→ Ready
→ Measuring
→ Complete
```

### 主要行动

- Ready 前：无主要按钮或按钮禁用；
- Complete 后：`Record symptoms`。

### 症状输入

- Pain：0–10；
- Stiffness：0–10；
- Subjective Swelling：Normal、Mild、Moderate、Significant。

### 完成条件

- 左膝 Stretch、Temperature、Symptoms 和时间戳均已保存；
- 用户进入右膝测量。

## Task 05 测量右膝 Baseline

流程与左膝一致，但必须明确显示 `Right knee`。

### 完成条件

- 右膝数据已保存；
- 左右膝各存在一条有效 Baseline；
- Session 状态由 `draft` 变为 `baselineComplete`。

### 完成反馈

显示：

```text
Baseline complete
Left and right knees recorded
```

此时不展示风险判断，只确认数据完整。

## Task 06 准备 Motion Sleeve

### 用户意图

确认运动负荷数据来源已经准备好。

### Bluetooth 模式

- 显示设备名称和连接状态；
- 检查电量或数据流状态；
- 连接成功后允许继续。

### Manual 模式

- 说明活动结束后需要手动填写时长和强度；
- 不阻断 Session。

### Mock 模式

- 明确标注为 Demo Data；
- 不将模拟数据误标为真实测量。

### 主要行动

`Start activity`

### 完成条件

- Session 状态变为 `active`；
- 保存真实开始时间；
- 开始接收或生成 Activity Samples。

## Task 07 进行运动

### 用户意图

正常运动，不被 App 频繁打断。

### 页面显示

- Activity Type；
- 已持续时间；
- Motion Sleeve 状态；
- `Finish activity`；
- 次要操作 `Pause`。

### 不显示

- 实时医学风险；
- 实时肿胀或温度判断；
- 过度复杂的运动数据图表。

### 完成条件

用户确认结束运动，系统保存结束时间并生成 Activity Metrics。

## Task 08 结束运动并查看负荷摘要

### 用户意图

确认运动记录已经完成，并进入 Recovery 测量。

### 页面显示

- Duration；
- Movement Intensity；
- Deceleration Events；
- Impact-like Events；
- Activity Load Index；
- Load Level。

### 主要行动

`Begin recovery check`

### 完成条件

- Activity Metrics 已保存；
- 用户进入标准化 Recovery Preparation；
- Session 状态变为 `recovering`。

## Task 09 准备运动后测量

### 用户意图

降低汗液、护膝保温和即时运动产热对测量的影响。

### 页面步骤

```text
Remove Motion Sleeve
→ Dry visible sweat
→ Sit and keep legs still
→ Rest for 2–3 minutes
→ Apply Recovery Band
```

### 交互

- 显示 2–3 分钟倒计时；
- 用户可以查看测量位置说明；
- 倒计时结束后解锁主要按钮。

### 主要行动

`Measure left knee`

### 完成条件

记录恢复测量开始的真实时间，并进入左膝 Post-Activity Measurement。

## Task 10 完成一次 Recovery Check

### 固定顺序

```text
Measure left knee
→ Record left symptoms
→ Measure right knee
→ Record right symptoms
→ Save recovery check
```

### 推荐时间点

```text
0 min
15 min
30 min
45 min
60 min
```

必要时延长至：

```text
90 min
120 min
```

### 时间记录原则

- 时间点标签表示计划时间；
- 数据必须保存实际测量时间；
- 延迟测量显示 `Measured late`；
- 不把 19 分钟的测量伪装成 15 分钟；
- 左右膝分别保留自己的时间戳。

### 完成条件

- 当前时间点左右膝数据已保存；
- Recovery Curve 更新；
- App 判断是否回到 Personal Baseline Range；
- 用户进入 Recovery Timeline。

## Task 11 查看 Recovery Timeline

### 用户意图

了解已完成的测量、下一次测量时间和当前恢复趋势。

### 页面显示

- 已完成和待完成时间点；
- 下一次测量倒计时；
- Circumference Response；
- Temperature Response；
- Pain 与 Stiffness；
- 当前是否进入 Personal Baseline Range；
- 数据不足时的明确说明。

### 主要行动

- 到达时间点：`Start next check`；
- 尚未到时间：`Return to Training`；
- 需要延长：`Continue to 90 min`；
- 用户主动停止：`End tracking`，作为次要操作。

### 完成条件

- 主要指标回到个人 Baseline Range；
- 或用户在了解数据未完整的情况下主动结束；
- Session 状态变为 `complete`。

## Task 12 理解 Session Summary

### 用户意图

理解本次活动负荷、膝部反应和恢复时间之间的关系。

### 信息顺序

```text
What you did
→ How each knee responded
→ How long recovery took
→ How this compares with your recent baseline
```

### 页面显示

- Activity Type、Duration 和 Load；
- 受伤侧与对侧 Circumference Response；
- 受伤侧与对侧 Temperature Response；
- Pain 与 Stiffness 变化；
- Recovery Time；
- 与相似历史 Session 的比较；
- 数据质量或缺失说明。

### 禁止文案

- Your knee is inflamed；
- Your knee is swollen；
- Your knee is safe；
- You are ready to return to sport；
- Reinjury probability；
- Recovery percentage。

### 推荐文案模式

```text
Your right-knee temperature response was higher than your recent baseline.
```

```text
Under a similar activity load, your knee returned to baseline 18 minutes faster.
```

### 完成条件

用户可以回到 Training 或查看本次 Session 的完整详情。

## Task 13 回顾历史 Session

### 用户意图

查看长期变化，而不是只理解单次运动。

### 用户可以完成

- 浏览历史 Session；
- 按 Activity Type 查看；
- 打开 Session Detail；
- 比较相似负荷的两次 Session；
- 查看 Recovery Time 趋势。

### 数据不足状态

在不足以形成比较时显示：

```text
Complete more sessions to build your personal recovery baseline.
```

不得使用人群平均值替代个人数据。

## 非核心任务

以下任务不会进入 Day 2 主流程的最高层级：

- 修改账户资料；
- 云端同步；
- 医生或康复师分享；
- 导出完整原始传感器数据；
- 固件升级；
- 设备电池管理；
- 自定义医学阈值；
- 比赛回归建议。

这些功能不得占用 Training 主页面的主要行动位置。

## 第一阶段决策摘要

1. Training 是整个产品的任务中心，而不是数据 Dashboard。
2. 一个 Session 必须先完成左右膝 Baseline 才能开始 Activity。
3. 所有静态测量都固定采用 Left → Right 顺序。
4. 运动阶段尽量不打断用户。
5. Recovery Check 是可重复的标准化测量单元。
6. 实际时间戳优先于计划时间标签。
7. Summary 按 Load → Response → Recovery 组织。
8. Mock、Manual 和 Bluetooth 共享相同用户流程。
9. 缺失数据和延迟测量会被标记，不会被系统自动修复。
10. 产品只提供个人趋势和对侧比较，不提供医疗结论。

## 第一阶段完成标准

- 每个核心任务都有进入条件、主要动作和完成条件；
- Baseline、Activity 和 Recovery 的边界明确；
- 左右膝测量顺序明确；
- 数据来源差异不会改变主流程；
- 用户中断后可以根据 Session 状态继续；
- 主流程可以进入下一阶段的信息架构设计。
# Navigation revision: resumable session workspace

The session is not treated as one uninterrupted wizard. Training can span hours, so the user may leave after the baseline and return after activity.

- Training home shows a prominent **Continue current session** card.
- Each active session has an overview that exposes Before activity, Activity, and After activity as independently accessible stages.
- Left/right knee measurements and recovery checkpoints can be opened directly instead of forcing a fixed sequence.
- Subjective pain, stiffness, and swelling can be edited without repeating a sensor measurement.
- Every session screen provides a direct route back to Training home.
- Completed measurements show a compact result and feelings-edit action; measurement controls are not repeated unless the user explicitly chooses to redo data elsewhere.
- The Activity card clearly distinguishes Not started, In progress, Paused, and Complete. Active sessions reopen the live activity view; completed sessions open the activity summary.
- The immediate post-activity check belongs to the Session overview. The recovery checkpoint selector begins at 15 minutes to avoid duplicating that action.
- Session overview exposes Post activity and every 15/30/45/60-minute checkpoint directly. Each checkpoint shows Locked, Pending, Partially complete, or Complete and opens measurement or saved results accordingly.
- A session can be completed after all checkpoints or ended early at any stage. Ending requires confirmation and preserves all data already recorded.
- Opening a checkpoint starts one continuous measurement sequence across every required body target. For the knee MVP this is Left → Right; completing the left knee advances directly to the right knee. If interrupted, saved targets remain complete and re-entry resumes at the first missing target.
- Prototype-only Preview and simulation controls are excluded from the user-facing measurement flow.
