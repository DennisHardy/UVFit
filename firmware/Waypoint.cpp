
#include "Waypoint.h"

using namespace std;
Waypoint::Waypoint(float latitude, float longitude, float spd, uint16_t uvRaw){
    lat = latitude;
    lon = longitude;
    speed = spd;
    uv = uvRaw;
}
   
String Waypoint::json(){
    return String::format("\"latitude\": \"%f\", \"longitude\": \"%f\", \"speed\": \"%f\", \"uvExposure\": \"%f\"",
                        lat, lon, speed, this->uvPct());
}