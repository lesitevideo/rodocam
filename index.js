/*
Status du dongle 4G :
http://192.168.100.1/api/monitoring/status
http://192.168.100.1/api/wlan/station-information

SMS API :
http://192.168.100.1/api/sms/sms-count :
<?xml version="1.0" encoding="utf-8"?>
<response>
	<LocalUnread>1</LocalUnread>
	<LocalInbox>2</LocalInbox>
	<LocalOutbox>0</LocalOutbox>
	<LocalDraft>0</LocalDraft>
	<LocalDeleted>0</LocalDeleted>
	<SimUnread>0</SimUnread>
	<SimInbox>0</SimInbox>
	<SimOutbox>0</SimOutbox>
	<SimDraft>0</SimDraft>
	<LocalMax>500</LocalMax>
	<SimMax>30</SimMax>
	<SimUsed>0</SimUsed>
	<NewMsg>0</NewMsg>
</response>

http://192.168.100.1/api/monitoring/check-notifications :
<?xml version="1.0" encoding="UTF-8"?>
<response>
<UnreadMessage>1</UnreadMessage>
<SmsStorageFull>0</SmsStorageFull>
<OnlineUpdateStatus>13</OnlineUpdateStatus>
</response>

http://192.168.100.1/api/sms/send-sms
<?xml version="1.0" encoding="UTF-8"?>
<request>
	<Index>-1</Index>
	<Phones><Phone>0661xxxxxx</Phone></Phones>
	<Sca></Sca>
	<Content>ezrzerzerzerezr</Content>
	<Length>15</Length>
	<Reserved>1</Reserved>
	<Date>2021-01-28 20:13:11</Date>
</request>

*/

var Gpio = require('onoff').Gpio;
var child_process = require('child_process');
var request = require('request');
var RaspiCam = require("raspicam");
var fs = require('fs');
var nodemailer = require('nodemailer');


var pir;  
var transport;
var timestamp = 'aujourdhui';
var mailOptions;
var shooting = false;
var camera;
var settings;

fs.readFile('./settings.json', (err, data) => {
    if (err) throw err;
    settings = JSON.parse(data);
	init();
});

function init(){
	
	pir = new Gpio( settings.device.pir_pin, 'in', 'both' );
	transport = nodemailer.createTransport( settings.email );	
	camera = new RaspiCam( settings.camera );
	mailOptions = settings.mailOptions;
	
	pir.watch(function(err, value) {
	  if (err) exit();

		if(value == 1){
			if(!shooting){
				console.log( "Intruder detected, shooting" );
				shooting = true;

				// 1 prendre la photo
				camera.start();

			}
		} else {
			//console.log( "pas de mouvement" );
		}

	});

	camera.on("start", function(){
		console.log( "start" );
	});

	camera.on("read", function(err, timestamp, filename){ 
		//console.log( "read" );
	});

	camera.on("stop", function(){
		//console.log( "stop" );
	});

	camera.on("exit", function(){
		console.log( "fin pic, sending mail..." );

		const dtFormat = new Intl.DateTimeFormat('fr-FR', {
		  timeStyle: 'medium',
		  dateStyle: 'medium'
		});

		timestamp = dtFormat.format( new Date() );	
		
		mailOptions.subject = "Alerte intrusion " + timestamp;
		
		mailOptions.attachments[0].path =  __dirname + '/' + settings.camera.output;
		
		//console.log( mailOptions );
		//shooting = false;
		//return false;
		
		
		// sendmail
		transport.sendMail(mailOptions, (error, info) => {
			if (error) {
				return console.error(error);
			}
			console.log('message sent: %s', info.messageId);
			shooting = false;
			console.log( "Watching" );
		})
	});
}

console.log('Rodocam running');
console.log( "Watching" );
 
function exit() {
  pir.unexport();
  process.exit();
}