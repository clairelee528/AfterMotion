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

