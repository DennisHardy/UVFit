#ifndef __ACTIVITY_H
#define __ACTIVITY_H

#include "application.h"
#include "Waypoint.h"
#include <vector>

class Activity{
    private:
        String id;
        std::vector<Waypoint> waypoints;
        unsigned index;
    public:
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
        
        bool hasNext(){
            return index < waypoints.size();
        }
        
        Waypoint getNext(){
            return waypoints[index++];
        }
        
        void setIndex(unsigned newIndex){
            index = newIndex;
        }
        
        unsigned getIndex(){
            return index;
        }
        
        void addWaypoint(Waypoint toAdd){
            waypoints.push_back(toAdd);
        }
};

#endif