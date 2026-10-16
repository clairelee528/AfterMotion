"""Record real 04_bmi270_motion serial output; never generate substitute samples."""
import argparse
import csv
import json
import math
import statistics
import time
from datetime import datetime
from pathlib import Path

import serial
from serial.tools import list_ports

FIELDS = "sample uptime_ms ax_g ay_g az_g a_norm_g gx_dps gy_dps gz_dps errors".split()
INTEGER_FIELDS = {"sample", "uptime_ms", "errors"}


def parse_sample(line):
    values = dict(token.split("=", 1) for token in line.split() if "=" in token)
    if not all(key in values for key in FIELDS):
        return None
    try:
        row = {key: int(values[key]) if key in INTEGER_FIELDS else float(values[key])
               for key in FIELDS}
    except ValueError:
        return None
    if not all(math.isfinite(value) for value in row.values()):
        return None
    return row


def plot_recording(rows, destination):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    times = [row["elapsed_s"] for row in rows]
    fig, axes = plt.subplots(3, 1, figsize=(11, 8), sharex=True)
    for key, color in zip(("ax_g", "ay_g", "az_g"), ("#007f87", "#bd6900", "#7355ae")):
        axes[0].plot(times, [r[key] for r in rows], label=key, color=color, linewidth=1)
    axes[1].plot(times, [r["a_norm_g"] for r in rows], color="#007f87", label="Acceleration magnitude")
    axes[1].axhline(1, color="gray", linestyle="--", linewidth=.8, label="1 g reference")
    for key, color in zip(("gx_dps", "gy_dps", "gz_dps"), ("#007f87", "#bd6900", "#7355ae")):
        axes[2].plot(times, [r[key] for r in rows], label=key, color=color, linewidth=1)
    for ax, label in zip(axes, ("Acceleration (g)", "Magnitude (g)", "Angular velocity (deg/s)")):
        ax.set_ylabel(label)
        ax.grid(alpha=.2)
        ax.legend(loc="upper right", fontsize=8)
        for start, end, color in ((0, 30, "#dff2ee"), (30, 60, "#fff0d3"), (60, 90, "#dff2ee")):
            ax.axvspan(start, end, color=color, alpha=.4, zorder=-1)
    axes[2].set_xlabel("Host elapsed time (s); 0–30 still / 30–60 rotate / 60–90 still")
    fig.suptitle("AfterMotion | BMI270 real bench measurements\n100 Hz sensor ODR; approximately 10 Hz serial capture")
    fig.tight_layout()
    fig.savefig(destination / "motion.png", dpi=180)
    fig.savefig(destination / "motion.svg")
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="Exact COM USB serial path")
    parser.add_argument("--list-ports", action="store_true")
    args = parser.parse_args()
    if args.list_ports:
        for port in list_ports.comports():
            print(f"{port.device}  {port.description}")
        return
    if not args.port:
        parser.error("Use --port with your ESP32 COM port, or --list-ports")

    base = Path(__file__).resolve().parents[2] / "output" / "hardware-recordings"
    destination = base / datetime.now().strftime("bmi270_%Y%m%d_%H%M%S_%f")
    rows = []
    diagnostics = []
    malformed = 0
    disconnected = False
    interrupted = False
    print("请先把 BMI270 放稳。等待首条有效数据，之后自动记录90秒。", flush=True)
    try:
        with serial.Serial(args.port, 115200, timeout=.25) as connection:
            destination.mkdir(parents=True, exist_ok=False)
            with (destination / "raw.log").open("w", encoding="utf-8") as raw_file, \
                    (destination / "motion.csv").open("w", newline="", encoding="utf-8") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=["elapsed_s", "phase"] + FIELDS)
                writer.writeheader()
                waiting_since = time.monotonic()
                start = None
                phase = None
                progress_at = -10
                while True:
                    now = time.monotonic()
                    if start is not None and now - start >= 90:
                        break
                    if start is None and now - waiting_since > 20:
                        print("20秒未收到有效数据。确认固件、波特率及端口，必要时短按RST。", flush=True)
                        break
                    line = connection.readline().decode("utf-8", errors="replace").strip()
                    if not line:
                        continue
                    raw_file.write(line + "\n")
                    raw_file.flush()
                    if "ERROR" in line or "WARNING" in line:
                        diagnostics.append(line)
                        print(line, flush=True)
                    row = parse_sample(line)
                    if row is None:
                        if line.startswith("sample="):
                            malformed += 1
                        continue
                    if start is None:
                        start = time.monotonic()
                    elapsed = time.monotonic() - start
                    next_phase = "still_before" if elapsed < 30 else "rotate" if elapsed < 60 else "still_after"
                    if next_phase != phase:
                        phase = next_phase
                        print({"still_before": "0–30秒：保持静止。", "rotate": "30–60秒：现在缓慢转动模块，勿拉扯线。",
                               "still_after": "60–90秒：现在放稳，保持静止。"}[phase], flush=True)
                    if elapsed - progress_at >= 10:
                        print(f"已记录 {elapsed:.0f}/90秒，样本 {len(rows) + 1}，errors={row['errors']}", flush=True)
                        progress_at = elapsed
                    row.update(elapsed_s=round(elapsed, 4), phase=phase)
                    writer.writerow(row)
                    csv_file.flush()
                    rows.append(row)
    except KeyboardInterrupt:
        interrupted = True
        print("提前停止；已接收的数据保留。")
    except (serial.SerialException, OSError) as error:
        disconnected = True
        print(f"串口/文件错误：{error}")
    if not rows:
        raise SystemExit("没有有效样本。关闭Arduino串口监视器，检查端口和固件后重试。")

    intervals = []
    resets = 0
    missing = 0
    duplicates = 0
    for previous, current in zip(rows, rows[1:]):
        step = current["sample"] - previous["sample"]
        dt = current["uptime_ms"] - previous["uptime_ms"]
        if step < 0 or dt < 0:
            resets += 1
        elif step == 0 or dt == 0:
            duplicates += 1
        else:
            intervals.append(dt)
            missing += max(0, step - 1)
    report = {
        "source": "real BMI270 serial measurements", "port": args.port,
        "sensor_odr_hz": 100, "intended_serial_hz": 10,
        "note": "Host-polled bench capture; not all 100Hz sensor samples, not a clinical or activity-load validation.",
        "sample_count": len(rows), "capture_span_s": rows[-1]["elapsed_s"],
        "completed_90s": rows[-1]["elapsed_s"] >= 89 and not interrupted and not disconnected,
        "observed_hz_from_device_intervals": 1000 / statistics.mean(intervals) if intervals else None,
        "median_device_interval_ms": statistics.median(intervals) if intervals else None,
        "max_device_interval_ms": max(intervals) if intervals else None,
        "intervals_over_150ms": sum(dt > 150 for dt in intervals),
        "sample_counter_resets_or_time_reversals": resets,
        "missing_serial_sequence_numbers": missing, "duplicate_samples": duplicates,
        "device_error_counter_first": rows[0]["errors"],
        "device_error_counter_max": max(r["errors"] for r in rows),
        "malformed_sample_lines": malformed, "diagnostics": diagnostics,
        "disconnected": disconnected, "interrupted": interrupted,
    }
    for phase in ("still_before", "rotate", "still_after"):
        group = [r for r in rows if r["phase"] == phase]
        report[phase] = {"samples": len(group),
                         "mean_acceleration_magnitude_g": statistics.mean(r["a_norm_g"] for r in group) if group else None}
    (destination / "quality.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"保存完成：{destination}\n样本数：{len(rows)}；设备错误计数最大值：{report['device_error_counter_max']}")
    try:
        plot_recording(rows, destination)
        print("已生成 motion.csv、raw.log、quality.json、motion.png 和 motion.svg。")
    except Exception as error:
        print(f"原始数据与报告已保存，但绘图失败：{error}")
    if not report["completed_90s"]:
        print("本轮不足完整90秒，请按部分记录处理。")


if __name__ == "__main__":
    main()
