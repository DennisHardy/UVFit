var map;

Number.prototype.pad = function(size) {
        var s = String(this);
        while (s.length < (size || 2)) {s = "0" + s;}
        return s;
}

function initMap() {
   map = new google.maps.Map(document.getElementById('map'), {
     center: {lat: -34.397, lng: 150.644},
     zoom: 1,
     disableDefaultUI: true
   });
 }
 function zoomToObject(obj){
   var bounds = new google.maps.LatLngBounds();
   var points = obj.getPath().getArray();
   for (var n = 0; n < points.length ; n++){
       bounds.extend(points[n]);
   }
   map.fitBounds(bounds);
}
function sendReqForActivityInfo() {
   activityId = getUrlVars()["id"];
   $.ajax({
      url: '/activity/id/'+activityId,
      type: 'GET',
      headers: { 'x-auth': window.localStorage.getItem("authToken") },
      responseType: 'json',
      success: activityInfoSuccess,
      error: activityInfoError
   });
}

function activityInfoSuccess(data, textSatus, jqXHR) {
   var startTime= new Date(data.startTime);
   var endTime = new Date(data.endTime);
   $("#startTime").html(startTime.toLocaleString('en-us'));
   $("#endTime").html(endTime.toLocaleString('en-us'));
   var lengthSeconds=(Date.parse(data.endTime)-Date.parse(data.startTime))/1000;
   var hours = Math.floor(lengthSeconds/3600);
   var minutes = Math.floor((lengthSeconds%3600)/60);
   var seconds = Math.floor((lengthSeconds%3600)%60);
   $("#length").html(hours.pad(2)+":"+minutes.pad(2)+":"+seconds.pad(2));
   $("#activityType").html(data.activityType);
   $("#calories").html(data.calories);
   $("#totalUV").html(data.TotalUV);
   $("#main").show();
   var path = [];
   // Add the waypoints
   for (var waypoint of data.waypoints) {
      $("#waypoints").empty();
      $("#waypoints").append("<li class='collection-item'>Latitude: " +
        waypoint.latitude + "<br>Longitude: " + waypoint.longitude + "<br>Speed: " + waypoint.speed + " mph</li>");
        path.push({lat: waypoint.latitude, lng: waypoint.longitude});
   }
   var myPath = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
  
    myPath.setMap(map);
    zoomToObject(myPath);
}

function activityInfoError(jqXHR, textStatus, errorThrown) {
   // If authentication error, delete the authToken 
   // redirect user to sign-in page (which is index.html)
   if( jqXHR.status === 401 ) {
      console.log("Invalid auth token");
      window.localStorage.removeItem("authToken");
      window.location.replace("index.html");
   } 
   else {
     $("#error").html("Error: " + status.message);
     $("#error").show();
   } 
}

function updateActivityType() {
   if($('#typeSelector').val()){
      var body = {activityType:"", activityId:0};
      body.activityType = $('#typeSelector').val();
      body.activityId = getUrlVars()["id"];
      $.ajax({
         url: '/activity/type/',
         type: 'PUT',
         headers: { 'x-auth': window.localStorage.getItem("authToken") },
         responseType: 'json',
         data: JSON.stringify(body),
         dataType: 'json',
         contentType: 'application/json',
         success: activityTypeSuccess,
         error: activityTypeError
      });
   }
   else {
      M.toast({html:"Please Select an Activity Type"});
    }
}

function activityTypeSuccess(jqXHR, textStatus, errorThrown){
   M.toast({html:"Activity Type Change Successful"});
   sendReqForActivityInfo();
   hideEditForm();
   
}
function activityTypeError(jqXHR, textStatus, errorThrown){
   M.toast({html:"Activity Type Change Error"});
   $("#error").html("Error: " + jqXHR.body.message);
   $("#error").show();
}
// Show add device form and hide the add device button (really a link)
function showAddDeviceForm() {
   $("#deviceId").val("");           // Clear the input for the device ID
   $("#addDeviceControl").hide();    // Hide the add device link
   $("#addDeviceForm").slideDown();  // Show the add device form
}
function showEditForm() {
   $("#type").hide();    // Hide the type label
   $("#typeForm").show();  // Show the change type form
}
function hideEditForm() {
   $("#type").show();    // Hide the type label
   $("#typeForm").hide();  // Show the change type form
}
// Hides the add device form and shows the add device button (link)
function hideAddDeviceForm() {
   $("#addDeviceControl").show();  // Hide the add device link
   $("#addDeviceForm").slideUp();  // Show the add device form
   $("#error").hide();
}

// Handle authentication on page load
$(function() {
   // If there's no authToekn stored, redirect user to 
   // the sign-in page (which is index.html)
   if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
   }
   else {
      sendReqForActivityInfo();
   }
   $('select').formSelect();
   // Register event listeners
   $("#addDevice").click(showAddDeviceForm);
   $("#cancel").click(hideAddDeviceForm);  
   $('#editType').click(showEditForm);
   $('#typeUpdate').click(updateActivityType);
});

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
