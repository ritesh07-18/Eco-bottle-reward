#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Call the Supabase Edge Function that resolves the phone number
// to the student account and inserts the bottle row.
const char* ECOBOTTLE_ENDPOINT = "https://snwqrcyqvhkscnpxxixb.supabase.co/functions/v1/esp32-bottle-intake";
const char* DEVICE_SECRET = "eco-0dm9fa4u3ix1ytrqkhwgon85";

// Public (publishable/anon) key from Supabase. Supabase edge functions require
// it in the Authorization/apikey headers even when the device secret is used.
const char* SUPABASE_ANON_KEY = "sb_publishable_EblF6OQS9j8OnSsrY9_oww_c7k9-gHz";

const char* MACHINE_ID = "COLLEGE-01";

int sensorPin = 34;

String activePhone = "";

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

  Serial.println("=== EcoBottle Machine ===");
  Serial.println("Enter student phone number (10 digits), then press Enter:");
}

void loop() {
  while (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      handlePhoneEntry(input);
    }
  }

  int sensorValue = analogRead(sensorPin);

  if (sensorValue > 1800) {
    if (activePhone.length() == 0) {
      Serial.println("No phone number set. Enter a 10-digit phone number first.");
    } else {
      String bottleType = classifyBottle(sensorValue);
      sendBottleEvent(bottleType);
      delay(4000);
    }
  }

  delay(250);
}

void handlePhoneEntry(String input) {
  input.replace("-", "");
  input.replace(" ", "");
  if (input.length() >= 10) {
    input = input.substring(input.length() - 10);
  }

  if (input.length() != 10) {
    Serial.println("Invalid phone. Enter a 10-digit phone number.");
    return;
  }

  activePhone = input;
  Serial.print("Phone set: ");
  Serial.println(activePhone);
  Serial.println("Deposit a bottle to earn points.");
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
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("x-device-secret", DEVICE_SECRET);

  String payload = "{";
  payload += "\"phone\":\"" + activePhone + "\",";
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
