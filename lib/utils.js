module.exports = {
    rfidToURI: rfidToURI
};

function rfidToURI(rfidObj) {
    if (!rfidObj) {
        console.warn('No RFID Object Provided');
        return undefined;
    }

    switch(rfidObj.type) {
        case 'soundcloud-song':
            return 'soundcloud:song/' + rfidObj.title + '.' + rfidObj.id;
        break;

        case 'youtube-video':
            return 'youtube:video/' + rfidObj.title + '.' + rfidObj.id;
        break;

        case 'youtube-playlist':
            return 'youtube:https://www.youtube.com/playlist?list=' + rfidObj.id;
        break;

        default:
            console.warn('Couldnt find a type for this RFID Object');
            return undefined;
        break;
    }
}