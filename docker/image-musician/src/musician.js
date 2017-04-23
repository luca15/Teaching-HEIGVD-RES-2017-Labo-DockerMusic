/**
 * This script allows create a musician with an instrument which is passed
 * in a parameter on the script.
 * The musician plays his instrument every 3 seconds which is represented by
 * sending a datagram UDP to a multicast address ip.
 * The contents of the datagram UDP is a JSON string with this structure :
 *
 * {"uuid" : Musician.uuid, "sound" : Musician.instrument.sound}.
 *
 *
 * author : Luca Sivillica
 * date   : 19.04.2017
 */


//------------------------------------------------------------------------------
// Declaration of functions and classes

/**
 * Class that represents an instrument
 */
function Instrument(name, sound) {
  this.name = name;
  this.sound = sound;
}

/**
 * Class that represents a musician
 */
function Musician(uuid, instrument) {
  this.uuid = uuid;
  this.instrument = instrument;
}

/**
 * Function UUID generator
 * source code from : https://gist.github.com/jcxplorer/823878
 */
function uuid() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

//------------------------------------------------------------------------------
// Loading extern modules

var schedule = require("node-schedule");
var dgram    = require("dgram");

//------------------------------------------------------------------------------
// Declaration of variables and constants

var socket   = dgram.createSocket("udp4");

var playload;   // string JSON sent by UDP
var message;    // buffer that contains the string JSON sent by UDP
var instrument; // the instrument of the musician
var argument;   // the argument that is passed on the script
var musician;   // the musician who plays an instrument

const Protocol = {
  PORT              : 7777,
  MULTICAST_ADDRESS : "239.255.22.5"
};

const INSTRUMENTS = ["piano", "trumpet", "flute", "violin", "drum"];

/* instruments sound */
var Sounds = {
  piano   : "ti-ta-ti",
  trumpet : "pouet",
  flute   : "trulu",
  violin  : "gzi-gzi",
  drum    : "boum-boum"
};

//------------------------------------------------------------------------------
// Main Script

/* if the argument wasn't given, we print an error and exit the program */
if (typeof process.argv[2] === "undefined") {
  console.log("Error: missing argument for instrument");
  return;
}

argument = process.argv[2].toLowerCase();

/* if the argument doesn't match with any instruments then we print an error
   and we exit the program, else we create the instrument */
if (~INSTRUMENTS.indexOf(argument)) {
  instrument = new Instrument(argument, Sounds[argument]);

} else {

  console.log("Error: instrument \"" + argument + "\" doesn't exist");
  return;
}

musician = new Musician(uuid(), instrument);

/* create the JSON string sent by datagram UDP */
playload = JSON.stringify({uuid : musician.uuid, sound : musician.instrument.sound});
message  = new Buffer(playload);

/* create a rule that must to be execute every 3 seconds */
var rule    = new schedule.RecurrenceRule();
rule.second = new schedule.Range(0, 59, 3);

/* we use this rule to send every 3 seconds a datagram UDP
   which contains the JSON string */
schedule.scheduleJob(rule, function() {
  socket.send(message, 0, message.length,	Protocol.PORT, Protocol.MULTICAST_ADDRESS);
});
