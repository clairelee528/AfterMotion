# AfterMotion Day 5 测量流程与验收清单

## 1. 本日交付范围

Day 5 完成 Baseline 与 Recovery Band 的模拟测量闭环：

```text
佩戴与定位
→ 左膝倒计时测量
→ 右膝倒计时测量
→ 主观感受记录
→ 双膝结果
→ 单侧重测或返回 Session Overview
```

当前通过 `MockMeasurementDataSource` 提供可复现数据。真实 TMP117、Stretch Sensor 和 ESP32 蓝牙通信不在 Day 5 范围内，但后续硬件数据将复用同一 `KneeMeasurement` 接口。

## 2. 自动验证

在 `mobile` 目录运行：

```bash
npm run verify:domain
npm run typecheck
npm run lint
```

验证内容包括：

- 30 秒协议与 8 秒 Demo 计时状态；
- Mock 数据源连接、测量和断开；
- v1 → v2 数据迁移与测量质量恢复；
- checkpoint 的 Pending、Partial、Check-in needed、Complete 状态；
- 单侧重测只替换目标侧数据；
- 编辑主观感受不替换左右膝客观数据；
- Session 完成度和中断恢复判断。

## 3. 真机主路径

### Baseline

- [ ] 新建 Demo Session；
- [ ] Baseline 首先只允许开始左膝；
- [ ] 测量页显示侧别、5 cm 定位和固定扣位引导；
- [ ] 8 秒 Demo 倒计时进入 Measuring → Stabilizing → Complete；
- [ ] 测量中取消后回到 Ready，未保存数据；
- [ ] 保存左膝后自动进入右膝；
- [ ] 右膝页面显示换侧提醒；
- [ ] 保存右膝后进入主观感受；
- [ ] Pain 和 Stiffness 可逐级选择 0–10；
- [ ] 保存感受后进入 Baseline 结果页。

### Activity 后 Recovery

- [ ] Activity 完成前 Recovery checkpoint 不可进入；
- [ ] Post activity、15、30、45、60 分钟均可独立记录；
- [ ] 左膝完成后退出 App，再进入时从右膝继续；
- [ ] 双膝完成但未填感受时显示 Check-in needed；
- [ ] 点击 Check-in needed 直接进入感受页，不重复测量；
- [ ] 保存后 checkpoint 显示 Complete。

## 4. 编辑与重测

- [ ] 结果页可单独重测左膝；
- [ ] 左膝重测后右膝数据和时间不变；
- [ ] 左膝重测后主观感受不变；
- [ ] 结果页可单独重测右膝；
- [ ] 编辑感受后左右膝温度、Stretch 和记录时间不变；
- [ ] 重启 Expo Go 后所有修改仍然存在。

## 5. 异常与边界

- [ ] Manual 或 Bluetooth 尚不可用时显示 Source unavailable；
- [ ] 非法或不存在的 Session 显示安全返回入口；
- [ ] 测量页面退出后计时器停止；
- [ ] 提前结束 Session 时已保存测量继续保留；
- [ ] 完成 Session 需要所有 checkpoint 的双膝测量和主观感受。

## 6. Day 5 验收结论

全部自动验证通过，且真机主路径、恢复路径、编辑和重测清单通过后，Day 5 可以提交。真实硬件接入时只替换数据源实现，不修改页面、Session Store 或结果计算流程。
