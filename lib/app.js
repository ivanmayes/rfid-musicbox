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

module.exports = {
    listen: listen
};

let rfidStore;
let configStore;


function listen(sv, store) {

    rfidStore = store.rfidStore;
    configStore = store.configStore;

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

    obj = {
        id: '57241857',
        name: 'Bon Iver - Holocene (NiT GriT Remix)',
        type: 'soundcloud-song'
    };
    rfidStore.put('11517595', obj);
    rfidStore.put('3', obj);

    rfidStore.put('16319539', {
        id: '0WyqHfJOj-I',
        name: 'Tuxedo - Tiny Desk Concerts',
        type: 'youtube-video'
    });

    // Reset config options
    configStore.put('rfidMode', 'get');
    
    
    var promptForRFID = function() {
        prompt.get(['rfid'], function (err, result) {
            //
            // Log the results.
            //
            console.log('Command-line input received: ' + result.rfid);
            let mode = configStore.get('rfidMode');
            console.log('Mode: ', mode);
            
            // Try to retrieve
            let rfidObject = rfidStore.get(result.rfid);
            if (!rfidObject) {
                console.warn('Couldnt find an associated RFID Object', result.rfid);

                // We're done if we're in 'get mode
                if (configStore.get('rfidMode') === 'get') {
                    promptForRFID();
                    return false;
                }
            }

            // Send the client the RFID number and object if in 'set' mode
            if (configStore.get('rfidMode') === 'set') {
                broadcast('rfidFound', {
                    id: result.rfid,
                    payload: rfidObject
                });
                promptForRFID();
                return false;
            }

            let uri = utils.rfidToURI(rfidObject);
            if (!uri) {
                promptForRFID();
                return false;
            }

            let shuffle = rfidObject.shuffle || false;

            // mopidy.playback.stop().then(function(data) {
                console.log('Rebuilding playlist', uri);
                say.speak("Adding playlist", 'Samantha');

                mopidy.tracklist.clear().then(function(data) {
                    mopidy.tracklist.add(undefined, 0, uri).then(function(tracks) {
                        console.log('First Track', tracks[0]);
                        mopidy.tracklist.setRandom(shuffle).then(function(data){
                            mopidy.playback.play(tracks[0]).then(function(data) {
                                
                                    // var printCurrentTrack = function (track) {
                                    //     if (track) {
                                    //         console.log("Currently playing:", track);
                                    //     } else {
                                    //         console.log("No current track");
                                    //     }
                                    // };

                                    // mopidy.playback.getCurrentTrack()
                                    // .done(printCurrentTrack);
                                
                                promptForRFID();
                            });
                        });
                    })
                });

            // });
            
        });
    }

    // Send data to clients
    function broadcast(action, body) {
        console.log('Sending data to sockets:', action, body);

        sv.emit(action, body);
    }

    var onMopidyConnect = function (playlistNum, trackNum) {        
        prompt.start();
        promptForRFID();

        // DEBUG
        // setInterval(function() {
        //     mopidy.tracklist.getTracks()
        //         .then((tracks) => {
        //             tracks.map((t) => {
        //                 console.log(t.name);
        //             });
        //         });
        // }, 10000);
    };
    
    var mopidy = new Mopidy({
        webSocketUrl: "ws://localhost:6680/mopidy/ws/"
    });             // Connect to server
    // mopidy.on(console.log.bind(console));  // Log all events
    mopidy.on("state:online", onMopidyConnect);
}