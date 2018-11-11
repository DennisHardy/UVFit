#include "Activity.h"
#include "Queue.h"
#include "Waypoint.h"
#include <Adafruit_GPS.h>
#include <Adafruit_VEML6070.h>
#include <vector>
#include <memory>

using namespace std;

#define MAX_WAYPOINTS 5

#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
unsigned long lastSync = millis();

Adafruit_VEML6070 uv = Adafruit_VEML6070();
Adafruit_GPS loc = Adafruit_GPS(&Serial1);
uint16_t uvValue = 0;
vector<Waypoint> waypoints;

unsigned long prevTime = millis();
unsigned long lastToggle = millis();

time_t startTime, endTime;
bool started = false, sendData = false;

void updateGPS(){
    loc.read();  
}

void toggleActivity(){
    if(millis() - lastToggle < 250){
        return;
    }
    lastToggle = millis();
    //Replace with state machine to debounce
    if(!started && loc.fix){
        started = true;
        startTime = Time.now();
        Serial.println("Started");
    }
    else if(started && loc.fix){
        started = false;
        sendData = true;
        endTime = Time.now();
        Serial.println("Ended");
    }
}

void addHandler(const char *event, const char *data){
    // Formatting output
    String output = String::format("POST Response:\n  %s\n  %s\n", event, data);
    // Log to serial console
    Serial.println(output);
    
    //TODO: Parse the data to get the activity's ID and store that ID in the correct activity object
    //      ActivityTransmitter state machine will send all stored activities when available
    //      using the update endpoint and the activity ID
}

void updateHandler(const char *event, const char *data){
    // Formatting output
    String output = String::format("PUT Response:\n  %s\n  %s\n", event, data);
    // Log to serial console
    Serial.println(output);
}

Timer updateTimer(1, updateGPS);

String output, postData;

void setup() {
    Serial.begin(9600);
    loc.begin(9600);
    loc.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);
    loc.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);
    uv.begin(VEML6070_1_T);
    updateTimer.start();
    pinMode(D2, INPUT_PULLUP);
    attachInterrupt(D2, toggleActivity, FALLING);
    Particle.syncTime();
    Time.zone(-7.0);
    Particle.subscribe("hook-response/activity/add", addHandler, MY_DEVICES);
    Particle.subscribe("hook-response/activity/update", updateHandler, MY_DEVICES);
}

void loop() {
    if(loc.newNMEAreceived()){
        loc.parse(loc.lastNMEA());
    }
    
    if(millis() - prevTime >= 1000){
        //Record data as long as activity is started, gps has fix, and number of waypoints is less than max
        if(started && loc.fix && waypoints.size() < MAX_WAYPOINTS){
            waypoints.push_back(Waypoint(loc.latitude, loc.longitude, loc.speed, uv.readUV()));
        }
        prevTime = millis();
    }
    
    if(sendData && WiFi.ready()){
        //Send the data to the server when wifi is available and data is waiting to be sent
        //TODO: replace with state machine
        uint16_t totalUV = 0;
        for(unsigned i = 0; i < waypoints.size(); i++){
            totalUV += waypoints[i].getRawUV();
        }
        postData = "{\"startTime\": \"" + Time.format(startTime, TIME_FORMAT_ISO8601_FULL) 
                + "\", \"endTime\": \"" + Time.format(endTime, TIME_FORMAT_ISO8601_FULL)
                + "\", \"totalUV\": \"" + String::format("%d", totalUV)
                + "\", " + waypoints[0].json() + "}";
        Serial.println(postData);
        Particle.publish("activity/add", postData, PRIVATE);
        sendData = false;
        
        //Clear the waypoints so a new activity can be started. 
        //In the future the waypoints should be added to an activity object
        waypoints.clear();
    }
    
    if(millis() - lastSync >= ONE_DAY_MILLIS){
        Particle.syncTime();
        lastSync = millis();
    }
}

