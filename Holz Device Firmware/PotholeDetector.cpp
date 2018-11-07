//-------------------------------------------------------------------

#include "PotholeDetector.h"
#include <AssetTracker.h>

//-------------------------------------------------------------------

//#define DEBUG

//-------------------------------------------------------------------

PotholeDetector::PotholeDetector(AssetTracker &theTracker, 
                                 int rate, 
                                 int samples,
                                 float threshold) :
    accelSensor(theTracker), accelSamples(samples) {    
        
    this->rate = rate;
    this->samples = samples;
    this->threshold = threshold;
    tick = 0;
    sampleIndex = 0;
    potholeDetected = false;
    state = S_Wait;
}

//-------------------------------------------------------------------

void PotholeDetector::execute() {
#ifdef DEBUG
    Serial.print("PotholeDetector SM: ");
    Serial.println(state);
#endif

    switch (state) {
        case PotholeDetector::S_Wait:
            ++tick;
            sampleIndex = 0;

            if (tick == rate) {
                state = PotholeDetector::S_Sample;
            }
            else {
                state = PotholeDetector::S_Wait;
            }
            break;

        case PotholeDetector::S_Sample:
            tick = 0;
            accelSamples.at(sampleIndex) = accelSensor.readXYZmagnitude();
            sampleIndex++;
            
            if (sampleIndex == samples) {
                state = PotholeDetector::S_Filter;
            }
            else {
                state = PotholeDetector::S_Sample;
            }
            break;

        case PotholeDetector::S_Filter:
            avgMagnitude = 0.0;
            for (int i = 0; i < samples; ++i) {
                avgMagnitude += static_cast<float>(accelSamples.at(i));
            }
            avgMagnitude = avgMagnitude / samples;

            if (avgMagnitude > threshold) {
                state = PotholeDetector::S_Detected;
            }
            else {
                state = PotholeDetector::S_Wait;
            }
            break;

        case PotholeDetector::S_Detected:
            potholeDetected = true;
            state = PotholeDetector::S_WaitUntilReported;
            break;

        case PotholeDetector::S_WaitUntilReported:
            if (potholeDetected == true) {
                state = PotholeDetector::S_WaitUntilReported;
            }
            else {
                state = PotholeDetector::S_Wait;
            }
            break;
    }
}

//-------------------------------------------------------------------

bool PotholeDetector::isDetected() {
    return potholeDetected;
}

//-------------------------------------------------------------------

void PotholeDetector::setReported() {
    potholeDetected = false;
}

//-------------------------------------------------------------------

