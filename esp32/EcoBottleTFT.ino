/*
 * EcoBottle Machine - TFT login + bottle deposit
 * ===============================================
 * Student types their phone number and password on the 3.5" touch TFT,
 * logs in (verified against Supabase), then deposits a bottle. The bottle
 * event is sent to the Supabase Edge Function with the session token and
 * the points appear on the website dashboard.
 *
 * Hardware:
 *   - 3.5" 480x320 SPI TFT, driver ILI9488, resistive touch XPT2046
 *     (model KMRTM35018-SPI)
 *   - ESP32 dev board
 *   - Sensor on GPIO34 (analog) - adjust thresholds in classifyBottle()
 *
 * LIBRARIES (Arduino IDE -> Library Manager):
 *   1. "TFT_eSPI" by Bodmer  (https://github.com/Bodmer/TFT_eSPI)
 *   2. "ArduinoJson" by Benoit Blanchon (version 7.x)
 *
 * TFT_eSPI CONFIG (do this ONCE):
 *   Open  <Arduino>/libraries/TFT_eSPI/User_Setup.h  and set:
 *     - Uncomment:        #define ILI9488_DRIVER
 *     - Comment out EVERY other *_DRIVER line.
 *     - Uncomment and set:
 *         #define TFT_CS   5
 *         #define TFT_DC   2
 *         #define TFT_RST  4
 *         #define TOUCH_CS 21
 *     - Keep the ESP32 defaults for MOSI/SCLK/MISO (23/18/19).
 *   Save. If the screen shows garbage, set:
 *         #define SPI_FREQUENCY 27000000
 *
 * WIRING (match the labels printed on the display module):
 *   Module label  ->  ESP32 pin
 *   -----------------------------------
 *   VCC             3V3
 *   GND             GND
 *   CS              GPIO5
 *   RST / RESET     GPIO4
 *   DC / RS         GPIO2
 *   SDI / MOSI/SDA  GPIO23
 *   SCK / SCL       GPIO18
 *   BL             3V3
 *   SDO / MISO      DO NOT CONNECT  (ILI9488 MISO cannot tristate!)
 *   T_CLK           GPIO18
 *   T_CS            GPIO21
 *   T_DIN           GPIO23
 *   T_DO            GPIO19
 *   T_IRQ           (optional) GPIO22
 *
 * FIRST RUN (touch calibration):
 *   Keep TOUCH_CALIBRATION_MODE = true, upload, then tap the 5 markers.
 *   Copy the numbers printed on Serial into calData[] below and set
 *   TOUCH_CALIBRATION_MODE back to false.
 *
 * Set your WiFi credentials below before uploading.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <TFT_eSPI.h>

// ---------------- CONFIG ----------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* ECOBOTTLE_ENDPOINT = "https://snwqrcyqvhkscnpxxixb.supabase.co/functions/v1/esp32-bottle-intake";
const char* DEVICE_SECRET = "eco-0dm9fa4u3ix1ytrqkhwgon85";
const char* SUPABASE_ANON_KEY = "sb_publishable_EblF6OQS9j8OnSsrY9_oww_c7k9-gHz";

const char* MACHINE_ID = "COLLEGE-01";
const int sensorPin = 34;

#define TOUCH_CALIBRATION_MODE true
uint16_t calData[5] = { 0, 0, 0, 0, 0 };

// ---------------- State ----------------
enum State { ST_BOOT, ST_PHONE, ST_PASSWORD, ST_READY };
State state = ST_BOOT;

String phone = "";
String password = "";
String userId = "";
String userName = "";
int userPoints = 0;
String accessToken = "";

unsigned long lastReconnect = 0;

TFT_eSPI tft = TFT_eSPI();

// ---------------- UI layout (landscape 480x320) ----------------
const int KEY_X0 = 4;
const int KEY_Y0 = 84;
const int KEY_COLS = 4;
const int KEY_ROWS = 4;
const int KEY_COLW = (480 - 8) / 4;
const int KEY_ROWH = (320 - 84 - 8) / 4;

const char* keyLabels[KEY_ROWS][KEY_COLS] = {
  { "1", "2", "3", "DEL" },
  { "4", "5", "6", "DEL" },
  { "7", "8", "9", "DEL" },
  { "C",  "0", "DEL", "OK" },
};

// ---------------- Prototypes ----------------
void drawKeypad(const char* title, const String& input, bool mask);
void redrawInputBox(const String& input, bool mask);
void drawMessage(String line1, String line2, uint16_t color);
void drawReady();
void flashMessage(const String& msg);
const char* hitKey(int tx, int ty);
void handleKey(const char* key);
void tryLogin();
void submitBottle(const String& bottleType);
String classifyBottle(int value);
int postJson(const String& payload, String& response);

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  pinMode(sensorPin, INPUT);

  tft.init();
  tft.setRotation(1);   // landscape: 480 wide x 320 tall
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 24);
  tft.print("EcoBottle Machine");
  tft.setCursor(20, 52);
  tft.print("Connecting WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    tries++;
    if (tries % 4 == 0) {
      tft.fillRect(20, 76, 200, 18, TFT_BLACK);
      tft.setCursor(20, 76);
      tft.print(String(tries * 2) + "s");
    }
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected, IP: " + String(WiFi.localIP()));
  } else {
    Serial.println("WiFi FAILED");
  }

  if (TOUCH_CALIBRATION_MODE) {
    tft.fillScreen(TFT_BLACK);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.setTextSize(2);
    tft.setCursor(20, 20);
    tft.print("Touch calibration");
    tft.setCursor(20, 44);
    tft.print("Tap the 5 markers");
    uint16_t tmp[5];
    tft.calibrateTouch(tmp, TFT_MAGENTA, TFT_BLACK, 15);
    Serial.print("calData = { ");
    for (int i = 0; i < 5; i++) {
      Serial.print(tmp[i]);
      if (i < 4) Serial.print(", ");
    }
    Serial.println(" }");
    Serial.println("Copy these into calData[] and set TOUCH_CALIBRATION_MODE false.");
    memcpy(calData, tmp, sizeof(tmp));
    tft.setTouch(calData);
    delay(2000);
  } else {
    tft.setTouch(calData);
  }

  state = ST_PHONE;
  phone = "";
  password = "";
  drawKeypad("Enter Phone Number", phone, false);
}

// ---------------- Main loop ----------------
void loop() {
  if (WiFi.status() != WL_CONNECTED && millis() - lastReconnect > 10000) {
    WiFi.reconnect();
    lastReconnect = millis();
  }

  if (state == ST_PHONE || state == ST_PASSWORD) {
    uint16_t tx = 0, ty = 0;
    if (tft.getTouch(&tx, &ty)) {
      const char* key = hitKey(tx, ty);
      if (key) {
        handleKey(key);
        while (tft.getTouch(&tx, &ty)) delay(20);
      }
    }
  }

  if (state == ST_READY) {
    uint16_t tx = 0, ty = 0;
    if (tft.getTouch(&tx, &ty)) {
      if (tx >= 350 && tx <= 470 && ty >= 12 && ty <= 52) {
        accessToken = "";
        userId = "";
        userName = "";
        phone = "";
        password = "";
        state = ST_PHONE;
        drawKeypad("Enter Phone Number", phone, false);
        while (tft.getTouch(&tx, &ty)) delay(20);
        return;
      }
    }

    int value = analogRead(sensorPin);
    if (value > 1800) {
      submitBottle(classifyBottle(value));
      while (analogRead(sensorPin) > 1800) delay(120);
    }
  }

  delay(30);
}

// ---------------- Input handling ----------------
void handleKey(const char* key) {
  String& buf = (state == ST_PHONE) ? phone : password;
  int limit = (state == ST_PHONE) ? 10 : 32;
  const char* title = (state == ST_PHONE) ? "Enter Phone Number" : "Enter Password";
  bool mask = (state == ST_PASSWORD);

  if (strcmp(key, "DEL") == 0) {
    if (buf.length() > 0) buf.remove(buf.length() - 1);
    redrawInputBox(buf, mask);
  } else if (strcmp(key, "C") == 0) {
    buf = "";
    redrawInputBox(buf, mask);
  } else if (strcmp(key, "OK") == 0) {
    if (state == ST_PHONE) {
      if (phone.length() < 10) {
        flashMessage("Phone must be 10 digits");
        return;
      }
      state = ST_PASSWORD;
      password = "";
      drawKeypad("Enter Password", password, true);
    } else {
      if (password.length() < 6) {
        flashMessage("Password too short");
        return;
      }
      tryLogin();
    }
  } else {
    if (buf.length() < limit) {
      buf += key;
      redrawInputBox(buf, mask);
      if (state == ST_PHONE && phone.length() == 10) {
        state = ST_PASSWORD;
        password = "";
        drawKeypad("Enter Password", password, true);
      }
    }
  }
}

void flashMessage(const String& msg) {
  tft.setTextColor(TFT_RED, TFT_BLACK);
  tft.setTextSize(2);
  tft.fillRect(20, 56, 440, 20, TFT_BLACK);
  tft.setCursor(20, 56);
  tft.print(msg);
  delay(1200);
  drawKeypad(state == ST_PHONE ? "Enter Phone Number" : "Enter Password",
             state == ST_PHONE ? phone : password, state == ST_PASSWORD);
}

// ---------------- Login ----------------
void tryLogin() {
  drawMessage("Logging in...", "Please wait", TFT_YELLOW);

  String payload = "{\"action\":\"login\",\"phone\":\"";
  payload += phone;
  payload += "\",\"password\":\"";
  payload += password;
  payload += "\"}";

  String response;
  int code = postJson(payload, response);

  if (code != 200) {
    Serial.println("login HTTP " + String(code) + ": " + response);
    String msg = (code < 0) ? "Network / WiFi error" : "HTTP " + String(code);
    drawMessage("Login failed", msg, TFT_RED);
    delay(2200);
    state = ST_PHONE;
    phone = "";
    password = "";
    drawKeypad("Enter Phone Number", phone, false);
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, response);
  if (err || !doc["success"].as<bool>()) {
    String msg = doc["error"].as<String>();
    if (msg.length() == 0) msg = "Invalid phone or password";
    Serial.println(response);
    drawMessage("Login failed", msg, TFT_RED);
    delay(2500);
    state = ST_PHONE;
    phone = "";
    password = "";
    drawKeypad("Enter Phone Number", phone, false);
    return;
  }

  userId = doc["user_id"].as<String>();
  userName = doc["name"].as<String>();
  userPoints = doc["total_points"].as<int>();
  accessToken = doc["access_token"].as<String>();

  Serial.println("Logged in as " + userName + " (" + userId + ") points=" + String(userPoints));
  state = ST_READY;
  drawReady();
}

// ---------------- Bottle deposit ----------------
void submitBottle(const String& bottleType) {
  String msg = "Bottle " + bottleType + " detected";
  drawMessage("Depositing...", msg, TFT_YELLOW);

  String payload = "{\"action\":\"intake\",\"user_id\":\"";
  payload += userId;
  payload += "\",\"access_token\":\"";
  payload += accessToken;
  payload += "\",\"bottle_type\":\"";
  payload += bottleType;
  payload += "\",\"machine_id\":\"";
  payload += MACHINE_ID;
  payload += "\"}";

  String response;
  int code = postJson(payload, response);

  if (code != 200) {
    Serial.println("intake HTTP " + String(code) + ": " + response);
    if (code == 401) {
      drawMessage("Session expired", "Please login again", TFT_RED);
      delay(1800);
      state = ST_PHONE;
      phone = "";
      password = "";
      accessToken = "";
      userId = "";
      userName = "";
      drawKeypad("Enter Phone Number", phone, false);
      return;
    }
    String m = (code < 0) ? "Network / WiFi error" : "HTTP " + String(code);
    drawMessage("Bottle failed", m, TFT_RED);
    delay(2000);
    drawReady();
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, response);
  int pts = 0;
  if (!err && doc["success"].as<bool>()) {
    pts = doc["points"].as<int>();
    userPoints += pts;
  }
  Serial.println("Bottle " + bottleType + " -> +" + String(pts) + " pts, total=" + String(userPoints));

  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setTextSize(4);
  tft.setCursor(20, 80);
  tft.print("+ " + String(pts) + " pts!");
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 150);
  tft.print("Bottle type: " + bottleType);
  tft.setCursor(20, 176);
  tft.print("Total: " + String(userPoints));
  delay(2500);
  drawReady();
}

// ---------------- Drawing ----------------
void drawKeypad(const char* title, const String& input, bool mask) {
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 14);
  tft.print(title);

  redrawInputBox(input, mask);

  for (int r = 0; r < KEY_ROWS; r++) {
    for (int c = 0; c < KEY_COLS; c++) {
      int x = KEY_X0 + c * KEY_COLW;
      int y = KEY_Y0 + r * KEY_ROWH;
      tft.fillRect(x, y, KEY_COLW - 2, KEY_ROWH - 2, TFT_DARKGREY);
      tft.drawRect(x, y, KEY_COLW - 2, KEY_ROWH - 2, TFT_WHITE);
      const char* label = keyLabels[r][c];
      int lw = strlen(label) * 12;
      int cx = x + (KEY_COLW - 2 - lw) / 2;
      int cy = y + (KEY_ROWH - 2 - 16) / 2;
      tft.setTextColor(TFT_WHITE, TFT_DARKGREY);
      tft.setTextSize(2);
      tft.setCursor(cx, cy);
      tft.print(label);
    }
  }
}

void redrawInputBox(const String& input, bool mask) {
  int x = 20, y = 40, w = tft.width() - 40, h = 34;
  tft.fillRect(x, y, w, h, TFT_NAVY);
  tft.drawRect(x, y, w, h, TFT_CYAN);

  String shown = input;
  if (mask) {
    shown = "";
    for (int i = 0; i < input.length(); i++) shown += "*";
  }
  tft.setTextColor(TFT_WHITE, TFT_NAVY);
  tft.setTextSize(2);
  int tw = shown.length() * 12;
  int sx = x + w - tw - 10;
  if (sx < x + 8) sx = x + 8;
  tft.setCursor(sx, y + (h - 16) / 2);
  tft.print(shown);
}

void drawReady() {
  tft.fillScreen(TFT_NAVY);

  tft.setTextColor(TFT_WHITE, TFT_NAVY);
  tft.setTextSize(2);
  tft.setCursor(20, 20);
  tft.print("Welcome,");
  tft.setCursor(20, 44);
  tft.print(userName);

  tft.fillRect(350, 12, 110, 40, TFT_RED);
  tft.drawRect(350, 12, 110, 40, TFT_WHITE);
  tft.setTextColor(TFT_WHITE, TFT_RED);
  tft.setCursor(372, 25);
  tft.print("Logout");

  tft.setTextColor(TFT_WHITE, TFT_NAVY);
  tft.setCursor(20, 110);
  tft.print("Your points:");
  tft.setTextColor(TFT_GREEN, TFT_NAVY);
  tft.setTextSize(4);
  tft.setCursor(24, 138);
  tft.print(String(userPoints));
  tft.setTextColor(TFT_WHITE, TFT_NAVY);
  tft.setTextSize(2);
  tft.setCursor(20, 210);
  tft.print("Deposit a bottle now.");
}

void drawMessage(String line1, String line2, uint16_t color) {
  if (line2.length() > 42) line2 = line2.substring(0, 42) + "...";
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(color, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 70);
  tft.print(line1);
  tft.setCursor(20, 96);
  tft.print(line2);
}

// ---------------- Touch / network helpers ----------------
const char* hitKey(int tx, int ty) {
  if (tx < KEY_X0 || ty < KEY_Y0) return nullptr;
  int c = (tx - KEY_X0) / KEY_COLW;
  int r = (ty - KEY_Y0) / KEY_ROWH;
  if (r < 0 || r >= KEY_ROWS || c < 0 || c >= KEY_COLS) return nullptr;
  return keyLabels[r][c];
}

String classifyBottle(int value) {
  if (value < 2300) return "A";
  if (value < 3100) return "B";
  return "C";
}

int postJson(const String& payload, String& response) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  HTTPClient http;
  http.begin(ECOBOTTLE_ENDPOINT);
  http.setTimeout(12000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("x-device-secret", DEVICE_SECRET);
  int code = http.POST(payload);
  response = http.getString();
  http.end();
  return code;
}
