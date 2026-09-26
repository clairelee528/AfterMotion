# AfterMotion Day 2 异常与恢复流程

## 文档目的

本文件定义 Session 过程中可能出现的设备、测量、时间和数据异常，以及用户如何在不丢失已完成工作的情况下继续。异常处理的目标不是隐藏问题，而是让用户知道发生了什么、哪些数据受影响以及下一步可以做什么。

## 命名更新

底部主入口统一使用：

```text
Training      History      Settings
```

`Training` 取代此前的 `Today`，强调开始训练、继续训练和完成训练后恢复追踪的核心任务。

## 异常级别

## Blocking

当前步骤无法产生可用数据，用户必须修正或切换方案后继续。

示例：

- Baseline 缺少一侧；
- 测量过程中没有传感器数据；
- 数据来源断开且没有切换到 Manual；
- Session 数据无法保存。

## Recoverable Warning

用户可以继续，但数据质量或流程完整性受到影响。

示例：

- 测量晚于计划时间；
- Temperature 未完全稳定；
- 某个 Recovery checkpoint 被跳过；
- Activity 中途断开部分 IMU 数据。

## Informational

不影响当前任务，只需解释状态。

示例：

- 尚无 Personal Baseline Range；
- 尚无相似历史 Session；
- 当前使用 Mock 或 Manual 数据。

## 通用反馈结构

每条异常消息必须包含：

1. **发生了什么**：使用非技术语言描述问题；
2. **影响什么**：说明是否影响当前数据；
3. **如何继续**：提供一个主要恢复动作；
4. **其他选择**：必要时提供退出、重试或切换来源。

示例：

```text
Recovery Band disconnected

No measurement data is being received.
Reconnect the band or enter this measurement manually.

[Reconnect]
Enter manually
```

## Session 创建异常

## E01 已有未完成 Session

### 触发条件

用户在已有 `draft`、`baselineComplete`、`active` 或 `recovering` Session 时点击 `Start a session`。

### 反馈

```text
You already have a session in progress.
```

### 主要行动

`Continue current session`

### 次要行动

`End current session`

### 规则

- MVP 同时只允许一个进行中 Session；
- 不允许新 Session 静默覆盖旧 Session；
- 结束旧 Session 前需要二次确认。

## E02 缺少 Activity Type 或 Injured Side

### 触发条件

用户尝试进入 Baseline，但必要选项尚未完成。

### 反馈

在缺失字段附近显示说明，不使用全屏错误页。

### 恢复

完成必要选项后自动启用 `Continue to baseline`。

## 设备异常

## E03 Bluetooth 设备未连接

### 触发条件

Measurement Source 为 Bluetooth，但目标设备未连接。

### 反馈

明确显示哪个设备未连接：Motion Sleeve 或 Recovery Band。

### 主要行动

`Try again`

### 次要行动

- `Enter manually`；
- Demo 环境可显示 `Use demo data`。

### 规则

- 不自动将 Bluetooth 数据切换为 Mock；
- 切换数据来源需要用户明确确认；
- 保存每条数据的真实来源。

## E04 Activity 中途断开 Motion Sleeve

### 触发条件

Activity 进行中，连续一段时间没有接收到 IMU 数据。

### 反馈

Active Session 页面显示非阻断状态：

```text
Motion Sleeve disconnected
Activity timing is still running.
```

### 主要行动

`Reconnect`

### 规则

- Activity Timer 继续；
- 已接收样本保留；
- 重连后继续追加样本；
- Summary 标记数据缺口；
- 不根据不完整样本伪造完整 Activity Load。

## E05 Recovery Band 测量中断开

### 触发条件

Measurement 还未完成时失去数据连接。

### 反馈

暂停倒计时，不保存未完成测量。

### 主要行动

`Reconnect and retry`

### 次要行动

`Enter manually`

### 规则

当前侧别和 checkpoint 保留，用户不需要返回流程开头。

## 测量质量异常

## E06 Band 张力太松

### 状态

```text
Too loose
Tighten the band until the indicator reaches the target range.
```

### 行为

- 测量按钮保持禁用；
- 进入目标范围并稳定后变为 Ready；
- 不把过松数据保存为有效测量。

## E07 Band 张力太紧

### 状态

```text
Too tight
Loosen the band to return to the target range.
```

### 行为

- 测量按钮保持禁用；
- 不使用带有危险或诊断含义的红色警报文案；
- 只描述张力不在标准范围。

## E08 测量过程中移动

### 触发条件

读数波动或 IMU 稳定性指标超过原型阈值。

### 反馈

```text
Movement detected
Keep your leg still and try again.
```

### 恢复

- 暂停或重新开始有效测量窗口；
- 不删除此前另一侧的完成数据；
- 连续失败时允许 Manual Entry。

## E09 Temperature 尚未稳定

### 触发条件

测量时间达到最低值，但最近窗口仍存在明显漂移。

### 反馈

```text
Temperature is still stabilizing.
Keep the band in place for a little longer.
```

### 主要行动

`Continue measuring`

### 次要行动

`Save with quality note`

### 规则

选择保存时标记 `temperatureNotStable`，并在 Summary 的数据质量说明中显示。

## E10 传感器读数超出可接受输入范围

### 触发条件

- Stretch ADC 饱和；
- Temperature 无有效读数；
- 数值发生不可能的突变；
- Demo 阶段由异常开关模拟。

### 反馈

```text
We couldn't get a reliable reading.
Check the band position and connection, then try again.
```

### 恢复

- `Retry measurement`；
- `Enter manually`；
- `Exit and keep session`。

### 规则

系统只描述读数质量，不解释为膝部异常。

## E11 用户可能测错侧别

### 约束

系统无法可靠自动判断 Band 当前位于哪条腿。

### 预防

- 页面顶部持续显示大号 `LEFT KNEE` 或 `RIGHT KNEE`；
- 左右侧使用文字和方向图形，不只使用颜色；
- 开始测量前要求用户确认。

### 恢复

保存后、进入下一侧之前允许选择 `Measured the wrong side` 并重测当前侧。

## E12 用户希望重新测量

### 行为

- 当前侧的新测量替换当前 checkpoint 的旧测量；
- 原型阶段保留替换事件，但 Summary 只使用最新有效值；
- 不影响另一侧的数据。

## 时间异常

## E13 错过计划 checkpoint

### 示例

计划 15 分钟，实际 22 分钟完成。

### 显示

```text
15 min check
Measured at 22 min
7 min late
```

### 规则

- 使用实际时间绘制 Recovery Curve；
- checkpoint 标签仍用于流程组织；
- 标记 `measuredLate`；
- 不要求用户返回过去补测。

## E14 完全跳过 checkpoint

### 触发条件

下一个 checkpoint 已到达，但前一个没有任何数据。

### 反馈

```text
The 15 min check was missed.
Continue with the current check to keep tracking recovery.
```

### 规则

- 曲线保留缺口；
- 不进行插值伪造；
- Recovery Time 使用现有数据估计时必须显示数据不完整；
- Day 2 原型不实现自动估计。

## E15 60 分钟后尚未进入 Baseline Range

### 反馈

```text
Your measurements have not returned to your recent baseline range yet.
You can continue tracking at 90 and 120 minutes.
```

### 主要行动

`Continue to 90 min`

### 次要行动

`End tracking`

### 规则

- 不使用危险、受伤或炎症结论；
- 用户结束后 Summary 标记 `Recovery not observed during tracking window`；
- 不把 60 分钟当作强制正常阈值。

## E16 用户提前结束恢复追踪

### 确认内容

- 已完成数据会保留；
- Recovery Time 可能无法计算；
- Session Summary 会标记追踪提前结束。

### 主要行动

`Keep tracking`

### 次要行动

`End tracking now`

## App 中断与恢复

## E17 App 进入后台

### Activity 阶段

- Timer 使用时间戳计算，不依赖前台递增计时；
- 返回 App 后根据开始时间恢复显示；
- Day 2 原型只模拟该规则。

### Recovery 阶段

- 保存下一 checkpoint 的目标时间；
- 返回 App 后重新计算剩余时间；
- 不因 App 暂停而推迟测量计划。

## E18 App 被关闭后重新打开

### 恢复逻辑

```text
读取进行中 Session
→ 检查 Session 状态
→ 检查部分完成步骤
→ 计算真实时间
→ Training 显示正确主要行动
```

### 部分完成示例

- 左膝 Baseline 已完成、右膝未完成：恢复到右膝；
- Activity 进行中：进入 Active Session；
- 15 分钟 Recovery 左膝已完成：恢复到右膝；
- 已错过 checkpoint：进入当前可执行的 Recovery Check。

Day 2 已使用本地持久化保存 Session、部分完成步骤和 Activity 状态；Day 4 可继续完善迁移、保存失败提示和数据仓库边界。

## E19 页面返回或系统手势

### 规则

- 普通说明页允许直接返回；
- 测量中返回需要确认；
- Active Session 返回不能静默停止记录；
- 已完成步骤返回只查看，不自动覆盖已有数据；
- 离开 Session Flow 后，Training 提供明确的继续入口。

## 数据异常

## E20 尚无 Personal Baseline Range

### 反馈

```text
We're still building your personal baseline.
Complete more sessions to see your typical recovery range.
```

### 规则

- 展示当前 Session 的左右差异和时间序列；
- 暂不显示 Expected Recovery；
- 不使用人群平均值替代个人范围。

## E21 没有相似历史 Session

### 反馈

```text
No similar sessions yet.
Your comparison will appear after more sessions at a similar load.
```

### 规则

隐藏 Comparison Chart，保留本次 Summary。

## E22 左右两侧数据不完整

### 反馈

明确显示缺失的一侧和 checkpoint。

### 规则

- 不计算 Contralateral Difference；
- 仍可展示已有单侧响应；
- 提供补测入口时使用真实时间；
- 补测过晚时添加质量说明。

## E23 Session 保存失败

### 反馈

```text
This session hasn't been saved yet.
Keep the app open and try again.
```

### 主要行动

`Try saving again`

### 规则

- 不显示成功状态；
- 在保存成功前不允许静默退出；
- Day 2 已实现本地 Session 恢复；保存失败提示和重试策略留待 Day 4 完善。

## 安全边界

当用户主动记录显著不适时，产品不判断原因。可以使用通用提示：

```text
If you experience severe or worsening symptoms, stop the session and follow the guidance from your clinician.
```

系统不得自动输出：

- 炎症判断；
- 损伤诊断；
- 是否可以继续比赛；
- 是否需要治疗；
- 再损伤概率。

## 已定义的测量异常

以下状态保留在测量状态模型和异常规范中，但不再通过面向用户的 Preview 按钮触发。接入硬件后由真实设备状态触发：

1. Recovery Band disconnected；
2. Band too loose；
3. Movement detected；
4. Temperature still stabilizing；
5. Missed checkpoint；
6. Personal baseline not available。

其余异常在文档中定义，后续按实现优先级逐步加入。

## 第三阶段完成标准

- 设备、测量、时间、App 中断和数据异常均有恢复路径；
- 异常不会删除已经完成的有效数据；
- Manual 与 Mock 不会在用户不知情时替代 Bluetooth；
- 延迟和缺失数据使用真实时间表达；
- 数据质量问题不会被解释为身体异常；
- 低保真原型需要模拟的异常范围已经限定；
- 可以进入 Expo Router 低保真实现阶段。
