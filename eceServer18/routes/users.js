var express = require('express');
var router = express.Router();
var fs = require('fs');
var User = require("../models/users");
var Device = require("../models/device");
var Activity = require("../models/activity");
var bcrypt = require("bcrypt-nodejs");
var jwt = require("jwt-simple");

/* Authenticate user */
var secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();

router.post('/signin', function(req, res, next) {
   User.findOne({email: req.body.email}, function(err, user) {
      if (err) {
         res.status(401).json({success : false, error : "Error communicating with database."});
      }
      else if(!user) {
         res.status(401).json({success : false, error : "The email or password provided was invalid."});         
      }
      else {
         bcrypt.compare(req.body.password, user.passwordHash, function(err, valid) {
            if (err) {
               res.status(401).json({success : false, error : "Error authenticating. Please contact support."});
            }
            else if(valid) {
               var token = jwt.encode({email: req.body.email}, secret);
               res.status(201).json({success : true, token : token});         
            }
            else {
               res.status(401).json({success : false, error : "The email or password provided was invalid."});         
            }
         });
      }
   });
});

/* Register a new user */
router.post('/register', function(req, res, next) {

    // FIXME: Add input validation
    bcrypt.hash(req.body.password, null, null, function(err, hash) {
        // Create an entry for the user
        var newUser = new User( {
           email: req.body.email,
           fullName: req.body.fullName,
           passwordHash: hash // hashed password
        }); 
        
        newUser.save( function(err, user) {
           if (err) {
              // Error can occur if a duplicate email is sent
              res.status(400).json( {success: false, message: err.errmsg});
           }
           else {
               res.status(201).json( {success: true, message: user.fullName + " has been created."})
           }
        });
    });    
});

router.get("/account" , function(req, res) {
   // Check for authentication token in x-auth header
   if (!req.headers["x-auth"]) {
      return res.status(401).json({success: false, message: "No authentication token"});
   }
   
   var authToken = req.headers["x-auth"];
   
   try {
      var decodedToken = jwt.decode(authToken, secret);
      var userStatus = {};
      
      User.findOne({email: decodedToken.email}, function(err, user) {
         if(err || !user) {
            return res.status(401).json({success: false, message: "User does not exist."});
         }
         else {
            userStatus['success'] = true;
            userStatus['email'] = user.email;
            userStatus['fullName'] = user.fullName;
            userStatus['lastAccess'] = user.lastAccess;
            
            // Find devices based on decoded token
		      Device.find({ userEmail : decodedToken.email}, function(err, devices) {
			      if (!err) {
			         // Construct device list
			         var deviceList = []; 
			         for (device of devices) {
				         deviceList.push({ 
				               deviceId: device.deviceId,
				               apikey: device.apikey,
				         });
			         }
			         userStatus['devices'] = deviceList;
			      }
			      
               return res.status(200).json(userStatus);            
		      });
         }
      });
   }
   catch (ex) {
      return res.status(401).json({success: false, message: "Invalid authentication token."});
   }
   
});

router.put("/account/email", function(req, res){
   // Check for authentication token in x-auth header
   if (!req.headers["x-auth"]) {
      return res.status(401).json({success: false, message: "No authentication token"});
   }
   
   var authToken = req.headers["x-auth"];
   
   try {
      var decodedToken = jwt.decode(authToken, secret);
      var responseJson = {};
      
      User.findOne({email: decodedToken.email}, function(err, user) {
         if(err || !user) {
            return res.status(200).json({success: false, message: "User does not exist."});
         }
         else {
            user.email = req.body.email;
            user.save(function(err, user){
               if (err) {
                  responseJson.status = "ERROR";
                  responseJson.message = "Email already registered";
                  return res.status(201).json(responseJson);
               }
               else{
                  // Find devices associated with user
		      Device.find({ userEmail : decodedToken.email}, function(err, devices) {
			      if (!err) {
			         // Update registered devices associated with user
			         for (device of devices) {
                     device.userEmail = req.body.email;
                     device.save(function(err, device){
                        if (err) {
                           responseJson.status = "ERROR";
                           responseJson.message = "Error updating device data in db." + err;
                           return res.status(201).send(JSON.stringify(responseJson));
                        }
                     });
			         }
               }
               else{
                  responseJson.status = "ERROR";
                  responseJson.message = "Error finding device data in db." + err;
                  return res.status(201).send(JSON.stringify(responseJson));
               }              
            });
            // Find activities associated with user
		      Activity.find({ userEmail : decodedToken.email}, function(err, activities) {
			      if (!err) {
			         // Update registered activities associated with user
			         for (activity of activities) {
                     activity.userEmail = req.body.email;
                     activity.save(function(err, activity){
                        if (err) {
                           responseJson.status = "ERROR";
                           responseJson.message = "Error updating activity data in db." + err;
                           return res.status(201).send(JSON.stringify(responseJson));
                        }
                     });
			         }
               }
               else{
                  responseJson.status = "ERROR";
                  responseJson.message = "Error finding activity data in db." + err;
                  return res.status(201).send(JSON.stringify(responseJson));
               }              
            });
            responseJson.status = "SUCCESS";
            responseJson.message = "email updated for user and all associated devices and activities";
            var token = jwt.encode({email: req.body.email}, secret);
            responseJson.newToken = token;
            return res.status(201).send(JSON.stringify(responseJson));
               }
            });
            
         }
      });
   }
   catch (ex) {
      return res.status(401).json({success: false, message: "Invalid authentication token."});
   }
   
});

module.exports = router;
