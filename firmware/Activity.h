#ifndef __ACTIVITY_H
#define __ACTIVITY_H

#include "application.h"
#include "Waypoint.h"
#include <vector>
#include <inttypes.h>

class Activity{
    private:
        String id;
        std::vector<Waypoint> waypoints;
        unsigned index;
        time_t startTime, endTime;
    public:
        Activity(){
            this->id = "";
            this->waypoints = std::vector<Waypoint>{};
            index = 0;
        }
        
        Activity(String id, std::vector<Waypoint> waypoints){
            this->id = id;
            this->waypoints = waypoints;
            index = 0;
        }
        
        void setID(String id){
            this->id = id;
        }
        
        String getID(){
            return id;
        }
        
        void setStartTime(time_t newTime){
            this->startTime = newTime;
        }
        
        void setEndTime(time_t newTime){
            this->endTime = newTime;
        }
        
        bool hasNext(){
            return index < waypoints.size();
        }
        
        Waypoint getNext(){
            return waypoints[index];
        }
        
        void next(){
            index++;
        }
        
        void setIndex(unsigned newIndex){
            index = newIndex;
        }
        
        unsigned getIndex(){
            return index;
        }
        
        uint32_t totalUV(){
            uint32_t toReturn = 0;
            for(Waypoint& w : waypoints){
                toReturn += w.getRawUV();
            }
            return toReturn;
        }
        
        void addWaypoint(Waypoint toAdd){
            waypoints.push_back(toAdd);
        }
        
        String json(){
            index = 1;
            return "{\"startTime\": \"" + Time.format(startTime, TIME_FORMAT_ISO8601_FULL) 
                + "\", \"endTime\": \"" + Time.format(endTime, TIME_FORMAT_ISO8601_FULL)
                + "\", \"totalUV\": \"" + String::format("%d", this->totalUV())
                + "\", \"numWaypoints\": \"" + String::format("%d", this->waypoints.size())
                + "\", " + waypoints[0].json() + "}";
        }
};

#endif