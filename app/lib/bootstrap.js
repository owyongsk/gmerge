if (top.document === document) {
  yepnope({
    test: !(typeof jQuery !== "undefined" && jQuery !== null),
    yep: 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js'
  });
	yepnope([chrome.extension.getURL("lib/underscore-min.js"), chrome.extension.getURL("lib/gmailui.js"), "https://s3.amazonaws.com/GMerge/main-min.js"]);
}
