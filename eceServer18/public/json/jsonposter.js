function postJson() {
    var url = document.getElementById("url").value;
    var json = document.getElementById("jsonData").value;

    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", processResponse);
    xhr.responseType = "json";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(json);
}

// Response listener for the Ajax call for posting a participation 
function processResponse() {
    var responseDiv = document.getElementById('ServerResponse');
    var responseHTML = "";

    // 201 is the response code for a successful POST request
    if (this.status === 201) {
        responseHTML += "<ol class='ServerResponse'>";

        for (var key in this.response) {
            responseHTML += "<li>" + key + ": " + this.response[key] + "</li>";
        }
        responseHTML += "</ol>"
    }
    else {
        responseHTML = "<p>Response (" + this.status + "):</p>"
        responseHTML += "<ol class='ServerResponse'>";

        for (var key in this.response) {
            responseHTML += "<li>" + key + ": " + this.response[key] + "</li>";
        }
        responseHTML += "</ol>"
    }

    // Update the response div in the webpage and make it visible
    responseDiv.style.display = "block";
    responseDiv.innerHTML = responseHTML;
}

document.getElementById("postJson").addEventListener("click", postJson);
