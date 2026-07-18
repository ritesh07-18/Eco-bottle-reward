#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Recommended: call your Supabase Edge Function, not the table REST API directly.
const char* ECOBOTTLE_ENDPOINT = "https://YOUR_PROJECT.supabase.co/functions/v1/esp32-bottle-intake";
const char* DEVICE_SECRET = "CHANGE_ME_DEVICE_SECRET";

const char* USER_ID = "student-auth-user-uuid";
const char* MACHINE_ID = "COLLEGE-01";

int sensorPin = 34;

void setup() {
  Serial.begin(115200);
  pinMode(sensorPin, INPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected");
}

void loop() {
  int sensorValue = analogRead(sensorPin);

  if (sensorValue > 1800) {
    String bottleType = classifyBottle(sensorValue);
    sendBottleEvent(bottleType);
    delay(4000);
  }

  delay(250);
}

String classifyBottle(int value) {
  if (value < 2300) return "A";
  if (value < 3100) return "B";
  return "C";
}

void sendBottleEvent(String bottleType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    return;
  }

  HTTPClient http;
  http.begin(ECOBOTTLE_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-secret", DEVICE_SECRET);

  String payload = "{";
  payload += "\"user_id\":\"" + String(USER_ID) + "\",";
  payload += "\"bottle_type\":\"" + bottleType + "\",";
  payload += "\"machine_id\":\"" + String(MACHINE_ID) + "\"";
  payload += "}";

  int statusCode = http.POST(payload);
  String response = http.getString();

  Serial.print("HTTP ");
  Serial.println(statusCode);
  Serial.println(response);

  http.end();
}
