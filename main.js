Gmailr.debug = true; // Turn verbose debugging messages on


Gmailr.init(function(G) {
	$(document).bind('DOMNodeInserted', function(e) {
		if (e.target == $("[role='textbox']").last()[0])
			insertMergeButton();
	});

	var URL = "https://script.google.com/macros/s/AKfycbxRSJAFYDdb_Mv1kvof7e6eOb3D2lOE_pjLbzumz3kohDM8pE08/exec"

	var newAuth = function() {
		var height = 200;
		var width = 300;
		var top = (screen.height - height)/2;
		var left = (screen.width - width)/2;
		var positionString = "height="+height+",width="+width+",top="+top+",left="+left
		var win = window.open(URL,"windowName",positionString);
		var objwin = new RegExp('object','gi');
		setTimeout(function(){
				if(typeof win.outerHeight ==="undefined" || parseInt(win.outerHeight)<200)
					modalError("Seems like you have a popup blocker, click the popup blocked icon on the top right of the URL bar and click on Authorization needed and grant the authorization!");
			},5000);
	}

	var insertMergeButton = function() {
		if ($("#btn-merge").length == 0) {
			var button = '<td class="gU Up"><div class="J-J5-Ji" id=":18m"><div tabindex="1" role="button" id="btn-merge" class="T-I J-J5-Ji aoO T-I-atl L3" style="-moz-user-select: none;">GMerge</div></div></td>';
			$(".gU.OoRYyc").after(button);
			insertListener();
		}
	}

	var mailSubject = "";
	var mailTo = "";

	var insertListener = function() {
		$("#btn-merge").one("click", function(event){
			event.preventDefault();
			if ($(".oG.aOy").first().text() == "Saved") {
				var forgot = "Seems like you forgot your ";
				if (!mailSubject && !mailTo.length)
					modalError(forgot + "subject and recipients");
				else if (!mailSubject)
					modalError(forgot + "subject");
				else if (!mailTo.length)
					modalError(forgot + "recipients");
				else {
					$("#btn-merge").text("GMerging");
					$.ajax({
						url: URL,
						crossDomain: true,
						data: {subject:mailSubject},
						dataType: "jsonp",
						success: function(data){
							if (data.status == "failed"){
								newAuth();
								$("#btn-merge").text("GMerge");
								modalError(data.error_message);
							} else if (data.status == "success") {
								$('[role="button"][aria-label="Discard draft"]').click()
								$(".vh").first().text("You have Gmerged like a boss! You have "+data.quota_left+" Gmerge emails left today!");
							}
						},
						error: function(obj, msg, error){
							// TODO Check the error (possibly using return type) for authenticating or for retrying
							newAuth();
							$("#btn-merge").text("GMerge");
							insertListener();
						}
					});
				}
			}
			else
				modalError("Seems like you clicked too fast, just wait a few more seconds for the draft to save in Gmail");
		});
	}

	var modalError = function(message) {
		insertListener();
    dialog = new GMailUI.ModalDialog("Houston, we have a problem!");
    container = dialog.append(new GMailUI.ModalDialog.Container);
    footer = dialog.append(new GMailUI.ModalDialog.Footer);
    okButton = footer.append(new GMailUI.ModalDialog.Button("Aww, ok!"));
    okButton.on('click', dialog.close);
    container.append(message);
    dialog.open();
  }

	G.observe(Gmailr.EVENT_DRAFT_SAVE, function(details) {
		mailSubject = details.subject;
		mailTo = details.to;
	});

});
