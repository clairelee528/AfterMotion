# AfterMotion Day 9 硬件桌面搭建手册

## 1. 本阶段目标

本阶段只完成安全、可重复的桌面验证，不进行佩戴运动测试。

完成顺序：

1. ESP32-S3 单板可以烧录并输出串口信息；
2. TMP117 单独连接时能被 I²C 扫描到；
3. BMI270 单独连接时能被 I²C 扫描到；
4. TMP117 与 BMI270 可以共享同一条 I²C 总线；
5. 拉伸传感器转接板的供电与输出先用万用表验证；
6. 分压节点始终不超过 3.0 V 后，才连接 ESP32 ADC；
7. 最后再组合三个传感器。

阶段完成前，不进行跑跳、不连接电池、不贴肤佩戴裸露电路。

## 2. 本阶段使用的部件

- ESP32-S3 N16R8 开发板 × 1，另一块保留为备用；
- 面包板 × 2；
- Type-C 数据线；
- 公对公、公对母、母对母杜邦线；
- TMP117 模块；
- BMI270 模块；
- Elastreme Sense L 与转接板；
- 20 kΩ 电阻 × 2；
- 数字万用表；
- 双头鳄鱼夹；
- 绝缘胶带。

## 3. 安全规则

### 每次改线必须执行

1. 拔掉 ESP32 的 USB 线；
2. 等待 5 秒；
3. 修改接线；
4. 目视检查 3V3、5V 和 GND；
5. 使用万用表通断档检查是否存在明显短路；
6. 确认无误后再插 USB。

### 禁止操作

- 不要在通电状态下移动杜邦线；
- 不要把 ESP32 的 `3V3` 和 `5V` 接到同一条电源轨；
- 不要把任何模块的 VDD 接到 GPIO；
- 不要把 Elastreme 转接板的 0–5 V OUT 直接接 ESP32；
- 不要用电阻档或通断档测量正在通电的电路；
- 不要让金属工具同时碰到相邻引脚；
- 不要在面包板原型未绝缘时佩戴运动。

## 4. 统一引脚方案

以下方案按 ESP32-S3 DevKitC-1 的引脚能力制定：

| 功能 | ESP32-S3 引脚 | 说明 |
| --- | --- | --- |
| 传感器电源 | 3V3 | TMP117、BMI270 均使用 3.3 V |
| 公共地 | G / GND | 所有模块必须共地 |
| I²C SDA | GPIO8 | TMP117 和 BMI270 共享 |
| I²C SCL | GPIO9 | TMP117 和 BMI270 共享 |
| BMI270 INT | GPIO10 | 本阶段先不连接，后续中断采样使用 |
| Stretch ADC | GPIO4 / ADC1_CH3 | 分压验证通过后才连接 |

不要使用 GPIO19 和 GPIO20 作为当前传感器引脚，它们可能用于开发板原生 USB。不要使用 GPIO0 作为本阶段传感器引脚，以免影响启动模式。

## 5. 面包板布局

1. 将 ESP32 跨在面包板中间凹槽两侧。
2. USB 接口朝向面包板外侧，保证数据线可以插入。
3. 如果开发板太宽、两侧没有空孔，把 ESP32 放在一块面包板上，传感器放在第二块面包板上，用杜邦线连接。
4. 选一条红色电源轨作为 `3.3 V`，选一条蓝色电源轨作为 `GND`。
5. 用红线连接 ESP32 `3V3` 到红色电源轨。
6. 用黑线连接 ESP32 `G/GND` 到蓝色电源轨。
7. 在电源轨旁贴纸标记 `只允许 3.3V`。

注意：部分面包板的长电源轨在中间断开。用万用表通断档检查电源轨两端是否相通；不相通就用一根短跳线跨接。

## 6. Arduino IDE 环境

### 6.1 安装 Arduino IDE

从 Arduino 官方网站下载 macOS 版 Arduino IDE 2：

https://www.arduino.cc/en/software

安装完成后，将 Arduino IDE 放入 Applications 并打开。

### 6.2 安装 ESP32 开发板支持

1. 打开 `Arduino IDE → Settings`；
2. 找到 `Additional boards manager URLs`；
3. 添加稳定版地址：

```text
https://espressif.github.io/arduino-esp32/package_esp32_index.json
```

如果在中国大陆下载失败，可使用 Espressif 提供的镜像：

```text
https://jihulab.com/esp-mirror/espressif/arduino-esp32/-/raw/gh-pages/package_esp32_index_cn.json
```

4. 打开 `Tools → Board → Boards Manager`；
5. 搜索 `esp32`；
6. 安装发布者为 `Espressif Systems` 的 `esp32`；
7. 安装完成后重启 Arduino IDE。

### 6.3 选择开发板

1. 用支持数据传输的 Type-C 线连接 ESP32；
2. 打开 `Tools → Board → ESP32 Arduino`；
3. 优先选择 `ESP32S3 Dev Module`；
4. 不要选择普通的 `ESP32 Dev Module`；
5. 如果菜单中有与你板子完全一致的 `ESP32-S3-DevKitC-1`，也可以选择该项；
6. Flash Size 选择 `16MB`；
7. PSRAM 选择 `OPI PSRAM`；
8. 其余选项先保持默认。

如果使用开发板原生 USB 且串口没有输出，再将 `USB CDC On Boot` 改为 `Enabled` 后重新烧录。

### 6.4 识别端口

连接前后分别在终端执行：

```bash
ls /dev/cu.*
```

连接后新增的端口通常类似：

```text
/dev/cu.usbmodemXXXX
/dev/cu.usbserial-XXXX
/dev/cu.wchusbserialXXXX
```

在 Arduino IDE 的 `Tools → Port` 中选择这个新增端口。

## 7. Test 1：ESP32-S3 单板验证

### 7.1 此时的接线

只连接：

```text
Mac ── Type-C 数据线 ── ESP32-S3
```

不要连接 TMP117、BMI270 或拉伸传感器。

### 7.2 烧录程序

打开：

```text
firmware/01_board_smoke/01_board_smoke.ino
```

点击 Arduino IDE 左上角 Upload。

如果一直显示 Connecting：

1. 按住开发板 `BOOT`；
2. 短按一下 `RST/EN`；
3. 松开 `RST/EN`；
4. 再松开 `BOOT`；
5. 重新点击 Upload。

### 7.3 查看输出

1. 打开 `Tools → Serial Monitor`；
2. 波特率选择 `115200`；
3. 按一下开发板 `RST/EN`；
4. 应看到启动信息和每秒一次的 heartbeat。

通过标准：

- [ ] Upload 显示成功；
- [ ] 串口显示 `AfterMotion ESP32-S3 board smoke test`；
- [ ] 芯片型号包含 ESP32-S3；
- [ ] Flash 显示约 16 MB；
- [ ] PSRAM 显示非 0，通常约 8 MB；
- [ ] heartbeat 编号连续增加；
- [ ] 运行两分钟没有反复重启。

## 8. Test 2：TMP117 单模块扫描

### 8.1 断电

拔掉 USB，等待 5 秒。

### 8.2 接线

| TMP117 | ESP32-S3 | 建议线色 |
| --- | --- | --- |
| VDD | 3V3 | 红 |
| GND | GND | 黑 |
| SDA | GPIO8 | 蓝或绿 |
| SCL | GPIO9 | 黄 |
| ALT / ALERT | 不连接 | — |

TMP117 即使标注支持更高供电，本原型仍统一使用 3.3 V，使 I²C 逻辑电平与 ESP32 一致。

### 8.3 通电前检查

1. 万用表调到通断档；
2. 检查 3V3 电源轨与 GND 电源轨，不应持续蜂鸣；
3. 检查 VDD 确实进入红色 3.3 V 轨；
4. 检查 GND 确实进入公共地；
5. 确认 SDA 与 SCL 没有接反。

### 8.4 扫描

打开并上传：

```text
firmware/02_i2c_scanner/02_i2c_scanner.ino
```

串口监视器选择 115200。预期每三秒扫描一次，TMP117 常见地址为：

```text
0x48
```

根据模块地址焊盘配置，也可能为 `0x49`、`0x4A` 或 `0x4B`。

通过标准：

- [ ] 扫描结果稳定显示一个 TMP117 地址；
- [ ] 地址不会在不同数值之间随机跳动；
- [ ] 模块没有明显发热；
- [ ] ESP32 没有循环重启。

## 9. Test 3：BMI270 单模块扫描

先拔掉 USB，并暂时完全移除 TMP117，只保留 BMI270。

| BMI270 模块 | ESP32-S3 | 建议线色 |
| --- | --- | --- |
| 3.3V / VCC | 3V3 | 红 |
| GND | GND | 黑 |
| SDA | GPIO8 | 蓝或绿 |
| SCL | GPIO9 | 黄 |
| INT | 本阶段不连接 | — |

重新运行 I²C Scanner。BMI270 常见地址为：

```text
0x68
```

部分模块可能配置为：

```text
0x69
```

通过标准：

- [ ] 稳定扫描到 0x68 或 0x69；
- [ ] 模块没有明显发热；
- [ ] ESP32 没有循环重启；
- [ ] 轻触或移动模块不会导致 I²C 地址消失。

## 10. Test 4：共享 I²C 总线

断电后同时连接 TMP117 和 BMI270：

```text
ESP32 3V3 ── TMP117 VDD
           └─ BMI270 3.3V

ESP32 GND ── TMP117 GND
           └─ BMI270 GND

ESP32 GPIO8 SDA ── TMP117 SDA
                 └─ BMI270 SDA

ESP32 GPIO9 SCL ── TMP117 SCL
                 └─ BMI270 SCL
```

运行 I²C Scanner，预期同时看到：

- 一个 TMP117 地址：通常 0x48；
- 一个 BMI270 地址：通常 0x68 或 0x69。

如果单独连接都正常、组合后异常，优先检查：

1. 是否真正共地；
2. SDA/SCL 是否接反；
3. 面包板电源轨是否在中间断开；
4. 模块是否自带过强或重复的上拉电阻；
5. 杜邦线是否松动。

## 11. Test 5：拉伸传感器安全验证

这一步在确认转接板实物引脚后进行。先不要连接 ESP32 ADC。

已知转接板 OUT 可能达到 5 V，因此使用 20 kΩ + 20 kΩ 分压：

```text
转接板 OUT
    │
   20 kΩ
    │
    ├──── 分压测量点；验证后连接 GPIO4
    │
   20 kΩ
    │
   GND
```

先用万用表直流电压档测量：

1. 转接板 OUT 对 GND 的静止电压；
2. 传感器逐渐拉伸时 OUT 的最大电压；
3. 分压点对 GND 的静止电压；
4. 传感器逐渐拉伸时分压点的最大电压。

只有满足以下全部条件才能连接 GPIO4：

- [ ] 转接板 GND 与 ESP32 GND 共地；
- [ ] 分压点电压随拉伸连续变化；
- [ ] 整个拉伸范围内分压点不超过 3.0 V；
- [ ] 不存在接触一下就跳到 5 V 的情况；
- [ ] 两个电阻实际阻值已经用万用表确认。

## 11A. TMP117 真实温度读取（可在等待拉伸供电配件时进行）

状态：2026-10-16 用户确认真实温度读取测试通过。提供的样本 211–215 持续更新，温度从 32.438°C 平稳降至 31.688°C，errors 始终为 0。按本程序启动流程，能输出样本说明已通过 Device ID 和配置回读检查；用户未单独提供启动日志。

1. 拔掉 USB，等待 5 秒；移除拉伸适配板及其 OUT/ADC 接线。
2. 优先只连接 TMP117：VDD → 3V3、GND → GND、SDA → GPIO8、SCL → GPIO9；ALT 不连接。若两模块共享总线已接好且稳定，也可保留 BMI270，本程序不访问它。
3. 打开 `firmware/03_tmp117_temperature/03_tmp117_temperature.ino`，无需安装第三方库。
4. 使用已验证的 COM 口和 ESP32S3 Dev Module 设置；COM 口串口输出使用 USB CDC On Boot = Disabled。
5. 上传后打开 Serial Monitor，选择 115200 baud，短按 RST。
6. 预期出现 `device_id=0x0117`（高四位可能为其他修订号），随后 `TMP117 confirmed`，每秒约一条 `temperature_C`、样本序号、运行时间和错误数。
7. 桌面静置观察约 60 秒；用干燥手指轻触远离排针的感温端约 20–30 秒，避免碰到裸露焊点或同时接触相邻引脚；松开后观察约 60 秒。不要使用热水、火源或吹风机。
8. 温度应随接近暖物体而变化，移开后逐渐向环境温度恢复；不要求立即变化或达到 37°C。记录的是模块局部温度，不是核心体温。

通过标准（保留逐项核对；本轮实测结果见阶段记录）：

- [ ] Device ID 低 12 位为 0x117，配置写入及回读成功；
- [ ] 连续至少两分钟有新样本，样本序号递增；
- [ ] 升温和恢复趋势可观察，`errors=0`，无读取失败或无新样本警告；
- [ ] 无反复重启或明显发热。

若 ID 为 0x0116 或其他值，保留串口信息并核实模块，不将其按 TMP117 判定通过。
程序仅写易失的配置寄存器，不写 EEPROM、校准偏移或其他传感器。
寄存器、符号转换和 0.0078125°C/LSB 来自 [TI TMP117 数据手册](https://www.ti.com/lit/ds/symlink/tmp117.pdf)。

## 11B. BMI270 独立六轴读取

使用场景调整：BMI270 用于运动阶段，TMP117 用于运动后恢复带；后续按独立接线测试和开发，不要求两者同时采样。之前共享总线测试结果仍保留为历史验证。

1. 拔 USB，等待 5 秒，移除 TMP117 和拉伸适配板。
2. 只连接 BMI270：3.3V → ESP32 3V3、任一 GND → GND、SDA → GPIO8、SCL → GPIO9；INT 和另一 GND 无需接线。
3. 断电检查供电接线及短路后，插入 COM USB 接口。沿用 ESP32S3 Dev Module、USB CDC On Boot = Disabled、16MB Flash、OPI PSRAM 设置。
4. Arduino IDE 的 Tools → Manage Libraries 搜索并安装 **SparkFun BMI270 Arduino Library**，发布者 SparkFun；本次使用版本 1.0.3。不要误装面向特定 Arduino 板的 Arduino_BMI270_BMM150。
5. 打开 `firmware/04_bmi270_motion/04_bmi270_motion.ino`，上传；Serial Monitor 设为 115200，短按 RST。
6. 预期 CHIP_ID 为 0x24，随后 BMI270 ready。程序设置加速度 ±4g、角速度 ±500°/s，传感器输出率 100Hz，约每 100ms 打印一次当前数据；不记录所有 100Hz 样本。
7. 放在干燥绝缘桌面上静止 30 秒，观察 `a_norm_g` 接近 1g，三轴角速度接近 0°/s。小幅波动和零偏正常，不要求各轴全为零。
8. 手持模块边缘缓慢倾斜/转动，避免拉扯接线或触碰焊点。改变静止朝向后，重力在各轴上的分量改变；转动时角速度变化，停止后回到接近零。
9. 平放和翻面各静止约 10 秒，观察朝向改变；不要用敲击、甩动、跑跳来测试。
10. 连续运行两分钟，保留静止、转动、停止后三组串口数据。该读数不等同于膝关节角度或负荷指标。

通过标准（待实测）：

- [ ] CHIP_ID = 0x24，初始化和配置均成功；
- [ ] 样本序号和时间持续增加，errors=0，无无新样本警告；
- [ ] 静止时加速度合量约 1g、角速度接近零；
- [ ] 倾斜和转动时各轴合理变化，停止后恢复稳定；
- [ ] 连续两分钟没有重启或明显发热。

参考：[SparkFun BMI270 库和示例](https://github.com/sparkfun/SparkFun_BMI270_Arduino_Library)。

## 12. 故障排查

### Arduino IDE 看不到端口

1. 更换另一根确认可传数据的 Type-C 线；
2. 更换 Mac USB 口或转接器；
3. 按一次 RST/EN；
4. 进入 BOOT 下载模式；
5. 重新执行 `ls /dev/cu.*`；
6. 查看开发板 USB 转串口芯片是否为 CP210x、CH34x 或 CH343，并按芯片型号安装官方驱动。

### 上传成功但串口空白

1. 波特率确认是 115200；
2. 按一次 RST/EN；
3. 检查是否选中了上传时使用的同一个端口；
4. 尝试启用 `USB CDC On Boot` 后重新上传；
5. 如果板上有两个 USB 接口，优先尝试标注 UART 的接口。

### I²C 显示 No devices found

1. 立即拔 USB；
2. 检查 VDD、GND、SDA、SCL；
3. 用万用表测量模块 VDD 对 GND 是否约 3.3 V；
4. 单独测试一个模块；
5. 缩短杜邦线；
6. 更换一组杜邦线；
7. 不要在原因不明时改用 5 V。

### 模块发热或有异味

立即拔掉 USB，不再通电。拍摄正反面接线照片，并记录发热模块和接线方式。

## 13. 阶段记录

| 测试 | 日期 | 结果 | 地址 / 数值 | 问题 |
| --- | --- | --- | --- | --- |
| ESP32 board smoke | 2026-10-12 | Passed | ESP32-S3 rev 0.2; 16 MB flash; 8 MB PSRAM; heartbeat ≥397 s | 使用 COM 口 `/dev/cu.usbmodem5CF80461341`，115200 baud，运行稳定且未重启 |
| TMP117 I²C scan | 2026-10-12 | Passed | `0x48` | GPIO8 SDA / GPIO9 SCL；连续多次扫描均稳定发现 1 个设备 |
| BMI270 I²C scan | 2026-10-12 | Passed | `0x68` | GPIO8 SDA / GPIO9 SCL；连续多次扫描均稳定发现 1 个设备 |
| Combined I²C scan | 2026-10-12 | Passed | TMP117 `0x48`; BMI270 `0x68` | 共享 GPIO8/GPIO9；连续每轮均稳定发现 2 个设备 |
| Stretch voltage test |  | Pending |  |  |
| TMP117 real temperature | 2026-10-16 | Passed（用户确认） | sample 211–215；uptime_ms 208121–212021；32.438 → 31.688°C；errors=0 | 提供日志显示连续采样与平稳降温；完整升温过程未附日志，用户确认传感器正常 |
| BMI270 six-axis readings | 2026-10-16 | Passed（实测截图及用户确认） | sample 3470–3478；uptime_ms 349522–350322；a_norm_g 0.978–0.986；errors=0 | 截图显示静止读数正常、运行约 350 秒；用户另行确认转动时角速度变化、停止后恢复接近零。能输出样本表明程序已通过 CHIP_ID 和初始化检查 |
| BMI270 real CSV capture | 2026-10-16 | 真实记录与动作响应通过 | 902 条有效样本；90.0983 秒；10Hz；设备间隔均为 100ms；errors=0；无序号缺失、重复或重启 | 数据目录 `output/hardware-recordings/bmi270_20261016_235007_802165`。开始接收时 1 条格式不完整 sample 被排除；有效记录无序号缺失。实际转动约在 34–66 秒，阶段底色仅为操作提示。前后静止合量均值约 1.014g / 1.013g；图表显示转动响应及停止后稳定。仅验证约10Hz桌面记录，不代表完整100Hz采集或负荷算法验证 |
| TMP117 real CSV capture | 2026-10-17 | 真实记录与温度响应通过 | 122 条有效样本；119.8936 秒；约 1.009Hz；间隔中位数 1000ms、最大 1900ms；errors=0 | 数据目录 `output/hardware-recordings/tmp117_20261017_000314_619294`。静置 26.070 → 25.828°C；接触阶段升至 33.812°C；移开初期峰值 33.859°C，结束 26.883°C。无有效序号缺失、重复、重启或警告；开始接收时 1 条格式不完整 sample 被排除。阶段为提示时间，非自动接触检测；验证模块热响应，不代表体温校准或膝关节恢复验证 |

