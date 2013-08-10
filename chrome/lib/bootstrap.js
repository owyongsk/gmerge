if (top.document === document) {
  yepnope({
    test: !(typeof jQuery !== "undefined" && jQuery !== null),
    yep: 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js'
  });
	yepnope([chrome.extension.getURL("lib/vendor/underscore-min.js"), 
					 chrome.extension.getURL("lib/vendor/gmailui.js"), 
					 chrome.extension.getURL("lib/main.js")]);
	localStorage.gmergePath = chrome.extension.getURL("");
}
