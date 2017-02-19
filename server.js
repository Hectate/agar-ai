/* CONFIG START */

var TURNS = 300;
var PLAYERS = 2;

/* CONFIG END */

var WIDTH = 80;
var HEIGHT = 60;

var TOTAL = WIDTH * HEIGHT;
var FRUIT = parseInt(TOTAL * 0.5);

var map = new Uint32Array(TOTAL);

var total_score = FRUIT;

for(let i = 0; i != FRUIT; i++) {
   map[parseInt(Math.random()*TOTAL)]++;
}

var WebSocket = require('ws');

var wss = new WebSocket.Server({
   host: '0.0.0.0',
   port: 4500
});

wss.broadcast = function broadcast(data) {
   wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
            client.send(data);
         }
   });
};

var players = {};
var initial_positions = new Uint8Array(TOTAL);

var online = 0;

var playing = false;

var turns = 0;

wss.on('connection', function(ws) {
   
   if(playing) {
      console.log('[DEBUG] Rejected new connection');
      ws.close();
      return;
   }
      
   var first = true;
   var player;
   var closed = false;
   
   ws.on('message', function(data) {
      if(first) {
         first = false;
         online++;
         
         player = {
            id: data,
            index: null,
            score: 0,
            direction: 0,
            ready: false,
            ws: ws
         };
         
         while(true) {
            player.index = parseInt(Math.random() * TOTAL);
            
            if(initial_positions[player.index] == 0) {
               initial_positions[player.index] = 1;
               break;
            }
         }
         
         players[data] = player;
         
         console.log('[LOGIN] Registered player %s', data);
         
         if(online == PLAYERS) {
            playing = true;
            announce();
            console.log("[INFO] Starting!");
         }
      } else {   
         var vector;

         switch(data) {
            case 'left':
               vector = -1;
               break;
            case 'right':
               vector = 1;
               break;
            case 'up':
               vector = -WIDTH;
               break;
            case 'down':
               vector = WIDTH;
               break;
            case 'stay':
               vector = 0;
               break;
            default:
               console.log('[DEBUG] Closing %s (1)', player.id);
               ws.close();
               break;
         }

         player.ready = true;
         player.direction = vector;

         let ready = true;
         let readies = 0;

         for(let id in players) {
            if(!players.hasOwnProperty(id)) continue;
            let player = players[id];
            
            if(!player.ready) {
               ready = false;
            } else readies++;
         }
         
         console.log('[DEBUG] %s -> %s (%s/%s)', player.id, data, readies, online);

         if(ready) {
            tick();
         }

         ws.on('close', function() {
            if(closed) {
               return;
            }
            closed = true;
            console.log('[CLOSED] %s', player.id);
            online--;
            delete players[player.id];
            if(player.ready) {
               ready--;
            }
         });
      }         
   });
   
});

function tick() {
   var fruits_eaten = 0;
   
   for(let id in players) {
      if(!players.hasOwnProperty(id)) continue;
      var player = players[id];
      
      player.ready = false;
      
      var old_index = player.index;
      player.index += player.direction;
            
      if(player.index < 0 || player.index >= TOTAL || (Math.abs(player.direction) == 1 && parseInt(old_index / WIDTH) != parseInt(player.index / WIDTH))) {
         console.log('[DEBUG] Closing %s (2)', player.id);
         player.ws.close();
      }
      
      var score = map[player.index];
      
      player.score += score;
      
      fruits_eaten += score;
      map[player.index] = 0;
   }
   
   announce();
   
   turns++;
   
   console.log("[INFO] Turn %s/%s completed", turns, TURNS);
      
   if(turns == TURNS) {
      console.log("[INFO] Stopping! Total fruits: %s", total_score);
      total_score -= 1;
      for(let id in players) {
         if(!players.hasOwnProperty(id)) continue;
         let player = players[id];
         console.log("[SCORE] %s => %s (%s)", player.id, player.score, (player.score / TURNS).toFixed(2));
      }
      process.exit();
   }
}

function announce() {
   var player_array = new Array(TOTAL).fill(0);
   
   for(let id in players) {
      if(!players.hasOwnProperty(id)) continue;
      var player = players[id];
      player_array[player.index]++;
   }
   
   for(let id in players) {
      if(!players.hasOwnProperty(id)) continue;
      var player = players[id];
      
      if(player_array[player.index] > 1) {
         console.log('[COLLISION] %s', id);
         player.ws.close();
         continue;
      }
      
      player.ws.send(JSON.stringify({
         width: WIDTH,
         height: HEIGHT,
         values: map,
         players: player_array,
         x: player.index % WIDTH,
         y: parseInt(player.index / WIDTH),
         index: player.index
      }));
   }
}