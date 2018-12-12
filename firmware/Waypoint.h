#ifndef __WAYPOINT_H
#define __WAYPOINT_H
#include "application.h"
#include <inttypes.h>

class Waypoint{
    private:
        float lat, lon, speed;
        uint16_t uv;
    public:
        Waypoint(){
            lat = 0;
            lon = 0;
            speed = 0;
            uv = 0;
        };
        Waypoint(float latitude, float longitude, float speed, uint16_t uvRaw);
        String json();
        float uvPct(){
            return (float)uv / 65536.0f; 
        }
        float getLat(){
            return lat;
        }
        float getLong(){
            return lon;
        }
        float getSpeed(){
            return speed;
        }
        uint16_t getRawUV(){
            return uv;
        }
};

#endif