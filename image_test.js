var Jimp = require('jimp');

var image = new Jimp(100,100,0x000000FF);
var val = 0;
greedyLook(50,50,1);
image.write(__dirname + "/greedyLook.png");

function limit(val, max) {
    if(val > max) {
        return max;
    }
    else return val;
}

function greedyLook(x,y,r) { //check the von Neumann neighborhood for food
    if(r > 8) { return; } //magic number! we stop after 6 for now...
    //check at range r, repeat at r+1 if nothing found up to max of 6
    var tx, ty;
    var quadrant = 0;
    val = Jimp.rgbaToInt(0, limit( r*32, 255), 0, 255);
    for(var i=0; i < r*4; i++) { //we check r*4 cells at each stage of r
        //get some offsets based on which quadrant we're ready to loop inside at
        switch(quadrant) {
            case 0: tx = r; ty = 0; quadrant = 1; break;
            case 1: tx = 0; ty = r; quadrant = 2; break;
            case 2: tx = -r; ty = 0; quadrant = 3; break;
            case 3: tx = 0; ty = -r; quadrant = 0;
        }
        for(var ii=0; ii < r; ii++) { //check the edge of this quadrant
            image.setPixelColor(val,x+tx,y+ty);
            switch(quadrant) {
                case 0: tx -= 1; ty += 1; break;
                case 1: tx -= 1; ty -=1; break;
                case 2: tx += 1; ty -= 1; break;
                case 3: tx += 1; ty += 1;
            }
        }
    }
    greedyLook(x,y,r+1);
    return;
}