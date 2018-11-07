#ifndef POTHOLE_DETECTOR_H
#define POTHOLE_DETECTOR_H

//-------------------------------------------------------------------

#include <vector>
#include <AssetTracker.h>

//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------

class PotholeDetector {
   enum State { S_Wait, S_Sample, S_Filter, S_Detected, S_WaitUntilReported };

private:
    int rate;
    int samples;
    float threshold;

private:
    State state;
    int tick;
    int numSamples;
    vector<int> accelSamples;
    int sampleIndex;
    bool potholeDetected;
    float avgMagnitude;
    AssetTracker& accelSensor;

public:
    PotholeDetector(AssetTracker &theTracker, int rate, int samples, float threshold);    
    bool isDetected();    
    void setReported();    
    void execute();
};

//-------------------------------------------------------------------

#endif