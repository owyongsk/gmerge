// Server side code using Google AppScript

  //TO-DO (probably in the client side javascript)
  // - make sure the gmerge.csv name is gmerge.csv * how the F?
  // - check for over 50 email addresses

//var MAIL_REGEX = /([A-z0-9._-]+@[A-z0-9._-]+\.[A-z0-9._-]+)/gi;
//var NAME_REGEX = /([A-z0-9._-]+\s[A-z0-9._-]+\s*[A-z0-9._-]+)/gi;
var MAIL_REGEX = /\<(.*)\>/i;
var NAME_REGEX = /(.*) \</i;
var FIRST_NAME_REGEX = /(\[First Name\])/gi;
var LAST_NAME_REGEX = /(\[Last Name\])/gi;
var FULL_NAME_REGEX = /(\[Full Name\])/gi;
var EMAIL_FIELD_REGEX = /(\[Email\])/gi;
var GMERGE_CSV_REGEX = /^(gmerge.csv)$/i;

function test(){
  var m = GmailApp.getDraftMessages()[0];
  //var csv = findGmergeCSV(m.getAttachments());
  //csv = Utilities.parseCsv(csv.getDataAsString());
  //Logger.log(csv);
  Logger.log(m.getTo().replace(/"/gi,""));
}

function findGmergeCSV(attachments){
  for (i=0;i<attachments.length;i++){
    if (GMERGE_CSV_REGEX.test(attachments[i].getName()))
      return attachments[i];
  }
  return null;
}

function doGet(req) {
  var id = req.parameters.id;
  if (id == undefined)
  {
    return ContentService.createTextOutput("That authorization was just one time, sometimes you will get it again because I made some changes. You can now close this window and press Gmerge and it will work!");
  }
  else
  {
    try {
      var message = GmailApp.getMessageById(id);
      var csv = findGmergeCSV(message.getAttachments());
      if (csv){
        csv = Utilities.parseCsv(csv.getDataAsString());
        var recipientLength = csv.length-1;
      } else {
        var recipientLength = message.getTo().match(MAIL_REGEX).length;
      }
      var quota = MailApp.getRemainingDailyQuota();
      var csv_recipients = null;
      if ( recipientLength > quota) {
        var json = JSON.stringify({ status: "failed", error_message: "Oh noes! You have only "+quota.toString()+" emails left to send but you are trying to send "+recipientLength.toString()+" emails"});
      } else {
        if (csv)
          csv_recipients = mailMergeFromCSV(message, csv);
        else
          mailMerge(message);
        var json = JSON.stringify({ status: "success", quota_left: MailApp.getRemainingDailyQuota().toString(), csv_recipients: csv_recipients });
      }
    } catch(err) {
      if (err === "no email column found")
        var json = JSON.stringify({ status: "user_error", error_message: "Your CSV file did not have an email column. Please add an email column with your recipient's addresses. Take a look at a sample CSV file <a href='https://dl.dropboxusercontent.com/u/3391326/gmerge.csv'>here</a> if you are confused." });
      else if (err === "bad csv")
        var json = JSON.stringify({ status: "user_error", error_message: "Your CSV file is invalid. Take a look at a sample CSV file <a href='https://dl.dropboxusercontent.com/u/3391326/gmerge.csv'>here</a> and start from there!" });
      else
        var json = JSON.stringify({ status: "failed", error_message: JSON.stringify(err) + "<br><br><p>If this error kept happening, please try this alternative solution <a href='www.labnol.org/internet/personalized-mail-merge-in-gmail/20981/#free'>here</a>.</p><br><br><p>Please copy this error message and email dude@owyong.sk so he can try and fix this. He swears on his unborn grandchildren's tears to take a look at this.</p>" });
    }
    // jsonp for chrome, json for firefox
    if (req.parameters.callback === undefined)
      var jsonData = json;
    else
      var jsonData = req.parameters.callback[0]+"("+json+")";

    return ContentService.createTextOutput(jsonData).setMimeType(ContentService.MimeType.JSON);
  }
}

function mailMergeFromCSV(m, data) {

  var fromName = m.getFrom().match(NAME_REGEX)[1];
  var fromAddr = m.getFrom().match(MAIL_REGEX)[1].toLowerCase();

  for (i=1;i<data.length;i++){
    var subject = m.getSubject();
    var body = m.getBody();
    var emailColumn = null;
    // Replacing message with data from CSV
    try {
      for (j=0;j<data[0].length;j++){
        var regexp = new RegExp("\\["+data[0][j]+"\\]","gi");
        subject = subject.replace(regexp,data[i][j]);
        body = body.replace(regexp,data[i][j]);
        if (emailColumn === null){
          if (/(email)/i.test(data[0][j])) emailColumn = j;
        }
      }
    } catch(err) {
      throw "bad csv";
    }
    if (emailColumn === null) throw "no email column found";
    var advancedArgs = {from: fromAddr, htmlBody: body, name: fromName};
    var att = m.getAttachments();
    for (c=0;c<att.length;c++) {
      if (GMERGE_CSV_REGEX.test(att[c].getName())) att.splice(c,1);
    }
    if (att) advancedArgs["attachments"] = att;
    if (m.getCc()) advancedArgs["cc"] = m.getCc();
    if (m.getBcc()) advancedArgs["bcc"] = m.getBcc();
    if (m.getReplyTo()) advancedArgs["replyTo"] = m.getReplyTo();

    try {
      GmailApp.sendEmail(data[i][emailColumn], subject, body, advancedArgs);
    } catch(err) {
      throw "bad csv";
    }
  }
  return data.length-1;
}

function mailMerge(m) {
  var regexArray = [FIRST_NAME_REGEX,LAST_NAME_REGEX,FULL_NAME_REGEX,EMAIL_FIELD_REGEX];

  var fromName = m.getFrom().match(NAME_REGEX)[1];
  var fromAddr = m.getFrom().match(MAIL_REGEX)[1].toLowerCase();

  var toArray = m.getTo().split(", ");

  for (i=0;i<toArray.length;i++) {
    var fullName = toArray[i].match(NAME_REGEX)[1].replace(/"/gi,"");
    var firstName = fullName.split(' ')[0];
    var lastName = fullName.split(' ')[fullName.split(' ').length-1];
    var toAddr = toArray[i].match(MAIL_REGEX)[1];
    var fieldArray = [firstName, lastName, fullName, toAddr];
    var subject = m.getSubject();
    var body = m.getBody();

    for (j=0;j<regexArray.length;j++){
      subject = subject.replace(regexArray[j],fieldArray[j]);
      body = body.replace(regexArray[j],fieldArray[j]);
    }

    var advancedArgs = {from: fromAddr, htmlBody: body, name: fromName };
    if (m.getAttachments())
      advancedArgs["attachments"] = m.getAttachments();
    if (m.getCc())
      advancedArgs["cc"] = m.getCc();
    if (m.getBcc())
      advancedArgs["bcc"] = m.getBcc();
    if (m.getReplyTo())
      advancedArgs["replyTo"] = m.getReplyTo();
    GmailApp.sendEmail(toAddr, subject, body, advancedArgs);
  }
}
