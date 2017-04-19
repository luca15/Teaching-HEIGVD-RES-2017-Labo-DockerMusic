/**
 * This script
 *
 * author : Luca Sivillica
 * date   : 19.04.2017
 */


var schedule = require("node-schedule");
var moment = require("moment");
var	dgram	=	require("dgram");
var net = require("net");
var	socketUDP	=	dgram.createSocket("udp4");
var socketTCP;

var soundInstruments = new Map([
  ["ti-ta-ti" , "piano"],
  ["pouet"    , "trumpet"],
  ["trulu"    , "flute"],
  ["gzi-gzi"  , "violin"],
  ["boum-boum", "drum"]
]);

//------------------------------------------------------------------------------
// Declaration of functions and classes

/**
 * class Musician
 */
function Musician(uuid, instrument, activeSince) {
  this.uuid = uuid;
  this.instrument = instrument;
  this.activeSince = activeSince;
}

/**
 * class Auditor
 */
 function Auditor() {
   var listMusicians = new Map();

   this.addMusician = function(musician) {
     var musicianObject = new Musician(musician.uuid,
                                       soundInstruments.get(musician.sound),
                                       Date.now());

     listMusicians.set(musician.uuid, musicianObject);
   }

   var removeMusician = function(musician) {
     listMusicians.delete(musician.uuid);
   }

   var isMusicianActive = function(musician) {
     var musicianObject = listMusicians.get(musician.uuid);

     if (typeof musicianObject !== "undefined") {
       return Date.now() - musicianObject.activeSince <= 5000;
     }

     return false;
   }

   this.removeUnactiveMusician = function() {
     for (var musician of listMusicians.values()) {
       if (!isMusicianActive(musician)) {
         removeMusician(musician);
       }
     }
   }

   this.getArrayMusician = function() {
     var arrayMusician = [];

     for (var musician of listMusicians.values()) {
       musician.activeSince = moment(musician.activeSince);

       arrayMusician.push(musician);
     }

     return arrayMusician;
   }
 }

const Protocol = {
   PORT              : 7777,
   MULTICAST_ADDRESS : "239.255.22.5"
 };

var auditor = new Auditor();

socketUDP.bind(Protocol.PORT,	function() {
  socketUDP.addMembership(Protocol.MULTICAST_ADDRESS);
});

//	This	call	back	is	invoked	when	a	new	datagram	has	arrived.
socketUDP.on("message",	function(msg,	source)	{
  auditor.addMusician(JSON.parse(msg.toString()));
});

socketTCP = net.createServer(function(socket) {
  socket.write(JSON.stringify(auditor.getArrayMusician()));
  socket.end();
});

socketTCP.listen(2205);

var rule = new schedule.RecurrenceRule();
rule.second = new schedule.Range(0, 59, 6);

schedule.scheduleJob(rule, auditor.removeUnactiveMusician);
