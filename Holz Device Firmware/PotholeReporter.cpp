//-------------------------------------------------------------------

#include "PotholeReporter.h"
#include <AssetTracker.h>

//-------------------------------------------------------------------

//#define DEBUG

//-------------------------------------------------------------------

PotholeReporter::PotholeReporter(AssetTracker &theTracker, 
                                 PotholeDetector &theDetector) :
    gpsSensor(theTracker), potholeDetector(theDetector) {    
        
    tick = 0;
    state = S_Wait;
    led = D7; 
    pinMode(led, OUTPUT);
}

//-------------------------------------------------------------------

void PotholeReporter::execute() {
    String postData;

#ifdef DEBUG
    Serial.print("PotholeReporter SM: ");
    Serial.println(state);
#endif

    switch (state) {
        case PotholeReporter::S_Wait:
            tick = 0;
            digitalWrite(led, LOW);
            
            if (potholeDetector.isDetected()) {
                state = PotholeReporter::S_Publish;
            }
            else {
                state = PotholeReporter::S_Wait;
            }
            break;

        case PotholeReporter::S_Publish:
            if (gpsSensor.gpsFix()) {
               postData = String::format("{ \"longitude\": \"%f\", \"latitude\": \"%f\" }", 
                                         gpsSensor.readLonDeg(), gpsSensor.readLatDeg());
            }
            else {
               postData = String::format("{ \"longitude\": \"%f\", \"latitude\": \"%f\" }", 
                                         -110.987420, 32.248820);
            }

            Serial.println(postData);
            Particle.publish("holz", postData);
            potholeDetector.setReported();
            
            state = PotholeReporter::S_LedNotify;
            break;

        case PotholeReporter::S_LedNotify:
            digitalWrite(led, HIGH);
            ++tick;

            // Keep LED on for 2 seconds
            if (tick == 200) {
                state = PotholeReporter::S_Wait;
            }
            else {
                state = PotholeReporter::S_LedNotify;
            }
            break;
    }
}

//-------------------------------------------------------------------


