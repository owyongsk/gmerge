Gmailr.debug = true; // Turn verbose debugging messages on

// TODO
// server validation for stuff
// test on windows machine
// Remove dependency on Gmailr

Gmailr.init(function(G) {
	$(document).on('DOMNodeInserted', function(e) {
		if ($(e.target).attr("aria-label") === "Compose reply")
			insertMergeButton($(e.target));
	});

	var URL = "https://script.google.com/macros/s/AKfycbxRSJAFYDdb_Mv1kvof7e6eOb3D2lOE_pjLbzumz3kohDM8pE08/exec";
	var composeCount = 0;

	var newAuth = function(jQ) {
		var height = 200;
		var width = 300;
		var top = (screen.height - height)/2;
		var left = (screen.width - width)/2;
		var positionString = "height="+height+",width="+width+",top="+top+",left="+left
		var win = window.open(URL,"windowName",positionString);
		var objwin = new RegExp('object','gi');
		setTimeout(function(){
				if(typeof win.outerHeight ==="undefined" || parseInt(win.outerHeight)<200){
					modalError("Seems like you have a popup blocker, click the popup blocked icon on the top right of the URL bar and click on Authorization needed and grant the authorization!");
					insertListener(jQ);
				}
			},5000);
	}

	var insertMergeButton = function(jQ) {
		if (!jQ.parents(".iN").find("[role='button']:contains('GMerge')").length) {
			var button = '<td class="gU Up"><div class="J-J5-Ji" id=":18m"><div tabindex="1" role="button" id="btn-merge-'+ ++composeCount+'" class="T-I J-J5-Ji aoO T-I-atl L3" style="-moz-user-select: none;">GMerge</div></div></td>';
			jQ.parents(".iN").find(".gU.OoRYyc").after(button);
			var newJq = $("#btn-merge-"+composeCount);
			newJq.data({fromDraft: getDraftId(jQ)});
			insertListener(newJq);
		}
	}

	// those hidden fields uses ajax too there's a few MS delay
	// must change them into real time instead of waiting for response

	var insertListener = function(jQ) {
		jQ.one("click", function(event){
			event.preventDefault();
			var forgot = "Seems like you forgot your ";
			if (!getSubject(jQ) && !getTo(jQ)) {
				modalError(forgot + "subject and recipients");
				insertListener(jQ);
			} else if (!getSubject(jQ)) {
				modalError(forgot + "subject");
				insertListener(jQ);
			} else if (!getTo(jQ)) {
				modalError(forgot + "recipients");
				insertListener(jQ);
			} else {
				if (jQ.parents(".n1tfz").find(".oG.aOy").first().text() === "Saved" || getDraftId(jQ)) {
					ajaxRequest(jQ)
				} else {
					modalError("Seems like you clicked too fast, just wait a few more seconds for the draft to save in Gmail");
					insertListener(jQ);
				}
			}
		});
	}

	var getDraftId = function(jQ) {
		return jQ.parents(".I5").find("input[name='draft']").val();
	}

	var getTo = function(jQ) {
		return jQ.parents(".I5").find("input[name='to']").val();
	}

	var getSubject = function(jQ) {
		return jQ.parents(".I5").find("input[name='subject']").val();
	}

	var ajaxRequest = function(jQ) {
		jQ.text("GMerging");
		$.ajax({
			url: URL,
			crossDomain: true,
			data: {id: getDraftId(jQ)},
			dataType: "jsonp",
			success: function(data){
				if (data.status === "failed"){
					newAuth(jQ);
					jQ.text("GMerge");
					modalError(data.error_message);
					insertListener(jQ);
				} else if (data.status === "success") {
					jQ.parents(".aDh").find('[role="button"][aria-label="Discard draft"]').click()
					$(".vh").first().text("You have Gmerged like a boss! You have "+data.quota_left+" Gmerge emails left today!");
				}
			},
			error: function(obj, msg, error){
				// TODO Check the error (possibly using return type) for authenticating or for retrying
				newAuth(jQ);
				jQ.text("GMerge");
				insertListener(jQ);
			}
		});
}

	var modalError = function(message) {
    dialog = new GMailUI.ModalDialog("Houston, we have a problem!");
    container = dialog.append(new GMailUI.ModalDialog.Container);
    footer = dialog.append(new GMailUI.ModalDialog.Footer);
    okButton = footer.append(new GMailUI.ModalDialog.Button("Aww, ok!"));
    okButton.on('click', dialog.close);
    container.append(message);
    dialog.open();
  }

});
