const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = new Map();

io.on('connection', (socket) => {

  const currentDate = new Date();

  const dateString = currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" + currentDate.getFullYear() + " | " + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
  
  console.log('Un utente si è connesso ' + dateString);

  socket.on('create-room', (initialContent) => {

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    const roomId = generateRoomCode();
    removeRoomsByHost(socket.id);

    rooms.set(roomId, { id: roomId, editorContent: initialContent, host: socket.id });
    socket.emit('room-created', { id: roomId, editorContent: initialContent });
    socket.join(roomId);

  }); 

  socket.on('join-room', (roomId) => {
    if (rooms.has(roomId)) {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      socket.join(roomId);
      const room = rooms.get(roomId);
      socket.emit('room-joined', room);

      const hostSocket = io.sockets.sockets.get(room.host);
      if (hostSocket) {
        hostSocket.emit('guest-joined', socket.id);
      }
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on('leave-room', (roomId) => {
    if (rooms.has(roomId)) {
      socket.leave(roomId);
    }
  });  

  socket.on('code-update', (data) => {
    const { roomId, code, senderId } = data;
    if (rooms.has(roomId)) {
      // console.log("Clients in room: " +  io.sockets.adapter.rooms.get(roomId).size)
      rooms.get(roomId).editorContent = code;
      io.to(roomId).emit('code-update', { code, senderId });
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on('fake-cursor', (data) => {
    if (rooms.has(data.roomId)) {
      io.to(data.roomId).emit('fake-cursor', data); 
    }
  });

  socket.on('remove-fake-cursor', () => {
    if (rooms.has(data.roomId)) {
      io.to(data.roomId).emit('remove-fake-cursor', socket.id);
    }
  });

  socket.on('disconnect', () => {

    const currentDate = new Date();

    const dateString = currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" + currentDate.getFullYear() + " | " + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
    
    console.log('Un utente si è disconnesso ' + dateString);
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    const roomId = findRoomByHost(socket.id);
    if (roomId) {
      rooms.delete(roomId);
      console.log(`Stanza ${roomId} eliminata perché l'host si è disconnesso.`);
    }

    io.to(roomId).emit('remove-fake-cursor', socket.id);
  });


  function findRoomByHost(hostId) {
    for (const [roomId, room] of rooms.entries()) {
      if (room.host === hostId) {
        return roomId;
      }
    }
    return null;
  }

  function removeRoomsByHost(hostId) {
    for (const [roomId, room] of rooms.entries()) {
      if (room.host === hostId) {
        rooms.delete(roomId);
        console.log(`Stanza ${roomId} eliminata perché l'host ne ha creata una nuova.`);
      }
    }
  }
});

server.listen(80, () => {
  console.log('Server intermedio avviato su http://localhost:80');
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8);
}
