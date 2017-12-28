var Mopidy = require("mopidy");
var prompt = require('prompt');
// const say = require('say');
const utils = require('./utils');
const _ = require('lodash');

module.exports = {
    listen: listen
};

let rfidStore;
let configStore;
let currentRFID;
let processing = false;


function listen(sv, store) {

    rfidStore = store.rfidStore;
    configStore = store.configStore;

    // TESTING ONLY:  Insert some values into the db
    var obj = {
        shuffle: true,
        tracks: [{
            id: 'PL8KQXy_mAmdfKIuWqiFHe-kFo_OKlNaaB',
            type: 'youtube-playlist',
        }]
    };
    rfidStore.put('1', obj);

    obj = {
        tracks: [{
            id: 'tLPZmPaHme0',
            name: 'The Creep',
            type: 'youtube-video'
        }]
    };
    rfidStore.put('2', obj);

    obj = {
        tracks: [{
            id: '57241857',
            name: 'Bon Iver - Holocene (NiT GriT Remix)',
            type: 'soundcloud-song'
        }]
    };
    rfidStore.put('3', obj);

    rfidStore.put('4', {
        tracks: [{
            id: 'JtH68PJIQLE',
            name: 'Grimes - Oblivion',
            type: 'youtube-video'
        }, {
            id: '0WyqHfJOj-I',
            name: 'Tuxedo - Tiny Desk Concerts',
            type: 'youtube-video'
        }]
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
                    return promptForRFID();
                }
            }

            // Send the client the RFID number and object if in 'set' mode
            if (configStore.get('rfidMode') === 'set') {
                broadcast('rfidFound', {
                    id: result.rfid,
                    payload: rfidObject
                });
                return promptForRFID();
            }

            // Prevent double scans
            if (result.rfid === currentRFID) {
                console.warn('This RFID is already the current one playing.');
                return promptForRFID();
            } else {
                currentRFID = result.rfid;
            }

            // Check if we're still processing a card
            if (processing) {
                console.warn('Canceled scan because were still processing the last card');
                return promptForRFID();
            }
            
            let uris = rfidObject.tracks.map(obj => {
                return utils.rfidToURI(obj);
            });
            if (!uris || uris.length < 1) {
                return promptForRFID();
            }

            let shuffle = rfidObject.shuffle || false;
            if (shuffle) {
                uris = _.shuffle(uris);
            }

            console.log('Rebuilding playlist', uris);
            processing = result.rfid;
                // say.speak("Adding playlist", 'Samantha');

                mopidy.tracklist.clear().then(function(data) {
                    
                    // Just add the first track to make things load
                    // more quickly.  Wrap in array.
                    addTracksToPlaylist([uris[0]])
                        .then((tracks) => {
                            console.log('First Track', tracks[0]);
                            return mopidy.playback.play(tracks[0])
                        })
                        .then(function(data) {
                            // Get rid of the first track, then add the rest in
                            uris.shift();
                            if (uris.length > 0) {
                                return addTracksToPlaylist(uris);
                            }

                            return false;
                        })
                        .then((tracks) => {
                            if (tracks) {
                                console.log('Remaining ' + uris.length + ' tracks added');
                            } else {
                                console.log('No more tracks to add');
                            }
                            
                            promptForRFID();

                            // Set a debounce for adding a new card
                            setTimeout(() => processing = false, 3000);
                        });
                });
            
        });
    }

    /**
     * Add track uris to a Mopidy playlist
     * @param {*} uris 
     */
    function addTracksToPlaylist(uris) {
        return mopidy.tracklist.add(undefined, 0, undefined, uris);
    }

    // Send data to clients
    function broadcast(action, body) {
        console.log('Sending data to sockets:', action, body);

        sv.emit(action, body);
    }

    var onMopidyConnect = function (playlistNum, trackNum) {
        console.log('Mopidy Connected to RFID App');
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