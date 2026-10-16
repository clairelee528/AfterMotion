#include <Arduino.h>
#include <Wire.h>

constexpr uint8_t TMP117_ADDRESS = 0x48;
constexpr uint8_t TEMPERATURE_REGISTER = 0x00;
constexpr uint8_t CONFIG_REGISTER = 0x01;
constexpr uint8_t DEVICE_ID_REGISTER = 0x0F;
// Continuous conversion, 1 second cycle, 8-sample averaging. RAM only.
constexpr uint16_t BENCH_CONFIG = 0x0220;
constexpr uint16_t DATA_READY = 0x2000;

unsigned long lastPollMs = 0;
unsigned long lastSampleMs = 0;
unsigned long sampleCount = 0;
unsigned long errorCount = 0;

bool readRegister(uint8_t reg, uint16_t &value) {
  Wire.beginTransmission(TMP117_ADDRESS);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(TMP117_ADDRESS, static_cast<uint8_t>(2)) != 2) {
    while (Wire.available()) Wire.read();
    return false;
  }
  const uint8_t highByte = Wire.read();
  const uint8_t lowByte = Wire.read();
  value = (static_cast<uint16_t>(highByte) << 8) | lowByte;
  return true;
}

bool writeRegister(uint8_t reg, uint16_t value) {
  Wire.beginTransmission(TMP117_ADDRESS);
  Wire.write(reg);
  Wire.write(static_cast<uint8_t>(value >> 8));
  Wire.write(static_cast<uint8_t>(value));
  return Wire.endTransmission(true) == 0;
}

void stopTest(const char *message) {
  Serial.println(message);
  Serial.println("Test stopped. Disconnect USB before checking wiring; then reset.");
  while (true) delay(1000);
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\nAfterMotion TMP117 temperature bench test");
  Serial.println("SDA=GPIO8 SCL=GPIO9 VDD=3V3 baud=115200");
  if (!Wire.begin(8, 9, 100000)) stopTest("ERROR: I2C failed to start.");
  Wire.setTimeOut(100);

  uint16_t deviceId = 0;
  if (!readRegister(DEVICE_ID_REGISTER, deviceId)) {
    stopTest("ERROR: Cannot read device ID at 0x48.");
  }
  Serial.printf("address=0x48 device_id=0x%04X\n", deviceId);
  // Bits 15:12 are revision; bits 11:0 identify the TMP117.
  if ((deviceId & 0x0FFF) != 0x0117) {
    stopTest("ERROR: Device is not identified as TMP117. Do not assume temperature is valid.");
  }
  if (!writeRegister(CONFIG_REGISTER, BENCH_CONFIG)) {
    stopTest("ERROR: Could not configure continuous conversion.");
  }
  uint16_t config = 0;
  if (!readRegister(CONFIG_REGISTER, config) || (config & 0x0FFF) != BENCH_CONFIG) {
    stopTest("ERROR: Configuration readback failed.");
  }
  Serial.println("TMP117 confirmed. Waiting for fresh temperature conversions...");
  Serial.println("Bench readings only; not a body/core temperature measurement.");
  lastSampleMs = millis();
}

void loop() {
  const unsigned long nowMs = millis();
  if (nowMs - lastPollMs < 100) return;
  lastPollMs = nowMs;

  uint16_t config = 0;
  if (!readRegister(CONFIG_REGISTER, config)) {
    errorCount++;
    Serial.printf("ERROR: configuration read failed; errors=%lu\n", errorCount);
    delay(900);
    return;
  }
  if ((config & DATA_READY) == 0) {
    if (nowMs - lastSampleMs >= 3000) {
      Serial.println("WARNING: No fresh temperature sample for 3 seconds. Check sensor connection.");
      lastSampleMs = nowMs;
    }
    return;
  }

  uint16_t raw = 0;
  if (!readRegister(TEMPERATURE_REGISTER, raw)) {
    errorCount++;
    Serial.printf("ERROR: temperature read failed; errors=%lu\n", errorCount);
    return;
  }
  // Explicit two's-complement conversion, including sub-zero temperatures.
  const int32_t signedRaw = raw < 0x8000 ? raw : static_cast<int32_t>(raw) - 65536;
  const float temperatureC = signedRaw * 0.0078125f;
  lastSampleMs = millis();
  if (temperatureC < -55.0f || temperatureC > 150.0f) {
    errorCount++;
    Serial.printf("ERROR: temperature out of sensor operating range; raw=0x%04X errors=%lu\n", raw, errorCount);
    return;
  }
  sampleCount++;
  Serial.printf("sample=%lu uptime_ms=%lu temperature_C=%.3f raw=0x%04X errors=%lu\n",
                sampleCount, lastSampleMs, temperatureC, raw, errorCount);
}
