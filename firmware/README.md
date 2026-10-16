# AfterMotion firmware bench tests

这些 Arduino sketches 用于 Day 9 硬件台架验证，按编号依次运行：

1. `01_board_smoke`：只连接 ESP32-S3，验证烧录、串口、Flash 和 PSRAM；
2. `02_i2c_scanner`：使用 GPIO8 / GPIO9 扫描 TMP117 和 BMI270。
3. `03_tmp117_temperature`：确认 TMP117 Device ID，读取带时间戳的真实温度，每秒约一条；只需 ESP32 内置 Arduino/Wire，无第三方库。
4. `04_bmi270_motion`：单独连接 BMI270，检查 CHIP_ID、初始化和六轴数据；安装 SparkFun BMI270 Arduino Library（已用 1.0.3 验证）。传感器 100 Hz、串口约 10 Hz，仅用于桌面验证，不是完整运动数据记录器。

接线和安全步骤见：

```text
docs/Day_09_Hardware_Bench_Setup.md
```

不要跳过单模块验证直接连接全部传感器。

BMI270 真实串口 CSV 记录、采样质量统计和曲线生成见 [tools/README.md](tools/README.md)。

