var Gpio = require('onoff').Gpio;
var child_process = require('child_process');
var request = require('request');
var fs = require('fs');
var nodemailer = require('nodemailer');

var proc;
var pir;  
var transport;
var timestamp = 'aujourdhui';
var mailOptions;
var shooting = false;
var settings;

fs.readFile('./settings.json', (err, data) => {
    if (err) throw err;
    settings = JSON.parse(data);
	init();
});

function init(){
	pir = new Gpio( settings.device.pir_pin, 'in', 'both' );
	pir.watch(function(err, value) {
	  if (err) exit();

		if(value == 1){
			if(!shooting){
				console.log( "Mouvement" );
				shooting = true;
				// snap photo
				StartCapture();	
			}
		} else {
			//console.log( "pas de mouvement" );
		}
	});
}

function StartCapture(){

	var args = settings.camera;
	
    var blob;
    var SOI = false;
    var SOIChunk = false;
    var SOIPos;
 
    proc = child_process.spawn("raspistill", args);
	
    proc.stdout.on("data", function(chunk) {
        if (!SOI){
            // Start of Image (SOI) detection with: 0xFF 0xD8
            for (var i = 0; i < chunk.length - 1; i++){
                if (chunk.readUInt8(i) == 0xFF && chunk.readUInt8(i + 1) == 0xD8 && !SOI){
                    SOI = true;
                    SOIChunk = true;
                    SOIPos = i;
                }
            }
        }
 
        if (SOI){
            if (SOIChunk){
 				blob = Buffer.from(chunk.slice(SOIPos, chunk.length));
                SOIChunk = false;
            } else{
				blob = Buffer.concat([blob, chunk]);
			}
        }
 
        if (chunk.readUInt8(chunk.length - 2) == 0xFF && chunk.readUInt8(chunk.length - 1) == 0xD9 && SOI){
            var pic = blob.toString("base64");
            SOI = false;
			//sendpicbymail( pic );
			post_pic( pic );
        }
    });
 
    proc.stderr.on("data", function(err) {
        console.log(err.toString());
    })
}

function post_pic( base64pic ){
	var formData = {
		image: base64pic,
		timestamp: get_timestamp()
	};
	request.post({url: settings.server.url, formData: formData}, function optionalCallback(err, httpResponse, body) {
		if (err) {
			return console.error('upload failed:', err);
		}
		var picurl = settings.server.url + JSON.parse(httpResponse.body);
		sendpicbymail( '', picurl );
		console.log( 'Upload successful:' + picurl );
        console.log( "Watching" );
		shooting = false;
	});	
}

function sendpicbymail( base64pic, alert_only ){
	transport = nodemailer.createTransport( settings.email );	
	mailOptions = settings.mailOptions;

    mailOptions.subject = "Alerte intrusion " + get_timestamp();
	
	if( alert_only ){
		mailOptions.html = "<a href='"+settings.server.url+"'><img src='" + alert_only + "'/></a>";
	} else {
		mailOptions.html = "<img src='data:image/jpeg;base64," + base64pic + "'/>";
	}  

    // sendmail
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error(error);
        }
        console.log('message sent: %s', info.messageId);
        shooting = false;
        console.log( "Watching" );
    })	
}


function get_timestamp(){
    const dtFormat = new Intl.DateTimeFormat('fr-FR', {
      timeStyle: 'medium',
      dateStyle: 'medium'
    });

	return dtFormat.format( new Date() );	
}

console.log('Rodocam running');
console.log( "Watching" );

function exit() {
  pir.unexport();
  process.exit();
}