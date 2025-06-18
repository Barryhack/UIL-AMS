#ifndef BUZZER_HANDLER_H
#define BUZZER_HANDLER_H

#include <Arduino.h>

class BuzzerHandler {
private:
  int pin;
  bool enabled;
  
  void playTone(int frequency, int duration);
  void playMelody(int frequencies[], int durations[], int length);
  
public:
  BuzzerHandler(int buzzerPin);
  bool init();
  void setEnabled(bool enable);
  
  // Sound patterns
  void playBootup();
  void playSuccess();
  void playError();
  void playWarning();
  void playScanning();
  void playModeSwitch();
  void playNetworkConnected();
  void playNetworkDisconnected();
  void playHeartbeat();
};

#endif
