#ifndef __ACTIVITY_CONTROLLER_H
#define __ACTIVITY_CONTROLLER_H

#include "application.h"

enum class CSTATE {
    STOPPED,
    STARTING,
    STARTED,
    STOPPING
};

class ActivityController {
    private:
        CSTATE state;
        bool output;
        Timer* waitTimer;

    public:
        ActivityController(){
            state = CSTATE::STOPPED;
            output = false;
        }
        
        void setTimer(Timer* t){
            waitTimer = t;
        }
        
        bool started(){
            bool toReturn = (state == CSTATE::STARTED || state == CSTATE::STARTING) && !output;
            if(toReturn)
                output = true;
            return toReturn;
        }
        
        bool stopped(){
            bool toReturn = (state == CSTATE::STOPPED || state == CSTATE::STOPPING) && !output;
            if(toReturn)
                output = true;
            return toReturn;
        }
        
        void step(time_t* startTime, time_t* endTime){
            if(waitTimer->isActive())
                return;
            switch(state){
                case CSTATE::STOPPED:
                    output = false;
                    state = CSTATE::STARTING;
                    *startTime = Time.now();
                    break;
                case CSTATE::STARTED:
                    output = false;
                    state = CSTATE::STOPPING;
                    *endTime = Time.now();
                    break;
                default:
                    break;
            }
            if(!waitTimer->isActive()){
                waitTimer->start();
            }
        }
        
        void debounce(){
            switch(state){
                case CSTATE::STARTING:
                    state = CSTATE::STARTED;
                    break;
                case CSTATE::STOPPING:
                    state = CSTATE::STOPPED;
                    break;
                default:
                    break;
            }
        }
        
    
};

#endif