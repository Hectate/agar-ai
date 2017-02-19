var WebSocket = require('ws');
var Jimp = require('jimp');

var ws = new WebSocket('ws://localhost:4500/');
//var ws = new WebSocket('ws://ip:4500/');

ws.onopen = function() {
   ws.send('HECTATE-VIZ');
};
var LEFT = 'left';
var RIGHT = 'right';
var UP = 'up';
var DOWN = 'down';
var STAY = 'stay';
var RED = 0xFF0000FF;
var GRN = 0x00FF00FF;
var BLU = 0x0000FFFF;
var WHT = 0xFFFFFFFF;
var BLK = 0x000000FF;
var YEL = 0xFFFF00FF;
var frame = 0;
var width, height, map, players, x, y;
var floodSum = 0;
var flood = [];
var choices = [];
var maxRange = 1000;

function think(map_json) {
    choices = []; //empty choices at the beginning?
    frame += 1;
   var data = JSON.parse(map_json.data);
   map = data.values; // [0,0,1,2,6,0,...]
   flood = Object.assign({},map); //clone it for the flood fill
   width = data.width; // Map width
   height = data.height; // Map height
   players = data.players; // [0,0,1,0,0,0,...]
   x = data.x; // Your X coordinate on the map
   y = data.y; // Your Y coordinate on the map
   var index = data.index; // Your index in the players array (and map array too)
   players[index] = 0; //take ourselves out for other checks...
   
   var image = new Jimp(width, height,0x000000FF, function(err, image) {
    image.rgba(false);
    for(i in map) {
        var val;
        if(map[i] > 0) {
            val = Jimp.rgbaToInt(0, limit( map[i]*32, 255), 0, 255);
        }
        else { val = BLK; }
        var py = Math.floor(i / width);
        var px = i % width;
        image.setPixelColor(val, px, py);
    }
    image.setPixelColor(RED, x, y);
    greedyLook(x,y,1); //this should fill 'choices' with an array of food options.
    let bestVal = 0;
    var bestTarget = {x:x,y:y};
    var aleph = "abcdefghijklmnopqrstuvwxyz";
    var alephIndex = 0;
    var bestIndex;
    for(c in choices) {
        if(getCellValue(choices[c].x,choices[c].y,flood) == aleph[alephIndex]) {continue;}
        else {
            //floodPotential(choices[c].x,choices[c].y,aleph[alephIndex]);
            floodQueue(choices[c].x,choices[c].y,aleph[alephIndex]);
            if(floodSum > bestVal) {
                bestTarget.x = choices[c].x;
                bestTarget.y = choices[c].y;
                bestVal = floodSum;
                floodSum = 0;
                bestIndex = aleph[alephIndex];
                alephIndex++; if(alephIndex >= aleph.length) { alephIndex = 0; }
            }
        }
        image.setPixelColor(YEL, choices[c].x,choices[c].y);
    }
    //just in case, random target if we have nothing
    if(choices.length == 0) { bestTarget = {x:parseInt(Math.random()*width),y:parseInt(Math.random()*height)} }
    var move = decideMove(bestTarget);
    if(move != STAY) { 
        //image.setPixelColor(BLU, bestTarget.x, bestTarget.y);
        recolorBestFlood(image,bestIndex);
    }
    for(i in players) {
        if(players[i] == 1) {
            var py = Math.floor(i / width);
            var px = i % width;
            image.setPixelColor(WHT, px, py );
        }
    }
    image.resize(width*4, height*4, Jimp.RESIZE_NEAREST_NEIGHBOR);
    var frameNum = ('0000'+frame).slice(-4);
    image.write(__dirname + '/images/agar' + frameNum + '.png', function(err, res) {
        if(err) {console.error(err); }
        ws.send(move);
    });
   });
}

ws.onmessage = think;

ws.onclose = process.exit;

function recolorBestFlood(img, id) {
    for(i in flood) {
        if(flood[i] == id) {
            var val = Jimp.rgbaToInt(0, 0, limit( map[i]*32, 255), 255);
            var py = Math.floor(i / width);
            var px = i % width;
            img.setPixelColor(val, px, py );
        }
    }
    return;
}
function decideMove(target) {
    var text = STAY;
    var dx, dy;
    if(x < target.x && y < target.y) { //below and to the right
        if(!isThreatCell(x+1,y)) { text = RIGHT; }
        else if(!isThreatCell(x,y+1)) { text = DOWN; }
        else {
            text = [LEFT, UP][parseInt(Math.random()*2)];
            switch(text) {
                case LEFT: if(isThreatCell(x-1,y)) { text = UP; }
                case UP: if(isThreatCell(x,y-1)) { text = STAY; }
            }
        }
    }
    if(x > target.x && y > target.y) { //above and to the left
        if(!isThreatCell(x-1,y)) { text = LEFT; }
        else if(!isThreatCell(x,y-1)) { text = UP; }
        else {
            text = [RIGHT, DOWN][parseInt(Math.random()*2)];
            switch(text) {
                case RIGHT: if(isThreatCell(x+1,y)) { text = DOWN; }
                case DOWN: if(isThreatCell(x,y+1)) { text = STAY; }
            }
        }
    }
    if(x < target.x && y > target.y) { //above and to the right
        if(!isThreatCell(x+1,y)) { text = RIGHT; }
        else if(!isThreatCell(x,y-1)) { text = UP; }
        else {
            text = [LEFT, DOWN][parseInt(Math.random()*2)];
            switch(text) {
                case LEFT: if(isThreatCell(x-1,y)) { text = DOWN; }
                case DOWN: if(isThreatCell(x,y+1)) { text = STAY; }
            }
        }
    }
    if(x > target.x && y < target.y) { //below and to the left
        if(!isThreatCell(x-1,y)) { text = LEFT; }
        else if(!isThreatCell(x,y+1)) { text = DOWN; }
        else {
            text = [RIGHT, UP][parseInt(Math.random()*2)];
            switch(text) {
                case RIGHT: if(isThreatCell(x+1,y)) { text = UP; }
                case UP: if(isThreatCell(x,y-1)) { text = STAY; }
            }
        }
    }
    if(x == target.x) { //horizontally equal, move up or down
        if(y > target.y) { text = UP; }
        else { text = DOWN; }
    }
    if(y == target.y) { //vertically equal, move left or right
        if(x > target.x) { text = LEFT; }
        else { text = RIGHT; }
    }
    return text;
}

function limit(val, max) {
    if(val > max) {
        return max;
    }
    else return val;
}

function getCellValue(x,y,arr) {
    if(x >= width) { return null; }
    if(x < 0) { return null; }
    if(y >= height) { return null; }
    if(y < 0) { return null; }
    return arr[(y*width) + x];
}
function setCellValue(x,y,val,arr) {
    arr[(y*width) + x] = val;
    return;
}

//not implemented yet
function getSectorValues() {
    return;
}

function isThreatCell(x,y) {
    if(getCellValue(x-1,y,players) > 0) { return true; }
    else if(getCellValue(x+1,y,players) > 0) { return true; }
    else if(getCellValue(x,y-1,players) > 0) { return true; }
    else if(getCellValue(x,y+1,players) > 0) { return true; }
    else if(getCellValue(x,y,map) == null) { return true; } //for out of bounds
    else return false;
}

function greedyLook(x,y,r) { //check the von Neumann neighborhood for food
    if(r > maxRange) { return; }
    //check at range r, repeat at r+1 if nothing found up to max of 6
    var tx, ty;
    var quadrant = 0;
    for(var i=0; i < r*4; i++) { //we check r*4 cells at each stage of r
        //get some offsets based on which quadrant we're ready to loop inside at
        switch(quadrant) {
            case 0: tx = r; ty = 0; quadrant = 1; break;
            case 1: tx = 0; ty = r; quadrant = 2; break;
            case 2: tx = -r; ty = 0; quadrant = 3; break;
            case 3: tx = 0; ty = -r; quadrant = 0;
        }
        for(var ii=0; ii < r; ii++) { //check the edge of this quadrant
            if((getCellValue(x+tx,y+ty,map) != null) && getCellValue(x+tx,y+ty,map) > 0) {
                choices.push({d:r,v:getCellValue(x+tx,y+ty,map),x:x+tx,y:y+ty});
            }
            switch(quadrant) {
                case 0: tx -= 1; ty += 1; break;
                case 1: tx -= 1; ty -=1; break;
                case 2: tx += 1; ty -= 1; break;
                case 3: tx += 1; ty += 1;
            }
        }
    }
    if(choices.length == 0 ) { //recursive lookup with increased r to a point
        greedyLook(x,y,r+1);
    }
    else {
        //we found something...
        return;
    }
    return;
}

//queue-based flood fill
function floodQueue(x,y,id) {
    if(getCellValue(x,y,flood) == id) { return; }
    if(getCellValue(x,y,map) == 0) { return; }
    var q = [];
    setCellValue(x,y,id,flood);
    //flood[(y*width) + x] = id;
    floodSum += getCellValue(x,y,map);
    q.push({nx:x,ny:y});
    var n;
    while(q.length > 0) {
        n = q.shift();
        if(getCellValue(n.nx-1,n.ny,map) > 0 && getCellValue(n.nx-1,n.ny,flood) != id) {
            floodSum += getCellValue(n.nx-1,n.ny,map);
            setCellValue(n.nx-1,n.ny,id,flood);
            q.push({nx:n.nx-1,ny:n.ny});
        }
        if(getCellValue(n.nx+1,n.ny,map) > 0 && getCellValue(n.nx+1,n.ny,flood) != id) {
            floodSum += getCellValue(n.nx+1,n.ny,map);
            setCellValue(n.nx+1,n.ny,id,flood);
            q.push({nx:n.nx+1,ny:n.ny});
        }
        if(getCellValue(n.nx,n.ny-1,map) > 0 && getCellValue(n.nx,n.ny-1,flood) != id) {
            floodSum += getCellValue(n.nx,n.ny-1,map);
            setCellValue(n.nx,n.ny-1,id,flood);
            q.push({nx:n.nx,ny:n.ny-1});
        }
        if(getCellValue(n.nx,n.ny+1,map) > 0 && getCellValue(n.nx,n.ny+1,flood) != id) {
            floodSum += getCellValue(n.nx,n.ny+1,map);
            setCellValue(n.nx,n.ny+1,id,flood);
            q.push({nx:n.nx,ny:n.ny+1});
        }
    }
}