# AfterMotion Day 3 数据显示规范

## 原则

1. 数值必须同时显示单位或量表范围；
2. 相同数据类型在所有页面使用相同精度；
3. 左右侧必须显示文字标签，颜色仅作为辅助；
4. 缺失数据不显示为 0，统一显示 `Not recorded` 或对应状态；
5. 变化值明确显示正负号；
6. Activity Load 和身体反应不能被表达成医学安全结论。

## 格式

| 数据 | 格式 | 示例 |
|---|---|---|
| 温度 | 1 位小数 + °C | `33.4°C` |
| 百分比变化 | 正负号 + 1 位小数 | `+1.5%`、`-0.4%` |
| 症状评分 | 整数 + 空格 + `/ 10` | `2 / 10` |
| 少于 60 分钟的时长 | 整数分钟 | `48 min` |
| 超过 60 分钟的时长 | 小时 + 分钟 | `1 hr 8 min` |
| Activity 进行中计时 | `mm:ss` | `24:06` |
| 记录时间 | 本地 2 位小时和分钟 | `14:30` |
| Activity Load | 指数 + 等级 | `82 · High` |
| Checkpoint | Post activity 或整数分钟 | `Post activity`、`15 min` |
| 完成数量 | 已完成 / 总数 | `3 / 5` |

## 状态文案

### Session

- `Session in progress`
- `Activity live`
- `Activity paused`
- `Session complete`
- `Ended early`

### 测量

- `Ready to capture`
- `Measuring`
- `Recorded`
- `1 of 2 knees complete`
- `Complete`
- `Pending`
- `Locked`

### 设备

- `Connected`
- `Not connected`
- `Reconnecting`
- `Hardware selected`
- `Prototype data`

## 视觉规则

- 核心数字使用 Metric 字体层级；
- 单位与数字分离，单位降低一级视觉权重；
- 深青数据面板使用白字，荧光色只突出当前关键值；
- Complete 使用绿色，Active 使用荧光色，Pending 使用灰蓝；
- Warning 和 Error 使用独立语义色，不使用荧光色；
- `Left` 与 `Right` 保持固定颜色映射，但必须同时显示文字。

## 代码实现

集中格式化函数位于 `mobile/src/utils/format.ts`：

- `formatTemperature`
- `formatDuration`
- `formatScore`
- `formatSignedPercent`
- `formatRecordedTime`

页面不得重复实现同类型格式化逻辑。后续真实硬件数据接入时，先转换为领域数值，再通过这些函数显示。
