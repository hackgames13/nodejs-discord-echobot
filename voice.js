const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 4000 });

let users = [];

function getUser(ws) {
  return users.find(user => user.ws === ws);
}

function getUsersInRoom(room) {
  return users.filter(user => user.room === room);
}

function lengthUsersInRoom(room) {
  return getUsersInRoom(room).length
}

function broadcastToRoom(ws, data) {
  const sender = getUser(ws);
  if (!sender) return;

  wss.clients.forEach(client => {
    const receiver = getUser(client);
    if (
      client !== ws &&
      client.readyState === WebSocket.OPEN &&
      receiver &&
      receiver.room === sender.room
    ) {
      client.send(data);
    }
  });
}


wss.on("connection", function connection(ws) {
  users.push({ ws: ws, room: "none" });

  ws.on("message", function incoming(data) {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      // Jeśli nie jest JSON-em – traktuj jako broadcast
      return broadcastToRoom(ws, data);
    }

    const user = getUser(ws);
    if (!user) return;

    if (msg.cmd === "set" && msg.room) {
      user.token = msg.token;
      user.room = msg.room;
    } else if (msg.cmd === "players_count") {
      ws.send(JSON.stringify({
        cmd: "players_count",
        val: lengthUsersInRoom(user.room)
      }));
    }
  });


  ws.on("close", function () {
    users = users.filter(user => user.ws !== ws);
  });
});
