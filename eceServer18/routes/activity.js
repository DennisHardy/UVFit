var express = require('express');
var router = express.Router();
var fs = require('fs');
var Device = require("../models/device");
var Activity = require("../models/activity");
var jwt = require("jwt-simple");
var User = require("../models/users");
var secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();

router.get('/all', function(req, res, next) {
    // Check for authentication token in x-auth header
    if (!req.headers["x-auth"]) {
        return res.status(401).json({success: false, message: "No authentication token"});
    }

    var authToken = req.headers["x-auth"];
    try {
        var decodedToken = jwt.decode(authToken, secret);
        var response = {};

        User.findOne({email: decodedToken.email}, function(err, user) {
            if(err) {
                return res.status(200).json({success: false, message: "User does not exist."});
            }
            else {

                // Find devices based on decoded token
                Activity.find({ userEmail : decodedToken.email}, function(err, activities) {
                    if (!err) {
                        // Construct device list
                        var actList = []; 
                        for (activity of activities) {
                            actList.push({ 
                                activityId: activity._id,
                                startTime: activity.startTime,
                                duration: (activity.endTime - activity.startTime),
                                activityType: activity.activityType,
                                calories: activity.calories,
                                totalUV: activity.totalUV
                            });
                        }
                        response['activities'] = actList;
                    }

                    return res.status(200).json(response);            
                });
            }
        });
    }
    catch (ex) {
        return res.status(401).json({success: false, message: "Invalid authentication token."});
    }
});

router.get('/id/:actId', function(req, res, next) {
    var activityId = req.params.actId;
    var responseJson = {
        success : false,
        message : ""
    };
    // Check for authentication token in x-auth header
    if (!req.headers["x-auth"]) {
        return res.status(401).json({success: false, message: "No authentication token"});
    }

    var authToken = req.headers["x-auth"];
    try {
        var decodedToken = jwt.decode(authToken, secret);
        var response = {};

        User.findOne({email: decodedToken.email}, function(err, user) {
            if(err) {
                return res.status(200).json({success: false, message: "User does not exist."});
            }
            else {
                // Find devices based on id
                Activity.findOne({ userEmail : decodedToken.email, _id: activityId}, function(err, activity) {
                    if (activity && !err) {
                        response.success = true;
                        response.message = "Activity found."
                        response.deviceId = activity.deviceId;
                        response.startTime = activity.startTime;
                        response.endTime = activity.endTime;
                        response.activityType = activity.activityType;
                        response.calories = activity.calories;
                        response.TotalUV = activity.totalUV;
                        response.waypoints = activity.waypoints;
                        return res.status(200).json(response);
                    }
                    else{
                        return res.status(201).json({success: false, message: "Activity not found."});
                    }
                });
            }
        });
    }
    catch (ex) {
        return res.status(401).json({success: false, message: "Invalid authentication token."});
    }
});

router.post('/add', function(req, res, next){
    var responseJson = {
        success : false,
        message : "",
        activityId: "",
    };



    // Ensure the POST data include required properties 
    if( !req.body.hasOwnProperty("deviceId") ) {
        responseJson.message = "Request missing deviceId parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("apiKey") ) {
        responseJson.message = "Request missing apiKey parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("startTime") ) {
        responseJson.message = "Request missing startTime parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("endTime") ) {
        responseJson.message = "Request missing endTime parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("activityType") ) {
        responseJson.message = "Request missing activityType parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("totalUV") ) {
        responseJson.message = "Request missing totalUV parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("latitude") ) {
        responseJson.message = "Request missing latitude parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("longitude") ) {
        responseJson.message = "Request missing longitude parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("speed") ) {
        responseJson.message = "Request missing speed parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }
    if( !req.body.hasOwnProperty("uvExposure") ) {
        responseJson.message = "Request missing uvExposure parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }

    //Create initial waypoint since the photon web hook only supports
    //flat JSON objects
    req.body.waypoints = [
        {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            speed: req.body.speed,
            uvExposure: req.body.uvExposure
        }
    ];
    /* This is unneeded now
    if( !req.body.hasOwnProperty("waypoints") ) {
        responseJson.message = "Request missing waypoints parameter.";
        return res.status(201).send(JSON.stringify(responseJson));
    }*/

    // Find the device and verify the apikey
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
        if (device === null) {
            responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
            return res.status(201).send(JSON.stringify(responseJson));
        }

        if (device.apikey != req.body.apiKey) {
            responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
            return res.status(201).send(JSON.stringify(responseJson));
        }

        //FIXME: Check for duplicate activities

        var activity = new Activity({
            userEmail:    device.userEmail,
            deviceId:     device.deviceId,
            startTime:    req.body.startTime,
            endTime:      req.body.endTime,
            activityType: req.body.activityType,
            calories:     0, //FIXME: Do calorie calculation
            TotalUV:      req.body.totalUV,
            waypoints:    req.body.waypoints,
        });
        activity.calories = getCalories(activity);
        activity.totalUV = getTotalUV(activity);
        responseJson.message = "New activity recorded.";

        activity.save(function(err, newAct){
            if (err) {
                responseJson.status = "ERROR";
                responseJson.message = "Error saving data in db." + err;
                return res.status(201).send(JSON.stringify(responseJson));
            }

            responseJson.success = true;
            responseJson.activityId = newAct._id.toString();
            return res.status(201).send(JSON.stringify(responseJson));
        });
    });
});

router.put("/update", function(req, res, next){
    var responseJson = {
        success : false,
        message : "",
        activityId: "",
    };
    console.log("PUT:");
    console.log(req.body);

    if(req.body.latitude != undefined && req.body.longitude != undefined
        && req.body.speed != undefined && req.body.uvExposure != undefined){
        var newWaypoint = {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            speed: req.body.speed,
            uvExposure: req.body.uvExposure
        };
    }

    // Find the device and verify the apikey
    Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
        if (device === null) {
            responseJson.message = "Device ID " + req.body.deviceId + " not registered.";
            return res.status(201).send(JSON.stringify(responseJson));
        }

        if (device.apikey != req.body.apiKey) {
            responseJson.message = "Invalid apikey for device ID " + req.body.deviceId + ".";
            return res.status(201).send(JSON.stringify(responseJson));
        }

        Activity.findById(req.body.activityId, function(err, activity){
            if(err){
                console.log("Error finding activity to update!");
                console.log(err);
                responseJson.message = "Interal error.";
                return res.status(501).json(responseJson);
            }
            if(!activity){
                responseJson.message = "Activity ID " + req.body.activityId + " does not exist.";
                return res.status(201).json(responseJson);
            }
            if(newWaypoint){
                activity.waypoints.push(newWaypoint);
                activity.calories = getCalories(activity);
                activity.totalUV = getTotalUV(activity);
            }
            activity.save(function(err, activity){
                if (err) {
                    responseJson.status = "ERROR";
                    responseJson.message = "Error saving data in db." + err;
                    return res.status(201).send(JSON.stringify(responseJson));
                }

                responseJson.success = true;
                responseJson.message = "Activity successfully updated!";
                responseJson.activityId = activity._id.toString();
                return res.status(201).send(JSON.stringify(responseJson));
            });
        });
    });
});

router.put("/type", function(req, res, next){
   var responseJson = {
      success : false,
      message : "",
      activityId: "",
      newType: ""
   };
   if(!req.body.activityType || !req.body.activityId){
      responseJson.status = "ERROR";
      responseJson.message = "Invalid Request.";
      return res.status(400).send(JSON.stringify(responseJson));
   }
   else{
      Activity.findById(req.body.activityId, function(err, activity){
         if(err){
             console.log("Error finding activity to update!");
             console.log(err);
             responseJson.message = "Interal error.";
             return res.status(501).json(responseJson);
         }
         if(!activity){
             responseJson.message = "Activity ID " + req.body.activityId + " does not exist.";
             return res.status(201).json(responseJson);
         }
         if(req.body.activityType=="walking"|| req.body.activityType=="running"|| req.body.activityType=="biking"){
             activity.activityType=req.body.activityType;
             activity.calories = getCalories(activity);
         }
         else{
            responseJson.message = "Invalid Activity Type: "+req.body.activityType;
             return res.status(400).json(responseJson);
         }
         activity.save(function(err, activity){
             if (err) {
                 responseJson.status = "ERROR";
                 responseJson.message = "Error saving data in db." + err;
                 return res.status(201).send(JSON.stringify(responseJson));
             }

             responseJson.success = true;
             responseJson.message = "Activity successfully updated!";
             responseJson.activityId = activity._id.toString();
             responseJson.newType = req.body.activityType;
             return res.status(201).send(JSON.stringify(responseJson));
         });
     });
   }
});
function getCalories(activity){
   var lengthSeconds=(activity.endTime - activity.startTime)/1000;
   var calories = 0;
   if(activity.activityType == "walking"){
         calories = 0.04 * lengthSeconds; //0.04 calories per second found online
   } else if(activity.activityType == "running"){
         calories = 0.12 * lengthSeconds; //Found online
   } else if(activity.activityType == "biking"){
         calories = 0.135 * lengthSeconds; //Found online
   }
   return Math.ceil(calories);
}
function getTotalUV(activity){
   var total = 0;
   for(var waypoint of activity.waypoints){
      total +=waypoint.uvExposure;
   }
   totalUV=Math.ceil((total/100)/3600);
   return totalUV;
}
module.exports = router;
