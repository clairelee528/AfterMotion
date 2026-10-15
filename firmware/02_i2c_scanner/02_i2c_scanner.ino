#include <Arduino.h>
#include <Wire.h>

constexpr int I2C_SDA_PIN = 8;
constexpr int I2C_SCL_PIN = 9;
constexpr uint32_t I2C_FREQUENCY_HZ = 100000;
constexpr unsigned long SCAN_INTERVAL_MS = 3000;

unsigned long lastScanMs = 0;

void scanI2cBus() {
  uint8_t deviceCount = 0;

  Serial.println();
  Serial.println("Scanning I2C bus...");

  for (uint8_t address = 1; address < 127; address += 1) {
    Wire.beginTransmission(address);
    const uint8_t error = Wire.endTransmission(true);

    if (error == 0) {
      Serial.printf("Found device at 0x%02X", address);
      if (address >= 0x48 && address <= 0x4B) {
        Serial.print(" (possible TMP117)");
      } else if (address == 0x68 || address == 0x69) {
        Serial.print(" (possible BMI270)");
      }
      Serial.println();
      deviceCount += 1;
    } else if (error == 4) {
      Serial.printf("Unknown bus error at 0x%02X\n", address);
    }
  }

  if (deviceCount == 0) {
    Serial.println("No I2C devices found.");
  } else {
    Serial.printf("Scan complete: %u device(s) found.\n", deviceCount);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println();
  Serial.println("AfterMotion I2C scanner");
  Serial.printf("SDA=GPIO%d SCL=GPIO%d frequency=%lu Hz\n",
                I2C_SDA_PIN,
                I2C_SCL_PIN,
                I2C_FREQUENCY_HZ);

  const bool started = Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, I2C_FREQUENCY_HZ);
  if (!started) {
    Serial.println("ERROR: I2C controller failed to start.");
    while (true) {
      delay(1000);
    }
  }

  scanI2cBus();
  lastScanMs = millis();
}

void loop() {
  const unsigned long nowMs = millis();
  if (nowMs - lastScanMs >= SCAN_INTERVAL_MS) {
    lastScanMs = nowMs;
    scanI2cBus();
  }
}

