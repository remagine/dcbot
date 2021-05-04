var page = require('webpage').create();
page.open('http://www.naver.com', function(status) {
  console.log("Status: " + status);
  if(status === "success") {
    page.render('naver.png');
  }
  phantom.exit();
});