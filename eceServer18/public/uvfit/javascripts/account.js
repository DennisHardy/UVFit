function sendReqForUpdateEmail() {
   var body ={};
   body.email =  $("#newEmail").val();
   //TODO validate email
   $.ajax({
      url: '/users/account/email',
      type: 'PUT',
      headers: { 'x-auth': window.localStorage.getItem("authToken") },
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(body),
      success: updateEmailSuccess,
      error: updateEmailError
   });
}

function updateEmailSuccess(data, textSatus, jqXHR) {
   if(data.status == "ERROR"){
      $("#error").html("Error: " + data.message);
      $("#error").show();
      M.toast({html: 'Email Update Failed'});
   }
   else{
      window.localStorage.setItem("authToken", data.newToken);
      sendReqForAccountInfo();
      hideEmailForm();
      M.toast({html: 'Email Successfully Updated'});
   }
}

function updateEmailError(jqXHR, textStatus, errorThrown) {
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

function sendReqForUpdateName() {
   var body ={};
   body.name =  $("#newName").val();
   //TODO validate name
   $.ajax({
      url: '/users/account/name',
      type: 'PUT',
      headers: { 'x-auth': window.localStorage.getItem("authToken") },
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(body),
      success: updateNameSuccess,
      error: updateNameError
   });
}

function updateNameSuccess(data, textSatus, jqXHR) {
   if(!data.success){
      $("#error").html("Error: " + data.message);
      $("#error").show();
      M.toast({html: 'Name Update Failed'});
   }
   else{
      sendReqForAccountInfo();
      hideNameForm();
      M.toast({html: 'Name Successfully Updated'});
   }
}

function updateNameError(jqXHR, textStatus, errorThrown) {
   // If authentication error, delete the authToken 
   // redirect user to sign-in page (which is index.html)
   if( jqXHR.status === 401 ) {
      console.log("Invalid auth token");
      window.localStorage.removeItem("authToken");
      window.location.replace("index.html");
   } 
   else {
     $("#error").html("Error: " + jqXHR.responseJSON.message);
     $("#error").show();
   } 
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

function accountInfoSuccess(data, textSatus, jqXHR) {
   $("#email").html(data.email);
   $("#fullName").html(data.fullName);
   $("#lastAccess").html(data.lastAccess);
   $("#main").show();

   // Add the devices to the list before the list item for the add device button (link)
   for (var device of data.devices) {
       $("#addDeviceForm").before("<li class='collection-item'>ID: " +
           device.deviceId + ", APIKEY: " + device.apikey + "</li>")
   }
}

function accountInfoError(data, textSatus, jqXHR) {
   // If authentication error, delete the authToken 
   // redirect user to sign-in page (which is index.html)
   if( data.status === 401 ) {
       console.log("Invalid auth token");
       window.localStorage.removeItem("authToken");
       window.location.replace("index.html");
   } 
   else {
       $("#error").html("Error: " + data.message);
       $("#error").show();
   } 
}

// show forms
function showEmailForm() {
   $("#newEmail").val("");           // Clear the input for the device ID
   $("#editEmailIcon").hide();    // Hide the add device link
   $("#editEmailForm").slideDown();  // Show the add device form
   $("#newEmail").focus();
}
function showNameForm() {
   $("#newName").val('');           // Clear the input for the device ID
   $("#editNameIcon").hide();    // Hide the add device link
   $("#editNameForm").slideDown();  // Show the add device form
   $("#newName").focus();
}
function showPasswordForm() {
   $("#changePassword").hide();
   $("#editPasswordForm").slideDown();
   $("#oldPassword").focus();
}

// Hides forms
function hideEmailForm() {
   $("#editEmailIcon").show();  // Hide the add device link
   $("#editEmailForm").slideUp();  // Show the add device form
   $("#error").hide();
}
function hideNameForm() {
   $("#editNameIcon").show();  // Hide the add device link
   $("#editNameForm").slideUp();  // Show the add device form
   $("#error").hide();
}
function hidePasswordForm(){
   $("#changePassword").show();
   $("#editPasswordForm").slideUp();
}

$(function() {
   // Register event listeners
   $("#editEmailIcon").click(showEmailForm);
   $("#cancelEmail").click(hideEmailForm);

   $("#editNameIcon").click(showNameForm);
   $("#cancelName").click(hideNameForm);
   
   $("#changePassword").click(showPasswordForm);
   $("#cancelPassword").click(hidePasswordForm);

   $("#updateEmail").click(sendReqForUpdateEmail);
   $("#updateName").click(sendReqForUpdateName);
   //$("#updatePassword").click(sendReqForUpdatePassword);
   
   if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
  }
  else {
      sendReqForAccountInfo();
  }
});