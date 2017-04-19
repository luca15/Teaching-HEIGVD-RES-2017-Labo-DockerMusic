/**
 * This script
 *
 * author : Luca Sivillica
 * date   : 19.04.2017
 */


//------------------------------------------------------------------------------
// Declaration of functions and classes

/**
 * class Instrument
 */
function Instrument(name, sound) {
  this.name = name;
  this.sound = sound;
}

/**
 * class Musician
 */
function Musician(uuid, instrument) {
  this.uuid = uuid;
  this.instrument = instrument;
}

/**
 * class Instrument
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
var socket   = dgram.createSocket("udp4");

//------------------------------------------------------------------------------
// Declaration of variables and constants

var playload;
var message;
var instrument;
var argument;
var musician;

const Protocol = {
  PORT              : 7777,
  MULTICAST_ADDRESS : "239.255.22.5"
};

const INSTRUMENTS = ["piano", "trumpet", "flute", "violin", "drum"];

var Sounds = {
  piano   : "ti-ta-ti",
  trumpet : "pouet",
  flute   : "trulu",
  violin  : "gzi-gzi",
  drum    : "boum-boum"
};

//------------------------------------------------------------------------------
// Main Script

/* if the argument wasn't given, we print an error and exit the programm */
if (typeof process.argv[2] === "undefined") {
  console.log("Error: missing argument for instrument");
  return;
}

argument = process.argv[2].toLowerCase();

/* if the argument doesn't match with any instruments */
if (~INSTRUMENTS.indexOf(argument)) {
  instrument = new Instrument(argument, Sounds[argument]);

} else {
  console.log("Error: instrument \"" + argument + "\" doesn't exist");
  return;
}

musician = new Musician(uuid(), instrument);

playload = JSON.stringify({uuid : musician.uuid, sound : musician.instrument.sound});
message = new Buffer(playload);

var rule = new schedule.RecurrenceRule();
rule.second = new schedule.Range(0, 59, 3);

schedule.scheduleJob(rule, function() {
  socket.send(message, 0, message.length,	Protocol.PORT, Protocol.MULTICAST_ADDRESS);
});
