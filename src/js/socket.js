import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

socket = io('https://895356f2-0d11-4489-a411-63738a47a0a7-00-2i8acontacch4.kirk.replit.dev/');//('https://magmaserver.everestkio.repl.co/'); 

userColor = getRandomColor();

const createRoomButton = document.getElementById('create-room');
const joinRoomButton = document.getElementById('join-room');

document.addEventListener('DOMContentLoaded', () => {
  // console.log(socket, 1);
  
  // if(!socket.connected && socket.disconnected) {
  //   createRoomButton.style.opacity = ".5";
  //   createRoomButton.disabled = true;
  //   createRoomButton.title = "Client or Server offline, connection failed, please try again later";
    
  //   joinRoomButton.style.opacity = ".5";
  //   joinRoomButton.disabled = true;
  //   joinRoomButton.title = "Client or Server offline, connection failed, please try again later";

  //   return;
  // }
  // console.log(socket, 2);

  createRoomButton.addEventListener('click', () => {
    let initialContent = '';
    if (editor !== null) {
      initialContent = editor.getValue();
    }

    if(currentRoom !== null) {
      socket.emit('leave-room', currentRoom);
    }

    socket.emit('create-room', initialContent);

  });

  joinRoomButton.addEventListener('click', () => {
    navigator.clipboard.readText().then((roomId) => {
      if (roomId) socket.emit('join-room', roomId);
    });
  });
});

socket.on('room-created', (room) => {
  currentRoom = room.id;
  alert('Room created. Code copied to clipboard.');

  document.getElementById('create-room').classList.add('hidden');
  document.getElementById('created-room').classList.remove('hidden');

  document.getElementById('room-code-create').innerHTML = `Code: ${currentRoom}`;
  
  navigator.clipboard.writeText(currentRoom);

  setTimeout(() => {
    document.getElementById('created-room').classList.add('hidden');
    document.getElementById('create-room').classList.remove('hidden');
  }, 10000);

  initializeEditor(room.editorContent);
});

socket.on('room-joined', (room) => {
  currentRoom = room.id;

  document.getElementById('join-room').classList.add('hidden');
  document.getElementById('joined-room').classList.remove('hidden');

  document.getElementById('room-code-join').innerHTML = `Code: ${currentRoom}`;
  
  navigator.clipboard.writeText(currentRoom);

  setTimeout(() => {
      document.getElementById('joined-room').classList.add('hidden');
      document.getElementById('join-room').classList.remove('hidden');
  }, 10000);

  initializeEditor(room.editorContent);
});

socket.on('room-not-found', () => {
  alert('Stanza non trovata.');
  currentRoom = null;
});

socket.on('code-update', (data) => {
  if (socket.id !== data.senderId) {
    const position = editor.getPosition();
    isUpdatingCode = true;
    editor.setValue(data.code);
    isUpdatingCode = false;
    editor.setPosition(position);
  }
});

socket.on('guest-joined', (guestSocketId) => {
  alert('Guest joined. Guest ID: ' + guestSocketId);
});

socket.on('fake-cursor', (data) => {
  if (data.senderId !== socket.id) {
    removeFakeCursors();
    addFakeCursor(data.senderId, data.position, data.color);
  }
});

socket.on('remove-fake-cursor', (userId) => {
  removeFakeCursors();
});

function addFakeCursor(userId, position, color) {
  if (editor) {

    removeFakeCursors();

    const decoration = {
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column), 
      options: { 
        className: 'fake-cursor', 
        hoverMessage: { value: 'User: ' + userId },
      }
    };

    currentFakeCursorsDecorations = editor.deltaDecorations(currentFakeCursorsDecorations, [decoration]);

  }
}

function removeFakeCursors() {
  editor.deltaDecorations(currentFakeCursorsDecorations, []);
  currentFakeCursorsDecorations = [];
}


function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


