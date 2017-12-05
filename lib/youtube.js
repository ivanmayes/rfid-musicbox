var ytdl = require('ytdl-core')
var FFmpeg = require('fluent-ffmpeg')
var through = require('through2')
var xtend = require('xtend')
var fs = require('fs');
const decoder = require('lame').Decoder;
const Speaker = require('speaker');
const speaker = new Speaker({
    channels: 2,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 44100     // 44,100 Hz sample rate
  });

/**
 * Plays youtube videos via command line using ytdl and ffmpeg
 */

module.exports = streamify;

var streams = [];
var ffmpeg;

function streamify (uri, opt) {

    if (streams.length > 0) {
        try {
            ffmpeg.kill('SIGSTOP');
            ffmpeg.renice(5);

            setTimeout(() => {
                return playStream(uri, opt);
            }, 3000);

        } catch(e) {
            console.log('Couldnt end stream', e);
        }
    } else {
        return playStream(uri, opt);
    }
  
}

function playStream(uri, opt) {
    opt = xtend({
        videoFormat: 'mp4',
        quality: 'lowest',
        audioFormat: 'mp3',
        applyOptions: function () {}
    }, opt)

    var video = ytdl(uri, {filter: filterVideo, quality: opt.quality})

    function filterVideo (format) {
        return (
            format.container === opt.videoFormat &&
            format.audioEncoding
        )
    }

    ffmpeg = new FFmpeg(video);
    opt.applyOptions(ffmpeg);

    var stream = ffmpeg
        .format(opt.audioFormat)
        .pipe(decoder())
        .pipe(speaker);

    streams.push(stream);

    return stream;
}