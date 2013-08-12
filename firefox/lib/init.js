var self = require("sdk/self");

require("sdk/page-mod").PageMod({
	include: ["https://mail.google.com/*","http://mail.google.com/*"],
	contentScript: "localStorage.gmergePath = '"+self.data.url("")+"';",
	contentScriptFile: [self.data.url("lib/vendor/jquery.min.js"),
											self.data.url("lib/vendor/underscore-min.js"),
											self.data.url("lib/vendor/gmailui.js"),
											self.data.url("lib/main.js")],
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		worker.port.on("ajaxRequest", function(message) {
			require("sdk/request").Request({
				url: message.url,
				content: {id: message.draftId},
				onComplete: function(response){
					if (response.text.match(/Authorization needed/) !== null) {
						worker.port.emit("failedAjaxRequest", '{"divId":"'+message.divId+'"}')
					} else {
						var resp = '{"divId":"'+message.divId+'", "response":'+response.text+'}';
						worker.port.emit("ajaxRequestResponse", resp);
					}
				}
			}).get();
		});
	}
});
