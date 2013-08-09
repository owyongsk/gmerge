// TODO
// server validation for stuff
// test on windows machine

$(document).ready(function() {
	jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
			return function( elem ) {
					return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
			};
	});

	if (window.location.href.indexOf("view=btop") > -1)
		setTimeout(function(){ 
			insertMergeButton($("[aria-label='Compose reply']"));
		},2500);

	$(document).on('DOMNodeInserted', function(e) {
		if ($(e.target).attr("aria-label") === "Message Body")
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
			if(typeof win.outerHeight ==="undefined" || parseInt(win.outerHeight)<200)
				modalError('Seems like you have a popup blocker, click the popup blocked icon on the top right of the URL bar and click on the blue link "Authorization needed" and grant the authorization!');
		},4000);
	}

	var insertMergeButton = function(jQ) {
		if (!jQ.parents(".iN").find("[role='button']:contains('GMerge')").length) {
			var button = '<td class="gU Up"><div class="J-J5-Ji" id=":18m"><div tabindex="1" role="button" id="btn-merge-'+ ++composeCount+'" class="T-I J-J5-Ji aoO T-I-atl L3" style="-moz-user-select: none;">GMerge</div></div></td>';
			jQ.parents(".iN").find(".gU.OoRYyc").after(button);
			var newJq = $("#btn-merge-"+composeCount);
			if ((getToLength(newJq) && getSubject(newJq)) || (findGmergeCsvLength(newJq) && getSubject(newJq)))
				newJq.data({fromDraft: true});
			insertListener(newJq);
		}
	}

	var insertListener = function(jQ) {
		jQ.one("click", function(event){
			event.preventDefault();
			var forgot = "Seems like you forgot your ";
			if (findGmergeCsvLength(jQ)){
				if (!getSubject(jQ)){
					modalError(forgot + "subject");
					insertListener(jQ);
				} else if (jQ.data("fromDraft")) {
					jQ.text("GMerging");
					setTimeout(function(){ajaxRequest(jQ)},2500);
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
				} else if (jQ.data("fromDraft")) {
					jQ.text("GMerging");
					setTimeout(function(){ajaxRequest(jQ)},2500);
				} else {
					jQ.text("GMerging");
					interval = setInterval(function(){
						if(jQ.parents(".n1tfz").find(".oG.aOy").first().text() === "Saved"){
							ajaxRequest(jQ);
							clearInterval(interval);
						}
					},300)
				}
			}
		});
	}

	var getDraftId = function(jQ) {
		return jQ.parents(".I5").find("input[name='draft']").val();
	}

	var getToLength = function(jQ) {
		return jQ.parents(".I5").find("input[name='to']").length;
	}

	var getSubject = function(jQ) {
		return jQ.parents(".I5").find("input[name='subjectbox']").val();
	}

	var findGmergeCsvLength = function(jQ) {
		return jQ.parents(".I5").find(".vI:Contains('gmerge.csv')").length;
	}

	var ajaxRequest = function(jQ) {
		$.ajax({
			url: URL,
			crossDomain: true,
			data: {id: getDraftId(jQ)},
			dataType: "jsonp",
			success: function(data){
				if (data.status === "failed") {
					jQ.text("GMerge");
					modalError(data.error_message);
					insertListener(jQ);
				} else if (data.status === "success") {
					jQ.parents(".aDh").find('[role="button"][aria-label="Discard draft"]').click()
					$(".vh").first().text("You have GMerged like a boss! You have "+data.quota_left+" GMerge emails left today!");
				}
			},
			error: function(obj, msg, error){
				newAuth(jQ);
				jQ.text("GMerge");
				insertListener(jQ);
			}
		});
	}

	var modalStepByStep = function(){
		var messages = [];
		var currentMessage = 0; 
		var nextStep = function(){
			currentMessage++;
			showMessage();
		}
		var prevStep = function(){
			currentMessage--;
			showMessage();
		}
    var dialog = new GMailUI.ModalDialog("GMerge Alpha");
    var container = dialog.append(new GMailUI.ModalDialog.Container);
    var footer = dialog.append(new GMailUI.ModalDialog.Footer);
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
			}
		}
		this.add = function(message){
			messages.push(message);
		}
		this.start = function(){
			showMessage();
			dialog.open();
		};
	}

	var imagePath = function(i){
		return "<img src='"+localStorage.gmergePath+"assets/"+i+".png'>"
	}

	var modalError = function(message) {
    dialog = new GMailUI.ModalDialog("Houston, we have a problem!");
    container = dialog.append(new GMailUI.ModalDialog.Container);
    footer = dialog.append(new GMailUI.ModalDialog.Footer);
    okButton = footer.append(new GMailUI.ModalDialog.Button("Aww, ok!","","cancel"));
    okButton.on('click', dialog.close);
    container.append(message);
    dialog.open();
  }

	if (!localStorage.GmergeSeenTutorial){
		var modalTutorial = new modalStepByStep();
		modalTutorial.add("<p>Thanks for being awesome by downloading GMerge Alpha now with a new feature for uploading CSV for more advanced merge! The first time you click the GMerge button, there will be a popup asking for your authorization.</p>");
		modalTutorial.add("<p>The simplest way to GMerge is by entering contacts in your <b>To:</b> field as normal. You must use your regular contacts with names or something with this 'Bob Loblaw &#60;bob@loblaw.com&#62;' format.</p>"+imagePath("1"));
		modalTutorial.add("<p>Now type [First Name], [Last Name], [Full Name], or [Email] anywhere in the Subject or Body of the message and press the GMerge button.</p>"+imagePath("2"));
		modalTutorial.add("<p>Or you can upload a CSV file named gmerge.csv with the email fields such as the one below! If you use this option, the <b>To:</b> field will not be used in the merge.</p>"+imagePath("3"));
		modalTutorial.add("<p>Now go crazy and be much more flexible with the fields available!</p>"+imagePath("4"));
		modalTutorial.start();
		localStorage.GmergeSeenTutorial = true;
	}
});
