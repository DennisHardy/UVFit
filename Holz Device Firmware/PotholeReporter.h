#ifndef POTHOLE_REPORTER_H
#define POTHOLE_REPORTER_H

//-------------------------------------------------------------------

#include <AssetTracker.h>
#include "PotholeDetector.h"

//-------------------------------------------------------------------

class PotholeReporter {
   enum State { S_Wait, S_Publish, S_LedNotify };

private:
    int rate;

private:
    State state;
    int tick;
    int led;
    AssetTracker& gpsSensor;
    PotholeDetector& potholeDetector;

public:
    PotholeReporter(AssetTracker &theTracker, PotholeDetector &theDetector);    
    void execute();
};

//-------------------------------------------------------------------

#endif