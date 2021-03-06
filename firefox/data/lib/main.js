(function() {
	jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
			return function( elem ) {
					return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
			};
	});

	var URL = "https://script.google.com/macros/s/AKfycbxRSJAFYDdb_Mv1kvof7e6eOb3D2lOE_pjLbzumz3kohDM8pE08/exec";
	var composeCount = 0;
	var fromDraft = false;
	sessionStorage.debugger = "false";
	var GMERGE_COUNTS_FOR_PROMPT = [5,50,500];

	if (!localStorage.gmergeCount){
		localStorage.gmergeCount = "0";
	}
	if (!localStorage.gmergeFailedCount){
		localStorage.gmergeFailedCount = "0";
	}

	//if (window.location.href.indexOf("view=btop") > -1) {
		//setTimeout(function(){ 
			//insertMergeButton($("[aria-label='Attach files']"));
		//},2500);
	//}

	$(document).on('DOMNodeInserted', function(e) {
		if (window.location.href.indexOf("mailto") > -1 || 
				$(e.target).parents("[role='presentation']")[0]) {
			return;
		}
		if ($(e.target).attr("aria-label") === "Attach files") {
			insertMergeButton($(e.target));
		}
	});

	var newAuth = function(jQ) {
		var height = 200;
		var width = 300;
		var top = (screen.height - height)/2;
		var left = (screen.width - width)/2;
		var positionString = "height="+height+",width="+width+",top="+top+",left="+left;
		var win = window.open(URL,"windowName",positionString);
		//Firefox popup blocker
		setTimeout(function(){
			if(!win) {
				modalError('Seems like you have a popup blocker, click the popup blocked icon on the top right of the URL bar and click on "Show https://script.google....." and grant the authorization!');
				jQ.parents(".n1tfz").find(".oG").first().text("Saved").addClass("aOy");
			}
		},4000);
	};

	var insertMergeButton = function(jQ) {
		if (!jQ.parents(".iN").find("[role='button']:contains('GMerge')").length) {
			var button = '<td class="gU Up"><div class="J-J5-Ji" id=":18m"><div tabindex="1" role="button" id="btn-merge-'+ ++composeCount +'" class="T-I J-J5-Ji aoO T-I-atl L3" style="-moz-user-select: none;">GMerge</div></div></td>';
			jQ.parents(".iN").find(".gU.OoRYyc").after(button);
			var newJq = $("#btn-merge-"+composeCount);
			if ((getToLength(newJq) && getSubject(newJq)) || (findGmergeCsvLength(newJq) && getSubject(newJq))) {
				newJq.parents(".n1tfz").find(".oG").first().text("Saved").addClass("aOy");
				fromDraft = true;
			}
			insertListener(newJq);
		}
	};

	var startRequest = function(jQ){
		var interval = setInterval(function(){
			if(jQ.parents(".n1tfz").find(".oG.aOy").first().text() === "Saved"){
				ajaxRequest(jQ);
				clearInterval(interval);
			}
		},300);
		if (GMERGE_COUNTS_FOR_PROMPT.indexOf(parseInt(localStorage.gmergeCount)) >= 0){
			askForRatings();
		}
	};

	var removeSendListener = function(jQ){
		jQ.parents(".I5").find(".gU.Up > .J-J5-Ji").first().html("<div class='T-I J-J5-Ji aoO T-I-atl L3'>Send</div>");
	};

	var insertListener = function(jQ) {
		jQ.one("mousedown", function(event){
			event.preventDefault();
			if (event.which === 3){
				sessionStorage.debugger = "true";
				saveDebugObject(jQ);
				modalError("<p>If you accidentally right clicked and open this,"+
					" you can just close it.</p>"+sessionStorage.debug,
					null, "Debugging GMerge!");
				insertListener(jQ);
				return;
			}
			var forgot = "Seems like you forgot your ";
			if (findGmergeCsvLength(jQ)){
				if (!getSubject(jQ)){
					modalError(forgot + "subject");
					insertListener(jQ);
				} else {
					jQ.text("GMerging");
					startRequest(jQ);
					removeSendListener(jQ);
				}
			} else {
				if (!getSubject(jQ) && !getToLength(jQ)) {
					modalError(forgot + "subject and recipients");
					insertListener(jQ);
				} else if (!getSubject(jQ)) {
					modalError(forgot + "subject");
					insertListener(jQ);
				} else if (!getToLength(jQ)) {
					modalError(forgot + "recipients");
					insertListener(jQ);
				} else if ((getToLength(jQ) <= 1) && ((getCcLength(jQ) > 2) || (getBccLength(jQ) > 2))) {
					modalError("You must put all the recipients in the TO: field to GMerge");
					insertListener(jQ);
				} else if (invalidToFormat(jQ)) {
					modalError("Please make sure each recipient must be in this format: "
										+"<br />Chris Hadfield &lt;chris.hadfield@gmail.com&gt;");
					insertListener(jQ);
				} else {
					jQ.text("GMerging");
					startRequest(jQ);
					removeSendListener(jQ);
				}
			}
		});
	};

	var getDraftId = function(jQ) {
		return jQ.parents(".I5").find("input[name='draft']").val();
	};

	var getToLength = function(jQ) {
		return jQ.parents(".I5").find("input[name='to']").length;
	};

	var getCcLength = function(jQ) {
		return jQ.parents(".I5").find("input[name='cc']").length;
	};

	var getBccLength = function(jQ) {
		return jQ.parents(".I5").find("input[name='bcc']").length;
	};

	var getSubject = function(jQ) {
		return jQ.parents(".I5").find("input[name='subjectbox']").val();
	};

	var findGmergeCsvLength = function(jQ) {
		return jQ.parents(".I5").find(".vI:Contains('gmerge.csv')").length;
	};

	var invalidToFormat = function(jQ) {
		var incorrectFormat = false;
		jQ.parents(".I5").find("input[name='to']").each(function(){ 
			if (!(/.+\s<.+@.+\..+>/).test(this.value)){
				incorrectFormat = true;
				return false;
			}
		});
		return incorrectFormat;
	};

	//Different ajaxRequest due to how Firefox handles jsonp
	//Must use Firefox extension's request module
	var ajaxRequest = function(jQ) {
		self.port.emit("ajaxRequest", {draftId: getDraftId(jQ), url: URL, divId: jQ[0].id});
	};

	self.port.on("ajaxRequestResponse", function(response){
		var data = JSON.parse(response);
		var jQ = $("[id='"+data.divId+"']");
		if (data.response.status === "failed") {
			jQ.text("GMerge");
			modalError(data.response.error_message, jQ);
			insertListener(jQ);
			localStorage.gmergeFailedCount = parseInt(localStorage.gmergeFailedCount) + 1;
		} else if (data.response.status === "user_error") {
			jQ.text("GMerge");
			modalError(data.response.error_message);
			insertListener(jQ);
		} else if (data.response.status === "success") {
			jQ.parents(".aDh").find('[role="button"][aria-label="Discard draft"]').click();
			$(".vh").first().text("You have GMerged like a boss! You have "+data.response.quota_left+" GMerge emails left today!");
			localStorage.gmergeCount = parseInt(localStorage.gmergeCount) + 1;
		}
	});

	self.port.on("failedAjaxRequest", function(response){
		var data = JSON.parse(response);
		var jQ = $("[id='"+data.divId+"']");
		newAuth(jQ);
		jQ.text("GMerge");
		insertListener(jQ);
	});

	var modalStepByStep = function(){
		var messages = [];
		var currentMessage = 0; 
		var nextStep = function(){
			currentMessage++;
			showMessage();
		};
		var prevStep = function(){
			currentMessage--;
			showMessage();
		};
    var dialog = new GMailUI.ModalDialog("GMerge Alpha");
    var container = dialog.append(new GMailUI.ModalDialog.Container());
    var footer = dialog.append(new GMailUI.ModalDialog.Footer());
    var backButton = footer.append(new GMailUI.ModalDialog.Button("Back"));
		backButton.on('click', prevStep);
    var nextButton = footer.append(new GMailUI.ModalDialog.Button("Next"));
		nextButton.on('click', nextStep);
		var doneButton = footer.append(new GMailUI.ModalDialog.Button("Done","Done","cancel"));
		doneButton.on('click', dialog.close);
		var showMessage = function(){
			container.element[0].innerHTML = "";
			container.append(messages[currentMessage]);
			$(backButton.element).show();
			$(nextButton.element).show();
			$(doneButton.element).hide();
			if (currentMessage === 0) {
				$(backButton.element).hide();
			} else if (currentMessage === (messages.length-1)) {
				$(nextButton.element).hide();
				$(doneButton.element).show();
				localStorage.GmergeSeenTutorial = true;
			}
		};
		this.add = function(message){
			messages.push(message);
		};
		this.start = function(){
			showMessage();
			dialog.open();
		};
	};

	var imagePath = function(i){
		return "<img src='"+localStorage.gmergePath+"assets/"+i+".png'>";
	};

	// For debugging in the wild
	var getTo = function(jQ){
		return $.makeArray(jQ.parents(".I5").find("input[name='to']").map(function(){return this.value;}));
	};

	var getFrom = function(jQ){
		return jQ.parents(".I5").find("input[name='from']").val();
	};

	var getBody = function(jQ){
		return jQ.parents(".I5").find("div[aria-label='Message Body']").html();
	};

	var getAttachments = function(jQ){
		return $.makeArray(jQ.parents(".I5").find(".vI").map(function(){return this.innerHTML;}));
	};

	var getAttachmentSizes = function(jQ){
		return $.makeArray(jQ.parents(".I5").find(".vJ").map(function(){return this.innerHTML;}));
	};

	var saveDebugObject = function(debugJq){
		if (sessionStorage.debugger === "true"){
			sessionStorage.debug = JSON.stringify({
				userAgent: navigator.userAgent,
				from: getFrom(debugJq),
				to: getTo(debugJq),
				toCount: getToLength(debugJq),
				bccCount: getBccLength(debugJq),
				subject: getSubject(debugJq),
				body: getBody(debugJq),
				attachments: getAttachments(debugJq),
				attachmentSizes: getAttachmentSizes(debugJq),
				draftId: getDraftId(debugJq),
				fromDraft: fromDraft,
				composeCount: composeCount,
				seenTutorial: localStorage.GmergeSeenTutorial,
				gmergePath: localStorage.gmergePath,
				gmergeCount: localStorage.gmergeCount,
				gmergeFailedCount: localStorage.gmergeFailedCount,
				location: window.top.location.href
			}, undefined, 2).replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
	};

	var askForRatings = function(){
		var header  = "While waiting for your GMerge...";
		var message = "Thank you very much for using GMerge.<br><br>"+
									"My goal is to get many people to use GMerge since it's free. "+
									"And it seems like you have used GMerge a few times, "+
									"can you give GMerge a rating while waiting? Please?";
		dialog = new GMailUI.ModalDialog(header);
		container = dialog.append(new GMailUI.ModalDialog.Container());
		footer = dialog.append(new GMailUI.ModalDialog.Footer());
		var launch_store_link = function(){
			var store = "https://addons.mozilla.org/en-US/firefox/addon/gmerge-alpha";
			var win = window.open(store);
			dialog.close();
		};
		sureButton = footer.append(new GMailUI.ModalDialog.Button("Sure!"));
		sureButton.on('click', launch_store_link);
		okButton = footer.append(new GMailUI.ModalDialog.Button("Maybe next time","","cancel"));
		okButton.on('click', dialog.close);
		container.append(message);
		dialog.open();
	};

	var modalError = function(message, debugJq, header) {
		if (header) {
			dialog = new GMailUI.ModalDialog(header);
		} else {
			dialog = new GMailUI.ModalDialog("Houston, we have a problem!");
		}
    container = dialog.append(new GMailUI.ModalDialog.Container());
    footer = dialog.append(new GMailUI.ModalDialog.Footer());
    okButton = footer.append(new GMailUI.ModalDialog.Button("Aww, ok!","","cancel"));
    okButton.on('click', dialog.close);
		if (debugJq) {
			sessionStorage.debugger = "true";
			saveDebugObject(debugJq);
			container.append(sessionStorage.debug+"<br>");
		}
    container.append(message);
    dialog.open();
  };

	//Tutorial at the beginning
	if (!localStorage.GmergeSeenTutorial){
		var modalTutorial = new modalStepByStep();
		modalTutorial.add("<p>Thanks for being awesome by downloading GMerge Alpha now with a new feature for uploading CSV for more advanced merge! The first time you click the GMerge button, it will take a few seconds and there will be a popup asking for your authorization.</p>");
		modalTutorial.add("<p>The simplest way to GMerge is by entering contacts in your <b>To:</b> field as normal. You must use your regular contacts with names or something with this 'Bob Loblaw &#60;bob@loblaw.com&#62;' format.</p>"+imagePath("1"));
		modalTutorial.add("<p>Now type [First Name], [Last Name], [Full Name], or [Email] anywhere in the Subject or Body of the message and press the GMerge button.</p>"+imagePath("2"));
		modalTutorial.add("<p>Or you can upload a CSV attachment named gmerge.csv (<a href='https://dl.dropboxusercontent.com/u/3391326/gmerge.csv'>sample</a>) with the email fields such as the one below! If you use this option, the <b>To:</b> field will not be used in the merge.</p>"+imagePath("3"));
		modalTutorial.add("<p>Now go crazy and be much more flexible with the fields available!</p>"+imagePath("4"));
		modalTutorial.start();
	}
});
