/**
 * This script allows create an auditor.
 * The auditor listens to musicians that play instruments, he listens to
 * musicians by using the protocol UDP by joining a multicast group.
 * The auditor considers that if a musician didn't play since 5 seconds,
 * he's dead.
 * The auditor can be joined by TCP and he just retruns a JSON array that
 * contains all the musicians that are alive.
 * An example of the contents of the JSON array is :
 * [
 *  {
 *	 "uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
 *	 "instrument" : "piano",
 *	 "activeSince" : "2016-04-27T05:20:50.731Z"
 *  },
 *  {
 *	 "uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
 *	 "instrument" : "flute",
 *	 "activeSince" : "2016-04-27T05:39:03.211Z"
 *  }
 * ]
 *
 *
 * author : Luca Sivillica
 * date   : 19.04.2017
 */

//------------------------------------------------------------------------------
// Loading extern modules

var schedule = require("node-schedule");
var moment   = require("moment");
var	dgram	   = require("dgram");
var net      = require("net");

//------------------------------------------------------------------------------
// Declaration of variables and constants

var	socketUDP	=	dgram.createSocket("udp4");
var socketTCP;
var auditor;   // the auditor who listens to musicians

var soundInstruments = new Map([
  ["ti-ta-ti" , "piano"],
  ["pouet"    , "trumpet"],
  ["trulu"    , "flute"],
  ["gzi-gzi"  , "violin"],
  ["boum-boum", "drum"]
]);

const ProtocolUDP = {
  PORT              : 7777,
  MULTICAST_ADDRESS : "239.255.22.5"
};

const ProtocolTCP = {
  PORT : 2205
};

//------------------------------------------------------------------------------
// Declaration of classes

/**
 * Class that represents a musician
 */
function Musician(uuid, instrument, activeSince) {
  this.uuid = uuid;
  this.instrument = instrument;
  this.activeSince = activeSince;
}

/**
 * Class that represents an auditor
 */
 function Auditor() {

   var listMusicians = new Map(); // list of musicians alive

   /**
    * This function allows to add a musician in the list.
    */
   this.addMusician = function(musician) {
     listMusicians.set(musician.uuid, musician);
   }

   /**
    * This function allows to remove a musician from the list.
    */
   var removeMusician = function(musician) {
     listMusicians.delete(musician.uuid);
   }

   /**
    * This function checks if a musician is active.
    * A musician is active if he has played a sound during the last 5 seconds.
    */
   var isMusicianActive = function(musician) {
     var musicianObject = listMusicians.get(musician.uuid);

     /* if the musician is in the list, we check if he's active */
     if (typeof musicianObject !== "undefined") {
       return Date.now() - musicianObject.activeSince <= 5000; // time in ms
     }

     return false;
   }

   /**
    * This function remove all the unactive musicians.
    */
   this.removeUnactiveMusicians = function() {
     for (var musician of listMusicians.values()) {
       if (!isMusicianActive(musician)) {
         removeMusician(musician);
       }
     }
   }

   /**
    * This function returns an array with all the musicians in the list.
    */
   this.getArrayMusicians = function() {
     var arrayMusician = [];

     for (var musician of listMusicians.values()) {
       musician.activeSince = moment(musician.activeSince); // Formate time

       arrayMusician.push(musician);
     }

     return arrayMusician;
   }
 }

//------------------------------------------------------------------------------
// Main Script

auditor = new Auditor();

/* create the socket UDP and join the multicast group */
socketUDP.bind(ProtocolUDP.PORT,	function() {
  socketUDP.addMembership(ProtocolUDP.MULTICAST_ADDRESS);
});

/* when a new datagram has arrived, we add the musician in the auditor */
socketUDP.on("message",	function(msg,	source)	{
  var musicianFromUDP = JSON.parse(msg.toString());

  var musician = new Musician(musicianFromUDP.uuid,
                              soundInstruments.get(musicianFromUDP.sound),
                              Date.now());

  auditor.addMusician(musician);
});

/* create the server TCP and when a segment TCP has arrived, he send to the
   the client an array of all the musicians alive */
socketTCP = net.createServer(function(socket) {
  socket.write(JSON.stringify(auditor.getArrayMusicians()));
  socket.end();
});

socketTCP.listen(ProtocolTCP.PORT);

/* create a rule that must to be execute every 3 seconds */
var rule    = new schedule.RecurrenceRule();
rule.second = new schedule.Range(0, 59, 3);

/* we use this rule to remove every 3 seconds the unactive
   musicians from the auditor */
schedule.scheduleJob(rule, auditor.removeUnactiveMusicians);
