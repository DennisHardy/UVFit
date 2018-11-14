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
   $("#startTime").html(data.startTime);
   $("#endTime").html(data.endTime);
   $("#activityType").html(data.activityType);
   $("#calories").html(data.calories);
   $("#totalUV").html(data.TotalUV);
   $("#main").show();
   
   // Add the devices to the list before the list item for the add device button (link)
   for (var waypoint of data.waypoints) {
      $("#addDeviceForm").before("<li class='collection-item'>Lat: " +
        waypoint.latitude + ", Lon: " + waypoint.longitude + "</li>")
   }
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

// Show add device form and hide the add device button (really a link)
function showAddDeviceForm() {
   $("#deviceId").val("");           // Clear the input for the device ID
   $("#addDeviceControl").hide();    // Hide the add device link
   $("#addDeviceForm").slideDown();  // Show the add device form
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
   
   // Register event listeners
   $("#addDevice").click(showAddDeviceForm);
   $("#cancel").click(hideAddDeviceForm);   
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