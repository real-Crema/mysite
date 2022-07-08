const { makeId, allotColor } = require ('./utils');

const { Server } = require('socket.io');

const io = new Server({
  cors: {
    origin: "https://crema.evalieben.cn:4602",
    credentials: true,
  }
});

const state = {};  // {roomId: {host: id, players: {id: color, ...}}, ...}

io.on('connection', client => {
    client.on('create-room', createRoom);
    client.on('join-room', handleJoinRoom);
    client.on('change-color', updatePlayerColor);
    client.on('client-leave', handleClientLeave);
    client.on('start-game', startGame);
    client.on('new-piece', updateGameState);

    function createRoom(color) {
        const roomId = makeId(state);
        const room = state[roomId] = {host: client.id, players: {}};
        room.players[client.id] = color;
        client.roomId = roomId;
        client.join(roomId);
        client.emit('room-id', roomId, client.id);
    }

    async function handleJoinRoom(roomId) {
        let playerColor;

        try {
            playerColor = state[client.roomId].players[client.id];
        } catch (e) {
            client.emit('joining-room-failed');
            return;
        }

        const room = state[roomId];
        const clients = await io.in(roomId).fetchSockets();
        const numClients = clients.length;

        if (numClients === 0) {
            client.emit('invalid-code');
            return;
        } else if (numClients >= 4) {
            client.emit('room-is-full');
            return;
        } else if (clients.includes(client)) {
            client.emit('invalid-code');
            return;
        }

        if (Object.values(room.players).includes(playerColor)) {
            room.players[client.id] = allotColor(room.players);  // 如果玩家的颜色和房间内其他玩家的颜色重复，则重新分配一个颜色。
        } else {
            room.players[client.id] = playerColor;
        }

        // 玩家先离开之前自己的房间，然后加入新的房间。
        delete state[client.roomId];
        client.leave(client.roomId);

        client.roomId = roomId;
        client.join(roomId);

        client.emit('client-standby');
        io.to(room.host).emit('host-standby', Object.keys(room.players).length - 1);
        io.to(roomId).emit('update-players-info', room.players);
    }

    function updatePlayerColor(color) {
        const room = state[client.roomId];
        room.players[client.id] = color;
        io.to(client.roomId).emit('update-players-info', room.players);
    }

    function handleClientLeave() {
        const color = state[client.roomId].players[client.id];
        client.leave(client.roomId);
        createRoom(color);
    }

    function startGame() {
        io.to(client.roomId).emit('initialize-game');
    }

    function updateGameState(newPiece) {
        io.to(client.roomId).emit('update', newPiece);
    }
});

io.of('/').adapter.on('leave-room', (roomId, clientId) => {
    const room = state[roomId];
    if (!room) return;

    if (clientId === room.host) {
        delete state[roomId];
    } else {
        delete room.players[clientId];
        io.to(room.host).emit('host-standby', Object.keys(room.players).length - 1);
        io.to(roomId).emit('update-players-info', room.players);
    }
});

io.listen(4605);
