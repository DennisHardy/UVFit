#include "Activity.h"
#include "ActivityController.h"
#include "ActivityTransmitter.h"
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
vector<Activity> activities;
Activity currActivity, txActivity;
ActivityController ac;
ActivityTransmitter trans;

unsigned long prevTime = millis();
unsigned long lastToggle = millis();

time_t startTime, endTime;
bool started = false, sendData = false;

Timer updateTimer(1, updateGPS);
Timer waypointTimer(1000, getWaypoint);
Timer transmitTimer(500, transmitWaypoint, true);
Timer acTimer(1000, &ActivityController::debounce, ac, true);

SYSTEM_THREAD(ENABLED);

void updateGPS(){
    loc.read();  
}

float convertDMStoDD(float DMS, char dir){
    float degrees = (int)(DMS / 100);
    float minutes = ((int)DMS) % 100;
    float seconds = (DMS - (int)DMS) * 100;
    return (dir == 'W' || dir == 'S' ? -1 : 1) * (degrees + minutes / 60.0 + seconds / 3600);
}

void getWaypoint(){
    float lonDecimal = convertDMStoDD(loc.longitude, loc.lon);
    float latDecimal = convertDMStoDD(loc.latitude, loc.lat);
    currActivity.addWaypoint(Waypoint(latDecimal, lonDecimal, loc.speed * 1.15078, uv.readUV()));
    if(!loc.fix)
        return;
    String output = String::format("Latitude, Longitude\n%f, %f\n", latDecimal, lonDecimal);
    Serial.println(output);
}

void transmitWaypoint(){
    if(Particle.connected() && txActivity.hasNext()){
        String postData = "{\"activityId\":\"" + txActivity.getID() + "\"," + txActivity.getNext().json() + "}";
        Serial.println("Sending...");
        Serial.println(postData);
        Particle.publish("activity/update", postData, PRIVATE);
        //transmitTimer.stop();
    } else if(txActivity.hasNext()){
        Serial.println("Waiting for WiFi to continue transmitting activity");
        transmitTimer.start();
    } else {
        Serial.println("Finished transmitting activity");
        trans.stop();
    }
}

void toggleActivity(){
    ac.step(&startTime, &endTime);
    if(!waypointTimer.isActive() && ac.started()){
        Serial.println("Started");
        currActivity = Activity{};
        currActivity.setStartTime(startTime);
        waypointTimer.start();
    } else if(waypointTimer.isActive() && ac.stopped()) {
        Serial.println("Stopped");
        waypointTimer.stop();
        currActivity.setEndTime(endTime);
        activities.push_back(currActivity);
    }
}

//ec2-18-225-11-150
//tCcr8KJV34GtKWUnaYSh8Wp81oeCMwCa
//ec2-18-188-154-175
//qO3URcGG7LBZ7tcxT72HwKyMsNVKuoJI

void addHandler(const char *event, const char *data){
    // Formatting output
    String output = String::format("POST Response:\n  %s\n  %s\n", event, data);
    // Log to serial console
    Serial.println(output);
    
    //TODO: Parse the data to get the activity's ID and store that ID in the correct activity object
    //      ActivityTransmitter state machine will send all stored activities when available
    //      using the update endpoint and the activity ID
    output = String::format("%s", data);
    String success;
    int index = output.indexOf("success");
    if(index != -1){
        success = output.substring(index + 9, output.indexOf('e', index + 9) + 1);
    } else {
        Serial.println("Unable to parse response success value.");
        Serial.println(output);
        return;
    }
    if(success.compareTo("true") != 0){
        Serial.println("Error posting data.");
        Serial.println(output);
        return;
    }
    
    index = output.indexOf("activityId");
    if(index != -1){
        String activityID = output.substring(index + 13, output.indexOf('"', index + 13));
        Serial.print("Activity ID: ");
        Serial.println(activityID);
        txActivity.setID(activityID);
        transmitTimer.start();
    } else {
        Serial.println("Could not find 'activityId'!");
        Serial.println(output);
    }
}

void updateHandler(const char *event, const char *data){
    // Formatting output
    String output = String::format("PUT Response:\n  %s\n  %s\n", event, data);
    // Log to serial console
    Serial.println(output);
    transmitTimer.start();
}

String output, postData;

void setup() {
    Serial.begin(9600);
    loc.begin(9600);
    loc.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);
    loc.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);
    uv.begin(VEML6070_1_T);
    updateTimer.start();
    ac.setTimer(&acTimer);
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
    
    /*if(millis() - prevTime >= 1000){
        //Record data as long as activity is started, gps has fix, and number of waypoints is less than max
        if(ac.started() && loc.fix){
           currActivity.addWaypoint(Waypoint(loc.latitude, loc.longitude, loc.speed, uv.readUV()));
        }
        prevTime = millis();
    }*/
    
    if(!trans.tx() && activities.size() > 0 && Particle.connected()){
        //Send the data to the server when wifi is available and data is waiting to be sent
        //TODO: replace with state machine
        
        txActivity = activities.back();
        activities.pop_back();
        trans.start();
        
        postData = txActivity.json();
        Serial.println(postData);
        Particle.publish("activity/add", postData, PRIVATE);
    }
    
    if(millis() - lastSync >= ONE_DAY_MILLIS){
        Particle.syncTime();
        lastSync = millis();
        activities.clear();
        //DROP TABLE activities
    }
}

