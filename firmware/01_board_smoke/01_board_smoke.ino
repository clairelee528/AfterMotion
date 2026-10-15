#include <Arduino.h>

unsigned long lastHeartbeatMs = 0;
unsigned long heartbeatCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println();
  Serial.println("AfterMotion ESP32-S3 board smoke test");
  Serial.printf("Chip model: %s\n", ESP.getChipModel());
  Serial.printf("Chip revision: %d\n", ESP.getChipRevision());
  Serial.printf("CPU frequency: %u MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("Flash size: %u bytes\n", ESP.getFlashChipSize());
  Serial.printf("PSRAM size: %u bytes\n", ESP.getPsramSize());
  Serial.println("Expected: one heartbeat per second without rebooting.");
}

void loop() {
  const unsigned long nowMs = millis();
  if (nowMs - lastHeartbeatMs >= 1000) {
    lastHeartbeatMs = nowMs;
    heartbeatCount += 1;
    Serial.printf("heartbeat=%lu uptime_ms=%lu\n", heartbeatCount, nowMs);
  }
}

