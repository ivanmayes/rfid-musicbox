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

        socket.emit('message', {
            message: 'Welcome!'
        });

        broadcast('rfidModeChanged', configStore.get('rfidMode'));

        socket.on('setRFIDMode', function(mode) {
            if (mode  === 'get' || mode === 'set') {
                configStore.put('rfidMode', mode);
                broadcast('rfidModeChanged', mode);
            }
		});

        socket.on('saveRFIDObject', function(key, rfidObject) {
            console.log('Saving rfidObject:', rfidObject);
            rfidStore.put(key, rfidObject);
		});

        clients.push({
            id: socket.id
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