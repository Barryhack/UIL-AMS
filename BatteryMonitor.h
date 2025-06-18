class BatteryMonitor {
private:
    static constexpr float MAX_BATTERY_VOLTAGE = 4.2;  // Maximum battery voltage
    static constexpr float MIN_BATTERY_VOLTAGE = 3.3;  // Minimum battery voltage
    static constexpr float VOLTAGE_DIVIDER_RATIO = 2;  // Voltage divider ratio if used
    static constexpr int ADC_RESOLUTION = 4095;        // ESP32 ADC resolution (12-bit)
    static constexpr float ADC_REFERENCE = 3.3;        // ESP32 ADC reference voltage
    // ... existing code ...
} 