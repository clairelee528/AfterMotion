"""Record real 03_tmp117_temperature output during a 120-second response test."""
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


def parse_sample(line):
    values = dict(token.split("=", 1) for token in line.split() if "=" in token)
    try:
        row = {key: int(values[key]) for key in ("sample", "uptime_ms", "errors")}
        row["temperature_C"] = float(values["temperature_C"])
        row["raw"] = values["raw"]
        int(row["raw"], 16)
        return row if math.isfinite(row["temperature_C"]) else None
    except (KeyError, ValueError):
        return None


def plot_recording(rows, destination):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot([r["elapsed_s"] for r in rows], [r["temperature_C"] for r in rows],
            color="#007f87", linewidth=1.8, label="Measured module temperature")
    for start, end, color, label in ((0, 30, "#dff2ee", "Rest prompt"),
                                    (30, 60, "#fff0d3", "Finger-contact prompt"),
                                    (60, 120, "#e7e8f8", "Release prompt")):
        ax.axvspan(start, end, color=color, alpha=.5, label=label)
    ax.set(xlabel="Host elapsed time (s)", ylabel="Temperature (°C)",
           title="AfterMotion | TMP117 real bench temperature response\nModule temperature; not core body temperature")
    ax.grid(alpha=.2)
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(destination / "temperature.png", dpi=180)
    fig.savefig(destination / "temperature.svg")
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port")
    parser.add_argument("--list-ports", action="store_true")
    args = parser.parse_args()
    if args.list_ports:
        for port in list_ports.comports():
            print(f"{port.device}  {port.description}")
        return
    if not args.port:
        parser.error("Specify --port or --list-ports")
    destination = (Path(__file__).resolve().parents[2] / "output" / "hardware-recordings" /
                   datetime.now().strftime("tmp117_%Y%m%d_%H%M%S_%f"))
    rows, diagnostics = [], []
    malformed = 0
    stopped = False
    print("请将TMP117放稳，暂时不要触碰感温端。首条有效样本后开始记录120秒。", flush=True)
    try:
        with serial.Serial(args.port, 115200, timeout=.25) as connection:
            destination.mkdir(parents=True, exist_ok=False)
            with (destination / "raw.log").open("w", encoding="utf-8") as raw_file, \
                    (destination / "temperature.csv").open("w", newline="", encoding="utf-8") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=["elapsed_s", "phase", "sample", "uptime_ms", "temperature_C", "raw", "errors"])
                writer.writeheader()
                waiting = time.monotonic()
                start, phase = None, None
                progress_at = -10
                while True:
                    now = time.monotonic()
                    if start is not None and now - start >= 120:
                        break
                    if start is None and now - waiting > 20:
                        print("20秒未收到有效温度。确认上传03_tmp117_temperature固件、端口和接线。")
                        break
                    if start is not None:
                        elapsed = now - start
                        next_phase = "rest" if elapsed < 30 else "contact" if elapsed < 60 else "release"
                        if next_phase != phase:
                            phase = next_phase
                            print({"rest": "0–30秒：保持静置，不触碰感温端。", "contact": "30–60秒：干燥手指轻触感温端，避开排针和焊点。",
                                   "release": "60–120秒：移开手指，保持静置，观察降温。"}[phase], flush=True)
                        if elapsed - progress_at >= 10:
                            print(f"已记录 {elapsed:.0f}/120秒，有效样本 {len(rows)}", flush=True)
                            progress_at = elapsed
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
                    row.update(elapsed_s=round(elapsed, 4), phase="rest" if elapsed < 30 else "contact" if elapsed < 60 else "release")
                    writer.writerow(row)
                    csv_file.flush()
                    rows.append(row)
    except KeyboardInterrupt:
        stopped = True
        print("提前停止，保留已接收数据。")
    except (serial.SerialException, OSError) as error:
        stopped = True
        print(f"串口/文件错误：{error}")
    if not rows:
        raise SystemExit("没有有效温度数据。关闭Arduino串口监视器，检查固件和端口后重试。")
    intervals, missing, resets, duplicates = [], 0, 0, 0
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
        "source": "real TMP117 serial measurements", "port": args.port,
        "sample_count": len(rows), "capture_span_s": rows[-1]["elapsed_s"],
        "completed_120s": rows[-1]["elapsed_s"] >= 118.5 and not stopped,
        "stopped_early_or_error": stopped,
        "observed_hz_from_device_intervals": 1000 / statistics.mean(intervals) if intervals else None,
        "median_device_interval_ms": statistics.median(intervals) if intervals else None,
        "max_device_interval_ms": max(intervals) if intervals else None,
        "missing_serial_sequence_numbers": missing, "resets_or_time_reversals": resets,
        "duplicate_samples": duplicates, "malformed_sample_lines": malformed,
        "device_error_counter_first": rows[0]["errors"],
        "device_error_counter_max": max(r["errors"] for r in rows), "diagnostics": diagnostics,
        "note": "Module temperature only. Phases are operator prompts, not detected contact events. Not a clinical calibration.",
    }
    for phase in ("rest", "contact", "release"):
        group = [r for r in rows if r["phase"] == phase]
        report[phase] = {"samples": len(group),
                         "first_C": group[0]["temperature_C"] if group else None,
                         "last_C": group[-1]["temperature_C"] if group else None,
                         "min_C": min(r["temperature_C"] for r in group) if group else None,
                         "max_C": max(r["temperature_C"] for r in group) if group else None}
    (destination / "quality.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"保存完成：{destination}\n有效样本：{len(rows)}；设备错误计数最大值：{report['device_error_counter_max']}")
    try:
        plot_recording(rows, destination)
        print("已生成 temperature.csv、raw.log、quality.json、temperature.png 和 temperature.svg。")
    except Exception as error:
        print(f"数据和报告已保存，绘图失败：{error}")
    if not report["completed_120s"]:
        print("本轮不足完整120秒，请按部分记录处理。")


if __name__ == "__main__":
    main()
