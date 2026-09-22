# AfterMotion 十天开发计划

## 文档目的

本计划用于在十天内完成 AfterMotion 作品集项目的核心 MVP。十天阶段的目标不是制造医疗级产品，而是交付一个可以稳定演示、能够说明产品价值、并跑通核心数据闭环的原型。

核心闭环为：

```text
Baseline
→ Activity Load
→ Post Activity Response
→ Recovery Curve
→ Historical Comparison
```

硬件实现可以采用真实传感器、模拟数据和手动录入相结合的方式。开发优先级依次为：产品逻辑正确、核心流程完整、数据表达易懂、演示稳定、硬件集成完整。

## 十天交付目标

十天结束时，项目应具备：

- 一套完整的移动端高保真界面；
- 一条可操作的 Baseline 到 Recovery 用户流程；
- Activity Load、左右膝反应和 Recovery Time 的基础计算；
- Recovery Curve 和历史 Session 对比；
- 可使用真实数据或演示数据稳定运行的原型；
- 可用于作品集展示的演示脚本、截图和项目说明；
- 清晰的非医疗声明和非诊断性数据文案。

## MVP 功能范围

### P0 必须完成

- 运动前左右膝 Baseline；
- Activity Session 创建、开始和结束；
- Activity Load 展示；
- 运动后左右膝测量；
- Pain、Stiffness 和 Subjective Swelling 记录；
- Circumference Response；
- Temperature Response；
- Recovery Curve；
- Recovery Time；
- Session Summary；
- 历史 Session 浏览与基础比较。

### P1 时间允许时完成

- 真实 IMU BLE 数据接入；
- Recovery Band 实时数据接入；
- 测量提醒；
- 相似运动和相似负荷筛选；
- 更完整的异常状态和数据质量反馈。

### P2 后续阶段

- 云端账户与多设备同步；
- 医生端或康复师端 Dashboard；
- 独立无线 Recovery Band；
- OTA 更新和完整配网；
- 环境温湿度校正；
- 机器学习负荷模型；
- 医学有效性验证；
- 量产级工业设计。

## 每日开发安排

## Day 1 范围定义与技术准备

### 当日目标

锁定十天内的开发边界，解决技术路线、数据结构和硬件采购风险。

### 执行步骤

1. 将 PRD 功能划分为 P0、P1 和 P2。
2. 明确定义受伤侧、健侧与左右腿数据之间的关系。
3. 定义一次 Session 从创建到恢复完成的生命周期。
4. 确认移动端技术栈、目标设备和最低支持范围。
5. 确定硬件数据接入方案：真实 BLE、串口导入、手动录入或模拟数据。
6. 整理并立即采购必要硬件，降低物流延迟风险。
7. 建立代码仓库、目录结构、任务看板和问题记录方式。
8. 为硬件未到货或接入失败准备可切换的模拟数据方案。

### 交付物

- MVP 范围清单；
- 系统架构草图；
- 数据字段清单；
- 技术选型说明；
- BOM 和采购状态；
- 初始项目仓库。

### 验收标准

- 所有页面和数据字段都有明确归属；
- 团队能够清楚说明十天内做什么、不做什么；
- 即使硬件没有及时到货，App 开发和最终演示仍可继续。

## Day 2 用户流程与低保真原型

### 当日目标

完成主流程、异常流程和页面结构，验证操作复杂度。

### 执行步骤

1. 绘制完整主流程：

   ```text
   Home
   → Baseline
   → Start Activity
   → Finish Activity
   → Recovery Checks
   → Session Summary
   ```

2. 补充设备未连接、张力不正确、测量中移动、错过恢复时间点、60 分钟后仍未恢复等异常分支。
3. 建立 App 信息架构和导航结构。
4. 完成核心页面线框图。
5. 制作可点击的低保真原型。
6. 检查运动后重复测量是否造成过高操作负担，并精简步骤。
7. 检查所有健康相关文案是否符合非诊断原则。

### 交付物

- 用户流程图；
- 信息架构；
- 低保真页面；
- 异常状态列表；
- 第一版点击原型。

### 验收标准

- 用户无需阅读完整说明书即可理解下一步操作；
- 每个页面都明确显示当前状态、下一步和剩余时间；
- 核心流程不存在死路或无法返回的状态。

## Day 3 视觉系统与高保真设计

### 当日目标

建立统一的界面语言，并完成核心流程的高保真设计。

### 执行步骤

1. 确定品牌色、字体、字号、间距、圆角和阴影规则。
2. 建立 Button、Device Status、Measurement Progress、Scale Input、Data Card、Chart、Timeline 和 Status Tag 等基础组件。
3. 完成 Home、Baseline、Activity Tracking、Recovery Measurement、Recovery Curve、Session Summary 和 History Comparison 页面。
4. 统一左右腿、受伤侧、健侧的颜色和标签规则。
5. 统一温度、比例、时长、负荷等级和症状评分的显示格式。
6. 检查风险信息是否同时使用文字和图形，避免仅依赖颜色。

### 交付物

- UI Kit；
- 核心页面高保真设计；
- 图表规范；
- 数据显示和文案规则。

### 验收标准

- 核心流程拥有连续的高保真页面；
- 图表、单位、小数位和左右腿标识保持一致；
- 页面质量满足作品集截图和演示录屏要求。

## Day 4 App 框架与数据模型

### 当日目标

搭建可运行的 App 骨架和可持续扩展的数据基础。

### 执行步骤

1. 初始化 App 工程并配置开发环境。
2. 配置导航、主题和通用组件目录。
3. 建立 User、Device、Session、BaselineMeasurement、ActivityMetrics、RecoveryMeasurement 和 SymptomRecord 数据模型。
4. 建立本地数据存储和读写接口。
5. 准备正常恢复、恢复较慢和长期改善三套演示数据。
6. 搭建 Home、History、Session Detail 等基础页面。
7. 建立计算逻辑与 UI 之间的数据接口。

### 交付物

- 可运行的 App 工程；
- 导航结构；
- 数据模型；
- 本地存储；
- 演示数据集。

### 验收标准

- App 可以正常启动并完成主要页面导航；
- 可以创建、保存并重新打开一个 Session；
- 三套演示数据可以稳定复现。

## Day 5 Baseline 与 Recovery Band 测量

### 当日目标

完成运动前左右膝测量和主观症状录入流程。

### 执行步骤

1. 实现 Left Knee 和 Right Knee 的顺序测量。
2. 加入测量位置和固定张力引导。
3. 实现 30 至 60 秒测量倒计时。
4. 实现 Ready、Measuring、Unstable 和 Complete 等状态。
5. 保存 Stretch、Temperature、时间和侧别数据。
6. 加入 Pain、Stiffness 和 Subjective Swelling 输入。
7. 实现 Baseline Complete 结果页面。
8. 使用模拟传感器值验证完整流程。

### 交付物

- Baseline 测量流程；
- 张力与稳定性状态；
- 症状录入；
- Baseline 数据记录。

### 验收标准

- 用户可以独立完成左右膝 Baseline；
- 张力未达到范围时不能直接完成测量；
- 每条数据都具有时间、侧别和测量类型。

## Day 6 Activity Session 与负荷计算

### 当日目标

完成运动记录流程，并将 IMU 数据或模拟数据转换为可理解的负荷指标。

### 执行步骤

1. 实现 Frisbee、Badminton、Tennis、Running、Gym 和 Other 运动选择。
2. 实现 Start、Pause、Resume 和 Finish Session。
3. 接入真实 IMU 数据或模拟数据流。
4. 实现基础过滤、Vector Magnitude、Peak Detection、Deceleration Events 和 Impact-like Events。
5. 定义可解释且可重复的 Activity Load Index。
6. 将分数映射为 Light、Moderate 和 High。
7. 展示活动时长、Movement Intensity 和事件数量。
8. 保存原始或汇总后的 Session 数据。

### 交付物

- Activity Session 流程；
- 数据采集或模拟模块；
- Activity Load 计算；
- 活动完成页面。

### 验收标准

- 可以完整记录一次活动；
- 相同输入能得到一致的 Load Index；
- 页面明确说明该指标表示相对运动负荷，不代表损伤风险。

## Day 7 恢复监测与核心计算

### 当日目标

跑通运动后重复测量、恢复曲线和恢复时间计算。

### 执行步骤

1. 实现 Remove Sleeve、Dry Sweat、Rest 和 Apply Band 的标准化引导。
2. 支持 0、15、30、45 和 60 分钟测量点。
3. 支持 90 和 120 分钟扩展测量。
4. 计算单腿 Circumference Response。
5. 计算 Circumference Contralateral Difference。
6. 计算单腿 Temperature Delta 和 Temperature Asymmetry。
7. 记录 Pain 和 Stiffness 随时间的变化。
8. 定义个人 Baseline Tolerance Range 并计算 Recovery Time。
9. 绘制 Recovery Curve。

### 交付物

- 运动后标准化引导；
- 多时间点测量；
- 响应计算模块；
- Recovery Curve；
- Recovery Time 状态。

### 验收标准

- 每次新增测量后曲线即时更新；
- 左右腿和相对基线计算通过人工样例复核；
- 尚未回到基线范围时不会错误显示 Recovery Complete。

## Day 8 总结页与历史比较

### 当日目标

将分散的数据组织为用户可以理解的恢复故事。

### 执行步骤

1. 完成 Session Summary 页面。
2. 按照 Load、Response、Recovery 顺序组织结果。
3. 实现历史 Session 列表和详情页。
4. 实现相似运动和相似负荷的基础比较。
5. 展示恢复时间、围度响应、温度响应和症状变化。
6. 完成全部非诊断性结果文案。
7. 补充首次使用、数据不足和无相似 Session 等空状态。

### 交付物

- Session Summary；
- History 页面；
- 相似活动比较；
- 结果文案库。

### 验收标准

- 用户可以说明这次运动后膝盖如何反应以及恢复了多久；
- 至少能够比较两次相似 Session；
- 系统不输出炎症、损伤概率或安全回归结论。

## Day 9 系统联调与可用性测试

### 当日目标

消除核心流程阻断问题，并验证用户能否正确操作和理解结果。

### 执行步骤

1. 从 Baseline 到 Summary 跑通端到端流程。
2. 测试正常流程、错过时间点和测量异常三类场景。
3. 邀请 2 至 3 位测试者完成主要任务。
4. 记录任务完成率、完成时间、卡顿点、理解错误和操作负担。
5. 修复所有 P0 Bug。
6. 人工复核公式、单位、左右侧和时间戳。
7. 优化 Loading、Error、Empty 和 Device Disconnected 状态。
8. 检查 App 重启、流程中断和数据恢复能力。

### 交付物

- 端到端可运行版本；
- 可用性测试记录；
- Bug 和优化清单；
- 修复后的候选演示版本。

### 验收标准

- 主流程不存在阻断性问题；
- App 重启后已保存的数据仍然存在；
- 关键计算全部通过人工样例复核；
- 测试者能够理解 Summary 页面的主要结论。

## Day 10 演示封装与作品集整理

### 当日目标

冻结稳定版本，并完成用于展示项目价值的材料。

### 执行步骤

1. 固定一套稳定的演示数据和演示账户状态。
2. 编写 3 至 5 分钟演示脚本。
3. 录制完整核心流程。
4. 输出关键页面截图、硬件照片和必要的系统示意图。
5. 整理问题背景、Research Question、产品策略、系统分工、核心交互、数据模型、测试发现、限制和下一步。
6. 完善 README、运行说明和硬件连接说明。
7. 进行最终回归测试。
8. 创建稳定版本标签并冻结演示版本。

### 交付物

- 可稳定演示的 MVP；
- 演示视频或录屏；
- 演示脚本；
- 作品集截图与说明素材；
- README 和运行指南；
- 已知限制和下一阶段计划。

### 验收标准

- 不依赖临时修改即可展示完整产品故事；
- 演示能够从用户问题自然过渡到数据结果；
- 项目限制、非医疗属性和后续验证计划表达清楚。

## 每日工作节奏

每天建议拆分为四个阶段：

1. **开始前 20 分钟：** 回顾前一天结果，确认当天唯一核心目标。
2. **主开发阶段：** 优先完成端到端可运行路径，再补充局部细节。
3. **当日验证阶段：** 使用固定测试数据执行验收标准。
4. **结束前 30 分钟：** 更新任务状态、记录风险、提交代码并准备次日输入。

每日结束时必须留下一个可运行或可检查的版本，避免在最后两天集中集成所有模块。

## 关键公式

### Circumference Response

```text
Left Response = (L1 - L0) / L0
Right Response = (R1 - R0) / R0
```

### Circumference Contralateral Difference

```text
Right Response - Left Response
```

### Temperature Response

```text
Right Delta T = Right Current - Right Baseline
Left Delta T = Left Current - Left Baseline
```

### Temperature Asymmetry

```text
Right Delta T - Left Delta T
```

### Recovery Time

主要恢复指标重新进入个人 Baseline Tolerance Range 所需的时间。原型阶段使用明确、可追溯的规则计算，不使用未经验证的医学阈值。

## 范围调整原则

当进度落后时，按照以下顺序缩减范围：

1. 降低硬件集成程度，保留数据接口和模拟数据；
2. 减少动画和非核心视觉效果；
3. 简化历史筛选，但保留两次 Session 对比；
4. 暂缓提醒和次要异常流程；
5. 不删除 Baseline、Load、Response、Recovery 主闭环。

不得为了赶工而删除非医疗声明、左右侧标识、单位、测量时间或数据来源说明。

## 十天后的测试宽限期

建议在主体开发完成后安排 5 至 14 天测试期，不阻塞作品集 MVP 的完成。

重点验证：

1. 同一位置连续测量的重复性；
2. Recovery Band 重新佩戴后的重复性；
3. 不同起始张力对 Stretch 数据的影响；
4. 温度传感器达到稳定读数所需时间；
5. 汗液、环境温度和护膝保温造成的偏差；
6. 不同运动类型的 Activity Load Index 是否合理；
7. 用户是否愿意完成多个恢复时间点的测量；
8. Recovery Curve 和 Summary 文案是否容易理解；
9. Personal Baseline 需要多少次 Session 才能形成稳定范围。

## 项目完成定义

十天版本在满足以下条件时视为完成：

- 能稳定演示 Baseline、Activity、Response、Recovery 和 Summary；
- 至少一套输入来自真实传感器或真实手工测量；
- 硬件不可用时可以切换到可复现的演示数据；
- 关键计算经过人工样例验证；
- 用户能够理解结果但不会将其误解为医学诊断；
- 项目有完整的作品集叙事、演示素材和后续测试计划。
