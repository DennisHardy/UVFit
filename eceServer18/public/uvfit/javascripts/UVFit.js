$(document).ready(function(){
    $('.sidenav').sidenav();
    $(".dropdown-trigger").dropdown({coverTrigger: false});
    $(".signOutButton").click(function(){
      window.localStorage.removeItem("authToken");
      window.location = "index.html";
    });
});