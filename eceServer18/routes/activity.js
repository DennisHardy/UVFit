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
   if( !req.body.hasOwnProperty("waypoints") ) {
      responseJson.message = "Request missing waypoints parameter.";
      return res.status(201).send(JSON.stringify(responseJson));
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
      responseJson.message = "New activity recorded.";

      activity.save(function(err, newAct){
         if (err) {
            responseJson.status = "ERROR";
            responseJson.message = "Error saving data in db." + err;
            return res.status(201).send(JSON.stringify(responseJson));
         }

        responseJson.success = true;
        responseJson.activityId = newAct._id.toString;
        return res.status(201).send(JSON.stringify(responseJson));
      });
   });
});


module.exports = router;