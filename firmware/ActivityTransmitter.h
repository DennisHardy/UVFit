#ifndef __ACTIVITY_TRANSMITTER_H
#define __ACTIVITY_TRANSMITTER_H


enum class TSTATE {
    WAITING,
    TRANSMITTING
};

class ActivityTransmitter {
    private:
        TSTATE state;

    public:
        ActivityTransmitter(){
            state = TSTATE::WAITING;
        }
        
        bool tx(){
            return state == TSTATE::TRANSMITTING;
        }
        
        void start(){
            switch(state){
                case TSTATE::WAITING:
                    state = TSTATE::TRANSMITTING;
                    break;
                default:
                    break;
            }
        }
        
        void stop(){
            switch(state){
                case TSTATE::TRANSMITTING:
                    state = TSTATE::WAITING;
                    break;
                default:
                    break;
            }
        }
};

#endif