# AfterMotion Day 3 UI Kit V1

## 目的

将 `Recovery in Motion` 视觉方向转化为可复用 React Native 组件。组件负责统一颜色、排版、间距、触控尺寸和状态表达，页面只负责内容与业务组合。

## 基础组件

### Page

- 浅冰蓝页面背景；
- 默认水平边距 24；
- 支持安全区域和纵向滚动；
- 页面内容使用统一 16pt 节奏。

### PageHeading

- 支持 Eyebrow、32px 超粗标题、描述；
- 可选荧光胶囊 `highlight`；
- 一个页面最多使用一个标题高亮。

### Card

| Variant | 用途 |
|---|---|
| `default` | 常规任务和结果 |
| `muted` | 锁定、次级或等待内容 |
| `hero` | 当前 Session 和关键摘要 |
| `data` | Activity Load、Recovery Curve 等深青数据区域 |

### Button

| Variant | 样式 | 用途 |
|---|---|---|
| `primary` | 黑底白字 | 默认主要行动 |
| `highlight` | 荧光底黑字 | 当前阶段最重要行动 |
| `secondary` | 白底描边 | 次级行动 |
| `text` | 无容器 | 低优先级操作 |
| `danger` | 浅红底红字 | 结束、删除等风险操作 |

按钮最小高度 52；文字和容器对比度必须清晰；Disabled 状态降低透明度但保留标签可读性。

### Choice

- 默认白底描边；
- Selected 使用荧光底黑字；
- 同时提供 `accessibilityState.selected`，不只依赖颜色。

## 状态组件

### StatusTag

支持：

- `active`：荧光色；
- `complete`：绿色；
- `pending`：灰蓝；
- `warning`：暖橙；
- `error`：珊瑚红；
- `info`：信息蓝。

每个标签同时包含圆点和文字。

### SideBadge

- Left 使用蓝色浅底，并显示 `L · Left`；
- Right 使用暖棕橙浅底，并显示 `R · Right`；
- 受伤侧追加 `Injured side` 文字；
- 颜色不作为唯一侧别标识。

### Notice

支持 `info`、`warning`、`error` 和 `success`。采用浅色背景、边框、标题与解释文字，不使用大面积高饱和颜色。

## 业务组合组件

### StageCard

用于 Session Overview 的 Before activity、Activity、After activity：

- 圆形步骤编号；
- 阶段标题；
- StatusTag；
- 可插入数据、说明和操作。

### TimelineItem

用于 Post activity、15/30/45/60 分钟时间点：

- 状态节点；
- 时间点标签；
- StatusTag；
- 整行作为可点击目标。

### MeasurementProgress

用于 Baseline 和 Recovery 测量：

- 测量名称；
- 当前进度说明；
- 7px 粗进度条；
- 荧光色进度值。

### MetricTile

用于温度、拉伸、负荷和时长：

- 标签；
- 超大数字；
- 独立单位；
- 可选荧光重点样式。

## 可访问性与状态规则

1. 可点击区域不小于 44pt；
2. 重要状态同时使用颜色、文字和形状；
3. 左右侧同时使用字母、单词和辅助色；
4. 荧光底只使用黑色文字；
5. 深青数据面板使用白字和高对比关键值；
6. 一个页面只有一个主要行动；
7. Danger 操作不能使用品牌荧光色；
8. Pressed 状态同时提供透明度和轻微缩放反馈。

## 代码位置

- Tokens：`mobile/src/theme/tokens.ts`
- 正式组件：`mobile/src/components/ui.tsx`
- 迁移兼容层：`mobile/src/components/wireframe.tsx`

兼容层让 Day 2 页面立即继承基础视觉更新。阶段三将逐页改为直接使用正式组件，并组合 StageCard、TimelineItem、StatusTag、SideBadge 和 MetricTile。
