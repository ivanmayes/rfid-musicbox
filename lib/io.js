const Storage = require('node-storage');
const rfidStore = new Storage('./rfid');
const configStore = new Storage('./config');
const mopidyApp = require('./app');


module.exports = function(io, app, server) {
    let publicMethods = {
        broadcast: broadcast
    };

    let clients = [];

    let sv = io.listen(server);
    console.log('Socket listening');

    mopidyApp.listen(sv, {
        rfidStore: rfidStore,
        configStore: configStore
    });

    sv.on('connection', (socket) => {
        console.log('Client has connected: ' + socket.id);

        socket.emit('connected', {
            id: socket.id
        });
        broadcast('rfidModeChanged', configStore.get('rfidMode'));

        clients.push({
            id: socket.id
        });

        /**
         * Listen for events from client
         */
        socket.on('setRFIDMode', function(mode) {
            if (mode  === 'get' || mode === 'set') {
                configStore.put('rfidMode', mode);
                broadcast('rfidModeChanged', mode);
            }
		});

        socket.on('saveRFIDData', function(rfidData) {
            console.log('Saving rfidData:', rfidData);
            rfidStore.put(rfidData.id, rfidData.payload);
            broadcast('saveRFIDDataSuccess', {});
        });
    
    });

    // Send data to clients
    function broadcast(action, body) {
        console.log('Sending data to sockets:', action, body);

        sv.emit(action, body);
    }

    // Push public methods to app wrapper.
    app.socket = publicMethods;

    return publicMethods;
};