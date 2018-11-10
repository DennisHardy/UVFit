var db = require("../db");

var activitySchema = new db.Schema({
    userEmail:    String,
    deviceId:     String,
    startTime:    { type: Date },
    endTime:      { type: Date },
    activityType: String,
    calories:     Number,
    TotalUV:      Number,
    waypoints:    [
                     {
                        latitude: Number,
                        longitude: Number,
                        uvExposure: Number,
                        speed: Number,
                     }
                  ]

});

var Activity = db.model("Activity", activitySchema);

module.exports = Activity;
