#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
  
  Serial.println("OLED Test Starting...");

  // Initialize I2C with lower frequency
  Wire.begin(21, 22);  // SDA, SCL
  Wire.setClock(100000);  // Set to 100kHz
  
  // Add delay after I2C initialization
  delay(100);

  // Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("SSD1306 allocation failed");
    for(;;); // Don't proceed, loop forever
  }
  
  // Add delay after display initialization
  delay(100);
  
  // Clear the buffer
  display.clearDisplay();
  delay(100);
  
  // Set text properties
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  
  // Display text
  display.println("Hello!");
  display.display();
  
  Serial.println("OLED Test Complete");
}

void loop() {
  // Nothing to do here
} 