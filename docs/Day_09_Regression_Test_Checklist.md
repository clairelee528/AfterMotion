# AfterMotion Day 9 软件回归测试清单

## 1. 文档目的

本清单用于确认 AfterMotion 在接入真实硬件前，基于模拟数据的核心软件流程已经稳定。所有测试结果只描述应用行为与记录数据，不用于判断损伤、炎症或运动安全性。

Day 9 阶段一的通过条件：

- 自动检查全部通过；
- 主流程不存在 P0 阻断；
- 中断后可以返回当前 Session；
- 已保存记录在 App 重启后仍然存在；
- Summary、History 和 Comparison 使用一致的单位、侧别和时间顺序。

## 2. 测试环境

每次执行前填写：

| 项目 | 记录 |
| --- | --- |
| 测试日期 |  |
| Git commit |  |
| 手机型号 |  |
| iOS / Android 版本 |  |
| Expo Go / Development Build 版本 |  |
| 测试人员 |  |
| 数据来源 | Mock / Hardware |

## 3. 自动检查

在终端执行：

```bash
cd /Users/wengweng/Desktop/AfterMotion/mobile
npm run verify:day9
```

检查结果：

- [ ] Session 领域逻辑验证通过
- [ ] TypeScript 检查通过
- [ ] ESLint 检查通过
- [ ] Expo Doctor 全部通过
- [ ] iOS Expo Export 成功
- [ ] 终端没有新的 Error

## 4. 真机测试准备

1. 结束旧的 Expo 进程。
2. 使用清缓存模式启动：

```bash
cd /Users/wengweng/Desktop/AfterMotion/mobile
npx expo start --clear
```

3. 在 Settings 点击 `Load or reset demo sessions`，建立统一演示数据。
4. 返回 Training，确认页面完成本地数据恢复后再操作。

## 5. 核心流程回归

### A. 启动与导航

| ID | 操作 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-A01 | 冷启动 App | App 正常打开，没有白屏或错误页 | [ ] Pass [ ] Fail |
| D9-A02 | 切换 Training、History、Settings | 页面可切换，当前导航图标显示选中状态 | [ ] Pass [ ] Fail |
| D9-A03 | 从二级页面使用左上角返回 | 返回上一层，不丢失已保存数据 | [ ] Pass [ ] Fail |
| D9-A04 | 从 Session 返回 Training | Training 显示正在进行的 Session 入口 | [ ] Pass [ ] Fail |

### B. 创建 Session 与 Baseline

| ID | 操作 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-B01 | 点击 Create a new session | 进入活动类型、受伤侧和数据源选择 | [ ] Pass [ ] Fail |
| D9-B02 | 未完成必要选择时继续 | 不能创建不完整 Session，页面有明确提示或禁用状态 | [ ] Pass [ ] Fail |
| D9-B03 | 创建一个新 Session | 进入 Session Overview，活动类型和受伤侧正确 | [ ] Pass [ ] Fail |
| D9-B04 | 完成左膝测量 | 自动进入右膝测量，不必返回 Overview | [ ] Pass [ ] Fail |
| D9-B05 | 完成右膝测量 | 进入本时间点的 Feelings 记录 | [ ] Pass [ ] Fail |
| D9-B06 | 保存 Baseline 感受 | Baseline 显示 Complete，Activity 可以开始 | [ ] Pass [ ] Fail |
| D9-B07 | 编辑已完成 Baseline 感受 | 原测量值保留，感受内容可以更新 | [ ] Pass [ ] Fail |

### C. Activity

| ID | 操作 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-C01 | 开始 Activity | 状态显示进行中，计时和样本数增加 | [ ] Pass [ ] Fail |
| D9-C02 | 暂停 Activity | 计时停止，状态显示 Paused | [ ] Pass [ ] Fail |
| D9-C03 | 恢复 Activity | 继续累计原有时长和样本，不从零开始 | [ ] Pass [ ] Fail |
| D9-C04 | Activity 进行中返回主页 | Training 显示 Session in progress | [ ] Pass [ ] Fail |
| D9-C05 | 从主页重新进入 | 返回正确 Activity 状态 | [ ] Pass [ ] Fail |
| D9-C06 | 结束 Activity | 生成 Load Index 和汇总指标，并进入 Recovery 阶段 | [ ] Pass [ ] Fail |

### D. Recovery Checkpoints

| ID | 操作 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-D01 | 打开 Post activity | 直接进入左膝，再连续进入右膝和 Feelings | [ ] Pass [ ] Fail |
| D9-D02 | 完成 Post activity | Overview 显示 Complete，Summary 数据更新 | [ ] Pass [ ] Fail |
| D9-D03 | 依次打开 15、30、45、60 min | 每个时间点独立保存并正确显示状态 | [ ] Pass [ ] Fail |
| D9-D04 | 某时间点只完成左膝后退出 | 再次进入时继续右膝，不覆盖左膝 | [ ] Pass [ ] Fail |
| D9-D05 | 某时间点完成双膝但未填 Feelings | 状态提示需要 Check-in，而不是 Complete | [ ] Pass [ ] Fail |
| D9-D06 | 完成全部五个时间点 | Session 可以正常完成 | [ ] Pass [ ] Fail |

### E. 提前结束与中断恢复

| ID | 操作 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-E01 | Baseline 未完成时结束 Session | 记录为 Ended early，不再占用当前 Session | [ ] Pass [ ] Fail |
| D9-E02 | Activity 中途结束 Session | 已有数据保留，History 标记 Partial data | [ ] Pass [ ] Fail |
| D9-E03 | Recovery 中途结束 Session | 已完成时间点保留，未完成项显示数据不足 | [ ] Pass [ ] Fail |
| D9-E04 | Session 进行中将 App 切到后台再返回 | 当前步骤和数据仍然存在 | [ ] Pass [ ] Fail |
| D9-E05 | Session 进行中完全关闭并重开 App | Training 提供 Continue current session | [ ] Pass [ ] Fail |
| D9-E06 | 完成 Session 后重启 App | 完成记录仍出现在 History | [ ] Pass [ ] Fail |

### F. Summary、History 与 Comparison

| ID | 操作 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-F01 | 打开完整 Session Summary | 按 Activity、Immediate response、Recovery 顺序展示 | [ ] Pass [ ] Fail |
| D9-F02 | 检查恢复折线图 | Baseline、Post、15、30、45、60 min 顺序正确 | [ ] Pass [ ] Fail |
| D9-F03 | 打开提前结束的 Summary | 缺失数据使用 `—` 或 Insufficient data，不伪造结果 | [ ] Pass [ ] Fail |
| D9-F04 | 使用活动与状态筛选 | 记录数量和卡片内容与筛选条件一致 | [ ] Pass [ ] Fail |
| D9-F05 | 切换 Latest / Earliest | History 顺序正确，原记录内容不变 | [ ] Pass [ ] Fail |
| D9-F06 | 选择两条 Frisbee 记录比较 | 自动判断 Earlier / Latest，显示九项指标 | [ ] Pass [ ] Fail |
| D9-F07 | 查看 What changed | 只使用更高、更低、更早、更晚、相近或不可比较 | [ ] Pass [ ] Fail |
| D9-F08 | 查看只有一条 Running 记录 | 对比按钮禁用，并提示没有匹配记录 | [ ] Pass [ ] Fail |
| D9-F09 | 尝试比较不同活动 | 不允许进入无意义的跨活动比较 | [ ] Pass [ ] Fail |

### G. 单位、侧别和非诊断文案

| ID | 检查项 | 预期结果 | 结果 |
| --- | --- | --- | --- |
| D9-G01 | 温度 | 使用 °C，变化值正负号正确 | [ ] Pass [ ] Fail |
| D9-G02 | 拉伸响应 | 使用百分比，不显示为厘米 | [ ] Pass [ ] Fail |
| D9-G03 | 时间 | Activity 使用时分秒；Recovery 使用分钟 | [ ] Pass [ ] Fail |
| D9-G04 | 左右膝 | Left / Right 与保存数据对应 | [ ] Pass [ ] Fail |
| D9-G05 | 受伤侧与对侧 | injured / contralateral 计算没有颠倒 | [ ] Pass [ ] Fail |
| D9-G06 | 风险文案 | 不出现诊断、炎症判断、受伤概率或安全回归结论 | [ ] Pass [ ] Fail |

## 6. 阶段一退出条件

- [ ] 自动检查全部通过
- [ ] D9-A 至 D9-G 已完成首轮测试或明确安排到后续阶段
- [ ] 所有失败项已登记到 Bug 记录
- [ ] 没有未登记的 P0 问题
- [ ] 可以开始硬件桌面搭建

