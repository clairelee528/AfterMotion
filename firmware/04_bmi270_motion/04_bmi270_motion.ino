#include <Arduino.h>
#include <Wire.h>
#include <math.h>
#include <SparkFun_BMI270_Arduino_Library.h>

constexpr uint8_t BMI270_ADDRESS = 0x68;
constexpr unsigned long POLL_INTERVAL_MS = 100; // 10 Hz bench display, not activity logging.
BMI270 imu;
unsigned long lastPollMs = 0;
unsigned long lastSampleMs = 0;
unsigned long sampleCount = 0;
unsigned long errorCount = 0;

void stopTest(const char *message) {
  Serial.println(message);
  Serial.println("Test stopped. Disconnect USB before checking wiring, then reset.");
  while (true) delay(1000);
}

void requireOk(int8_t result, const char *operation) {
  if (result == BMI2_OK) return;
  Serial.printf("ERROR: %s code=%d\n", operation, result);
  stopTest("BMI270 setup failed.");
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\nAfterMotion BMI270 motion bench test");
  Serial.println("VCC=3V3 GND=GND SDA=GPIO8 SCL=GPIO9 INT=not connected");
  if (!Wire.begin(8, 9, 100000)) stopTest("ERROR: I2C failed to start.");
  Wire.setTimeOut(100);

  // A responding I2C address alone does not identify the sensor.
  Wire.beginTransmission(BMI270_ADDRESS);
  Wire.write(static_cast<uint8_t>(0x00)); // CHIP_ID
  if (Wire.endTransmission(false) != 0 ||
      Wire.requestFrom(BMI270_ADDRESS, static_cast<uint8_t>(1)) != 1) {
    stopTest("ERROR: Cannot read chip ID at 0x68.");
  }
  const uint8_t chipId = Wire.read();
  Serial.printf("address=0x68 chip_id=0x%02X\n", chipId);
  if (chipId != 0x24) stopTest("ERROR: Chip ID does not match BMI270 (expected 0x24).");

  // The library loads Bosch's initialization configuration and enables both sensors.
  requireOk(imu.beginI2C(BMI270_ADDRESS, Wire), "initialization");
  requireOk(imu.setAccelODR(BMI2_ACC_ODR_100HZ), "accelerometer rate");
  requireOk(imu.setGyroODR(BMI2_GYR_ODR_100HZ), "gyroscope rate");
  bmi2_sens_config configs[2] = {};
  configs[0].type = BMI2_ACCEL;
  configs[1].type = BMI2_GYRO;
  requireOk(imu.getConfigs(configs, 2), "range config read");
  configs[0].cfg.acc.range = BMI2_ACC_RANGE_4G;
  configs[1].cfg.gyr.range = BMI2_GYR_RANGE_500;
  requireOk(imu.setConfigs(configs, 2), "range config write");
  Serial.println("BMI270 ready. Sensor ODR=100Hz; display polls at 10Hz.");
  Serial.println("Acceleration: g (includes gravity). Gyroscope: degrees/second, NOT angle.");
  lastSampleMs = millis();
}

void loop() {
  const unsigned long nowMs = millis();
  if (nowMs - lastPollMs < POLL_INTERVAL_MS) return;
  lastPollMs = nowMs;

  uint8_t status = 0;
  int8_t result = imu.getStatus(&status);
  if (result == BMI2_OK &&
      (status & (BMI2_DRDY_ACC | BMI2_DRDY_GYR)) != (BMI2_DRDY_ACC | BMI2_DRDY_GYR)) {
    if (nowMs - lastSampleMs >= 3000) {
      Serial.println("WARNING: No fresh six-axis sample for 3 seconds.");
      lastSampleMs = nowMs;
    }
    return;
  }
  if (result == BMI2_OK) result = imu.getSensorData();
  if (result != BMI2_OK) {
    errorCount++;
    Serial.printf("ERROR: motion read code=%d errors=%lu\n", result, errorCount);
    return;
  }
  const float ax = imu.data.accelX;
  const float ay = imu.data.accelY;
  const float az = imu.data.accelZ;
  const float gx = imu.data.gyroX;
  const float gy = imu.data.gyroY;
  const float gz = imu.data.gyroZ;
  if (!isfinite(ax) || !isfinite(ay) || !isfinite(az) ||
      !isfinite(gx) || !isfinite(gy) || !isfinite(gz)) {
    errorCount++;
    Serial.printf("ERROR: non-finite data errors=%lu\n", errorCount);
    return;
  }
  const float magnitudeG = sqrtf(ax * ax + ay * ay + az * az);
  sampleCount++;
  lastSampleMs = millis();
  Serial.printf("sample=%lu uptime_ms=%lu ax_g=%.3f ay_g=%.3f az_g=%.3f a_norm_g=%.3f gx_dps=%.2f gy_dps=%.2f gz_dps=%.2f errors=%lu\n",
                sampleCount, lastSampleMs, ax, ay, az, magnitudeG, gx, gy, gz, errorCount);
}
