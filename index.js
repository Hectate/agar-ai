var WebSocket = require('ws');

var ws = new WebSocket('ws://localhost:4500/');
//var ws = new WebSocket('ws://94.193.167.54:5000');

ws.onopen = function() {
   ws.send('HECTATE');
};
var frame = 0;

function think(map_json) {
    console.log("processing turn:" + frame);
    frame += 1;
   var data = JSON.parse(map_json.data);
   var map = data.values; // [0,0,1,2,6,0,...]
   var width = data.width; // Map width
   var height = data.height; // Map height
   var players = data.players; // [0,0,1,0,0,0,...]
   var x = data.x; // Your X coordinate on the map
   var y = data.y; // Your Y coordinate on the map
   var index = data.index; // Your index in the players array (and map array too)
   //var dir = ['left','right','up','down','stay'][parseInt(Math.random()*4)];
   //if(dir == 'left' && x-1 < 0) { ws.send('stay');}
   //else if (dir == 'right' && x+1 >= width) {ws.send('stay');}
   //else if (dir == 'up' && y-1 < 0 ) {ws.send('stay');}
   //else if (dir == 'down' && y+1 >= height) {ws.send('stay');}
   //else{ws.send(dir);}
   ws.send("left");
}

ws.onmessage = think;

ws.onclose = process.exit;