# AfterMotion firmware bench tests

这些 Arduino sketches 用于 Day 9 硬件台架验证，按编号依次运行：

1. `01_board_smoke`：只连接 ESP32-S3，验证烧录、串口、Flash 和 PSRAM；
2. `02_i2c_scanner`：使用 GPIO8 / GPIO9 扫描 TMP117 和 BMI270。

接线和安全步骤见：

```text
docs/Day_09_Hardware_Bench_Setup.md
```

不要跳过单模块验证直接连接全部传感器。

