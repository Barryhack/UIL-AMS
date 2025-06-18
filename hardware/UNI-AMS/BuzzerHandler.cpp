#include "BuzzerHandler.h"

BuzzerHandler::BuzzerHandler(int buzzerPin) : pin(buzzerPin), enabled(true) {}

bool BuzzerHandler::init() {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  Serial.println("Buzzer initialized successfully");
  return true;
}

void BuzzerHandler::setEnabled(bool enable) {
  enabled = enable;
  if (!enabled) {
    digitalWrite(pin, LOW);
  }
}

void BuzzerHandler::playTone(int frequency, int duration) {
  if (!enabled) return;
  
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

void BuzzerHandler::playMelody(int frequencies[], int durations[], int length) {
  for (int i = 0; i < length; i++) {
    playTone(frequencies[i], durations[i]);
    delay(50);
  }
}

void BuzzerHandler::playBootup() {
  int freq[] = {523, 659, 784}; // C, E, G
  int dur[] = {200, 200, 400};
  playMelody(freq, dur, 3);
}

void BuzzerHandler::playSuccess() {
  int freq[] = {659, 784, 1047}; // E, G, C
  int dur[] = {150, 150, 300};
  playMelody(freq, dur, 3);
}

void BuzzerHandler::playError() {
  int freq[] = {392, 330, 262}; // G, E, C (descending)
  int dur[] = {200, 200, 500};
  playMelody(freq, dur, 3);
}

void BuzzerHandler::playWarning() {
  for (int i = 0; i < 3; i++) {
    playTone(440, 200);
    delay(100);
  }
}

void BuzzerHandler::playScanning() {
  playTone(880, 100);
  delay(50);
  playTone(660, 100);
}

void BuzzerHandler::playModeSwitch() {
  int freq[] = {523, 659, 523, 659}; // C-E-C-E
  int dur[] = {100, 100, 100, 100};
  playMelody(freq, dur, 4);
}

void BuzzerHandler::playNetworkConnected() {
  int freq[] = {523, 659, 784, 1047}; // C major arpeggio
  int dur[] = {100, 100, 100, 200};
  playMelody(freq, dur, 4);
}

void BuzzerHandler::playNetworkDisconnected() {
  int freq[] = {1047, 784, 659, 523}; // Descending C major
  int dur[] = {100, 100, 100, 200};
  playMelody(freq, dur, 4);
}

void BuzzerHandler::playHeartbeat() {
  playTone(200, 100);
  delay(50);
  playTone(200, 100);
  delay(800);
}
