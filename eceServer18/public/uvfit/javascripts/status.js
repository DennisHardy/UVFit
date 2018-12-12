Number.prototype.pad = function(size) {
        var s = String(this);
        while (s.length < (size || 2)) {s = "0" + s;}
        return s;
}

function sendReqForAccountInfo() {
    $.ajax({
        url: '/users/account',
        type: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },
        responseType: 'json',
        success: accountInfoSuccess,
        error: accountInfoError
    });
}

function sendReqForActivityInfo() {
    $.ajax({
        url: '/activity/all',
        type: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },
        responseType: 'json',
        success: activitySuccess,
        error: activityError
    });
}

function activitySuccess(data, textSatus, jqXHR) {
    var oneWeekinMs = 1000*60*60*24*7;
    var weekUV=0;
    var weekCals = 0;
    var weekTime =0;
    $("#main").show();

    // Add the devices to the list before the list item for the add device button (link)
    for (var activity of data.activities) {
        var startTime= new Date(activity.startTime);
        if(startTime>=(new Date()-oneWeekinMs)){
         weekUV+=activity.totalUV;
         weekCals+= activity.calories;
         weekTime += activity.duration;
        }
        //var endTime= new Date(activity.endTime);
        //$("#startTime").html(startTime.toLocaleString('en-us'));
        //$("#endTime").html(endTime.toLocaleString('en-us'));
        var lengthSeconds=activity.duration/1000;
        var hours = Math.floor(lengthSeconds/3600);
        var minutes = Math.floor((lengthSeconds%3600)/60);
        var seconds = Math.floor((lengthSeconds%3600)%60);
        //$("#length").html(hours.pad(2)+":"+minutes.pad(2)+":"+seconds.pad(2));
        //$("#activityType").html(activity.activityType);
        //$("date").html(startTime.toLocaleString('en-us'));
        var calories = 0;
        if(activity.activityType == "walking"){
            calories = 0.04 * lengthSeconds; //0.04 calories per second found online
        } else if(activity.activityType == "running"){
            calories = 0.12 * lengthSeconds; //Found online
        } else if(activity.activityType == "biking"){
            calories = 0.135 * lengthSeconds; //Found online
        }

        var numFmt = new Intl.NumberFormat("en-us", {"maximumFractionDigits":1});

		var card = "<div class=\"col s12 m4\">" 
            + "<div class=\"card medium deep-purple darken-2\">" 
            + "<div class=\"card-image\">"
            + "<img src=\"images/" + activity.activityType + ".jpg\" class=\"responsive-img\">"
            + "<span class=\"card-title\">" + activity.activityType + "</span>"
            + "</div>"
            + "<div class=\"card-content white-text\">" 
            + "<div>Calories: " + numFmt.format(calories) + "</div>"
            + "<div>Duration: " 
            + hours.pad(2) + ":" + minutes.pad(2) + ":" + seconds.pad(2) 
            + "</div>"
            + "<div>Date: " + startTime.toLocaleString('en-us') + "</div>"
            + "</div>"
            + "<div class=\"card-action\">" 
            + "<a href=\"activity.html?id=" + activity.activityId + "\">Details...</a>" 
            + "</div>"
            + "</div>" 
            + "</div>";
        $("#activity-cards").append(card);
    }
    $("#weekUV").text(weekUV);
    $("#weekCals").text(weekCals);
    var hours = Math.floor(weekTime/(60*60*1000));
    var mins = Math.floor((weekTime%(60*60*1000)/(60*1000)));
    var secs = Math.floor((weekTime%(60*60*1000)%(60*1000))/1000);
    $("#weekTime").text(hours+":"+mins.pad(2)+":"+secs.pad(2));
}

function activityError(jqXHR, textStatus, errorThrown) {
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

function accountInfoSuccess(data, textSatus, jqXHR) {
    $("#email").html(data.email);
    $("#fullName").html(data.fullName);
    $("#lastAccess").html((new Date(data.lastAccess)).toLocaleString('en-us'));
    $("#main").show();

    // Add the devices to the list before the list item for the add device button (link)
    for (var device of data.devices) {
        $("#addDeviceForm").before("<li class='collection-item'>ID: " +
            device.deviceId + "</li>")
    }
}

function accountInfoError(jqXHR, textStatus, errorThrown) {
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

// Registers the specified device with the server.
function registerDevice() {
    $.ajax({
        url: '/devices/register',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },   
        data: { deviceId: $("#deviceId").val() }, 
        responseType: 'json',
        success: function (data, textStatus, jqXHR) {
            // Add new device to the device list
            $("#addDeviceForm").before("<li class='collection-item'>ID: " +
                $("#deviceId").val() + ", APIKEY: " + data["apikey"] + "</li>")
            hideAddDeviceForm();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            var response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
        }
    }); 
}

// Show add device form and hide the add device button (really a link)
function showAddDeviceForm() {
    $("#deviceId").val("");           // Clear the input for the device ID
    $("#addDeviceControl").slideUp({
        "duration": 125,
        "complete": function(){
        $("#addDeviceForm").slideDown();  // Show the add device form
    }});    // Hide the add device link
    //$("#addDeviceForm").slideDown();  // Show the add device form
}

// Hides the add device form and shows the add device button (link)
function hideAddDeviceForm() {
    $("#addDeviceForm").slideUp({
        "duration": 125,
        "complete":function(){
        $("#addDeviceControl").slideDown();
    }});  // Hide the add device form
    //$("#addDeviceControl").show();  // Show the add device link
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
        sendReqForAccountInfo();
        sendReqForActivityInfo();
    }
    $("#addDeviceForm").hide();
    $(".collapsible").collapsible();
    // Register event listeners
    $("#addDevice").click(showAddDeviceForm);
    $("#registerDevice").click(registerDevice);   
    $("#cancel").click(hideAddDeviceForm);   
});
