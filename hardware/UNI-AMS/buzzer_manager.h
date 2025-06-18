#ifndef BUZZER_MANAGER_H
#define BUZZER_MANAGER_H

class BuzzerManager {
private:
    int pin;
    bool enabled;
public:
    BuzzerManager(int buzzerPin);
    void setEnabled(bool enable);
    void playTone(int frequency, int duration);
    void playMelody(int frequencies[], int durations[], int length);
    void playBootup();
    void playSuccess();
    void playError();
    void playWarning();
    void playScanning();
    void playModeSwitch();
    void playHeartbeat();
    void playNetworkConnected();
    void playNetworkDisconnected();
};

extern BuzzerManager* buzzerMgr;

#endif // BUZZER_MANAGER_H 