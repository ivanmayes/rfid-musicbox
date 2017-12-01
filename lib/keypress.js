var Mopidy = require("mopidy");
var prompt = require('prompt');

module.exports = {
    listen: listen
};

function listen() {
    var trackDesc = function (track) {
        return track.name + " by " + track.artists[0].name +
            " from " + track.album.name;
    };
    
    var queueAndPlay = function (playlistNum, trackNum) {
        // playlistNum = playlistNum || 0;
        // trackNum = trackNum || 0;
        // mopidy.playlists.getPlaylists().then(function (playlists) {
        //     // console.log(playlists);
        //     return;

        //     var playlist = playlists[playlistNum];
        //     // console.log("Loading playlist:", playlist.name);
        //     return mopidy.tracklist.add(playlist.tracks).then(function (tlTracks) {
        //         return mopidy.playback.play(tlTracks[trackNum]).then(function () {
        //             return mopidy.playback.getCurrentTrack().then(function (track) {
        //                 console.log("Now playing:", trackDesc(track));
        //             });
        //         });
        //     });
        // })
        // .catch(console.error.bind(console)) // Handle errors here
        // .done();                            // ...or they'll be thrown here
        
        prompt.start();
        promptForRFID();
    };

    var promptForRFID = function() {
        prompt.get(['trackid'], function (err, result) {
            //
            // Log the results.
            //
            console.log('Command-line input received:');
            console.log('  trackId: ' + result.trackid);
            promptForRFID();
        });
    }
    
    var mopidy = new Mopidy({
        webSocketUrl: "ws://localhost:6680/mopidy/ws/"
    });             // Connect to server
    // mopidy.on(console.log.bind(console));  // Log all events
    mopidy.on("state:online", queueAndPlay);
    
}