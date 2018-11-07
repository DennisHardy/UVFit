var map = null;

function getRecentPotholes() {
    var token = window.localStorage.getItem("authToken");
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", displayMostRecentPothole);
    xhr.responseType = "json";   
    xhr.open("GET", "/potholes/recent/14");
    xhr.setRequestHeader("x-auth", token);
    xhr.send();
}

function displayMostRecentPothole() {
   document.getElementById("main").style.display = "block";

   if (this.status === 200) {
	   // If there's at least one pothole, draw the map
	   var latitude = 32.2319;
	   var longitude = -110.9501;
      var potholeReport = "No potholes have been reported in the last three days.";
   
	   if (this.response.potholes.length > 0) {
	      var latitude = this.response.potholes[this.response.potholes.length-1].latitude;
	      var longitude = this.response.potholes[this.response.potholes.length-1].longitude;
		
	      // Add descriptive text of the pothole recently reported 
	      potholeReport = this.response.potholes.length +
		                  " potholes have been reported in the last three days. The most recent pothole (shown above) was hit " +
		                  this.response.potholes[this.response.potholes.length-1].totalHits + " times.";
	   }
	    
	   potholeText.innerHTML = potholeReport;
	   // Create a map centered at the most recent pothole location
      var uluru = {lat: latitude, lng: longitude};
      var map = new google.maps.Map(document.getElementById('map'), {
		   zoom: 9,
		   center: uluru
	   });
	    
	   // Add markers for all potholes            
      for (var pothole of this.response.potholes) {
         uluru = {lat: pothole.latitude, lng: pothole.longitude};
         var marker = new google.maps.Marker({
            position: uluru,
            map: map,
            label: {
               text: "" + pothole.totalHits,
               color: 'black',
               fontSize: "10px"
            },
		   });
      }                
    }
    else if (this.status === 401) {
        window.localStorage.removeItem("authToken");
        window.location = "index.html";
    }
    else {
        potholeText.innerHTML = "Error communicating with server.";
    }    
}

// Executes once the google map api is loaded, and then sets up the handler's and calls
// getRecentPotholes() to display the recent potholes
function initRecent() {
    // Allow the user to refresh by clicking a button.
    document.getElementById("refreshRecent").addEventListener("click", getRecentPotholes);
    getRecentPotholes();
}

// Handle authentication on page load
$(function() {
   // If there's no authToekn stored, redirect user to 
   // the sign-in page (which is index.html)
   if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
   }
});
