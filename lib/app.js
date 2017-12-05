var Mopidy = require("mopidy");
var prompt = require('prompt');
const decoder = require('lame').Decoder;
const Speaker = require('speaker');
const speaker = new Speaker({
    channels: 2,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 44100     // 44,100 Hz sample rate
  });
const play = require('audio-play');
const say = require('say');
const utils = require('./utils');

const Storage = require('node-storage');
const rfidStore = new Storage('./rfid');
const configStore = new Storage('./config');

// TESTING ONLY:  Insert some values into the db
var obj = {
    id: 'PL8KQXy_mAmdfKIuWqiFHe-kFo_OKlNaaB',
    type: 'youtube-playlist',
    shuffle: false
};
rfidStore.put('16414673', obj);
rfidStore.put('1', obj);

obj = {
    id: 'Hahih60pvA4',
    name: 'Bon Iver',
    type: 'youtube-video'
};
rfidStore.put('16319465', obj);
rfidStore.put('2', obj);

rfidStore.put('11517595', {
    id: 'PLvuMfxvpAQrkzez9insKS8cGPU74sK1Ss',
    type: 'youtube-playlist'
});
rfidStore.put('16319539', {
    id: '0WyqHfJOj-I',
    name: 'Tuxedo - Tiny Desk Concerts',
    type: 'youtube-video'
});

// Reset config options
configStore.put('rfidMode', 'get');

module.exports = {
    listen: listen
};

function listen() {

    var queueAndPlay = function (playlistNum, trackNum) {        
        prompt.start();
        promptForRFID();
    };

    var promptForRFID = function() {
        prompt.get(['rfid'], function (err, result) {
            //
            // Log the results.
            //
            console.log('Command-line input received: ' + result.rfid);
            let rfidObject = rfidStore.get(result.rfid);
            if (!rfidObject) {
                console.warn('Couldnt find an associated RFID Object', result.rfid);
                promptForRFID();
                return false;
            }

            let uri = utils.rfidToURI(rfidObject);
            if (!uri) {
                promptForRFID();
                return false;
            }

            let shuffle = rfidObject.shuffle || false;

            mopidy.playback.stop().then(function(data) {
                console.log('Rebuilding playlist', uri);
                say.speak("Adding playlist", 'Samantha');

                mopidy.tracklist.clear().then(function(data) {
                    mopidy.tracklist.add(undefined, undefined, uri).then(function(data) {
                        // mopidy.tracklist.setRandom(shuffle).then(function(data){
                            
                        // });
                        mopidy.playback.play().then(function(data) {
                            console.log('Playing first song');
                            promptForRFID();
                        });
                    })
                });

            });
            
        });
    }
    
    var mopidy = new Mopidy({
        webSocketUrl: "ws://localhost:6680/mopidy/ws/"
    });             // Connect to server
    // mopidy.on(console.log.bind(console));  // Log all events
    mopidy.on("state:online", queueAndPlay);
}