# BMI270 真实数据记录

沿用 `04_bmi270_motion` 固件和已通过的独立接线；记录前关闭 Arduino Serial Monitor 和 Serial Plotter，避免串口占用。不自动上传固件或改接线。

首次安装（已在当前电脑准备，换电脑时执行）：

```bash
cd /Users/wengweng/Desktop/AfterMotion
python3 -m venv firmware/tools/.venv
firmware/tools/.venv/bin/python -m pip install -r firmware/tools/requirements.txt
```

查看可用端口：

```bash
firmware/tools/.venv/bin/python firmware/tools/record_bmi270.py --list-ports
```

使用当前 COM 口记录（以下是先前已用端口，若变化需替换）：

```bash
firmware/tools/.venv/bin/python firmware/tools/record_bmi270.py --port /dev/cu.usbmodem5CF80461341
```

从第一条有效样本开始记录90秒，终端提示三个阶段：0–30秒桌面静止、30–60秒缓慢转动、60–90秒重新放稳。不佩戴、不甩动、不拉扯接线；阶段标记表示操作提示，不是软件自动识别动作。

输出位于 `output/hardware-recordings/bmi270_日期_时间/`：

- `motion.csv`：真实采样数据、电脑相对时间和提示阶段。
- `raw.log`：原始串口输出，保留错误、警告与启动信息（若接收到了）。
- `quality.json`：实际采样间隔、串口序号缺失、重启、错误及完成情况。
- `motion.png` / `motion.svg`：三轴加速度、加速度合量、三轴角速度图。

传感器内部 ODR=100Hz，但当前固件串口只约10Hz。这组数据用于桌面响应演示，不能宣称完整100Hz记录或已经验证冲击/负荷算法。设备 errors 是本次上电以来累计值；序号缺失也不能证明传感器内部丢样。电脑阶段时间与设备 uptime 分开保存。

Ctrl+C 可提前结束并保存已接收样本。不足90秒、重启或错误均记录在报告中，不自动判定测试通过。

## TMP117 温度响应记录

断电换接 TMP117（VDD→3V3、GND→GND、SDA→GPIO8、SCL→GPIO9），上传 `03_tmp117_temperature` 固件。关闭串口监视器后运行：

```bash
cd /Users/wengweng/Desktop/AfterMotion
firmware/tools/.venv/bin/python firmware/tools/record_tmp117.py --port /dev/cu.usbmodem5CF80461341
```

端口有变化时使用 `--list-ports` 查找并替换。沿用已安装依赖，无需重新安装。
终端提示：静置30秒 → 干燥手指轻触远离焊点的感温端30秒 → 移开观察60秒。不触碰裸露排针/焊点，不用热水或火源。
自动生成 `output/hardware-recordings/tmp117_日期_时间/`，包含 temperature.csv、raw.log、quality.json 和 PNG/SVG 曲线。
模块在接线、上传过程中可能被手温影响，记录前应静置至读数基本稳定。不要求达到37°C，也不要求60秒内完全回到环境温度。阶段底色表示提示时间，真实接触时间以操作为准。
