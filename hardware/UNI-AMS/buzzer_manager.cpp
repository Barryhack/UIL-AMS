#include <Arduino.h>
#include "buzzer_manager.h"

// Enhanced Buzzer Manager for ESP32 Attendance System

BuzzerManager::BuzzerManager(int buzzerPin) : pin(buzzerPin), enabled(true) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

void BuzzerManager::setEnabled(bool enable) {
  enabled = enable;
  if (!enabled) {
    digitalWrite(pin, LOW);
  }
}

void BuzzerManager::playTone(int frequency, int duration) {
  if (!enabled) return;
  
  // Simple tone generation using digitalWrite
  int period = 1000000 / frequency;
  int halfPeriod = period / 2;
  
  unsigned long startTime = micros();
  while (micros() - startTime < duration * 1000) {
    digitalWrite(pin, HIGH);
    delayMicroseconds(halfPeriod);
    digitalWrite(pin, LOW);
    delayMicroseconds(halfPeriod);
  }
}

void BuzzerManager::playMelody(int frequencies[], int durations[], int length) {
  for (int i = 0; i < length; i++) {
    playTone(frequencies[i], durations[i]);
    delay(50); // Small pause between notes
  }
}

void BuzzerManager::playBootup() {
  int freq[] = {523, 659, 784}; // C, E, G
  int dur[] = {200, 200, 400};
  playMelody(freq, dur, 3);
}

void BuzzerManager::playSuccess() {
  int freq[] = {659, 784, 1047}; // E, G, C
  int dur[] = {150, 150, 300};
  playMelody(freq, dur, 3);
}

void BuzzerManager::playError() {
  int freq[] = {392, 330, 262}; // G, E, C (descending)
  int dur[] = {200, 200, 500};
  playMelody(freq, dur, 3);
}

void BuzzerManager::playWarning() {
  for (int i = 0; i < 3; i++) {
    playTone(440, 200); // A note
    delay(100);
  }
}

void BuzzerManager::playScanning() {
  playTone(880, 100); // High A
  delay(50);
  playTone(660, 100); // E
}

void BuzzerManager::playModeSwitch() {
  int freq[] = {523, 659, 523, 659}; // C-E-C-E
  int dur[] = {100, 100, 100, 100};
  playMelody(freq, dur, 4);
}

void BuzzerManager::playHeartbeat() {
  playTone(200, 100);
  delay(50);
  playTone(200, 100);
  delay(800);
}

void BuzzerManager::playNetworkConnected() {
  int freq[] = {523, 659, 784, 1047}; // C major arpeggio
  int dur[] = {100, 100, 100, 200};
  playMelody(freq, dur, 4);
}

void BuzzerManager::playNetworkDisconnected() {
  int freq[] = {1047, 784, 659, 523}; // Descending C major
  int dur[] = {100, 100, 100, 200};
  playMelody(freq, dur, 4);
}

// Global buzzer manager instance
BuzzerManager* buzzerMgr;
