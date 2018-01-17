/*******************************

For Today:
- a bunch of peeps, some drunk some not
- draw to connect peeps
- draw to cut connections
- peeps say, in text, whether majority drunk

FOR MVP PROTOTYPE:
1. intro framing
2. teach controls & friendship illusion
3. majority illusion
4. (placeholder outro, w/ link to survey)

*******************************/

Math.TAU = Math.PI*2;

window.onload = function(){
	init();
}

var canvas = document.createElement("canvas");
canvas.width = canvas.height = 1000;
canvas.style.width = canvas.style.height = 500;
canvas.style.border = "1px solid #ccc";
var ctx = canvas.getContext('2d');

var peeps = [];
var connections = [];

function init(){

	// Add the canvas
	document.body.appendChild(canvas);

	// Add the PEEPS
	angle = -Math.TAU*(5.5/12);
	for(var i=0; i<12; i++){
		angle += Math.TAU/12;
		var x = 250 + Math.cos(angle)*200;
		var y = 250 + Math.sin(angle)*200;
		var peep = new Peep({
			x:x, y:y,
			drunk:(i<4)
		});
		peeps.push(peep);
	}

	// Update
	update();

}

var DRAW_STATE = 0; // 0-nothing | 1-connecting | 2-erasing
var DRAW_CONNECT_FROM = null;
function update(){

	// Mouse logic...
	if(Mouse.justPressed && DRAW_STATE===0){
		
		// Clicked on a peep?
		var peepClicked = _mouseOverPeep(20); // buffer of 20px
		if(peepClicked){
			DRAW_CONNECT_FROM = peepClicked;
			DRAW_STATE = 1; // START CONNECTING
		}else{
			DRAW_STATE = 2; // START ERASING
		}

	}
	if(DRAW_STATE==2){ // ERASE

		// Intersect with any connections?
		var line = [Mouse.lastX, Mouse.lastY, Mouse.x, Mouse.y];
		for(var i=connections.length-1; i>=0; i--){ // going BACKWARDS coz killing
			var c = connections[i];
			if(c.hitTest(line)) connections.splice(i,1);
		}

	}
	if(Mouse.justReleased && DRAW_STATE!==0){

		// Connecting peeps, and released on a peep?
		if(DRAW_STATE==1){
			var peepReleased = _mouseOverPeep(20); // buffer of 20px
			if(peepReleased){ // connect 'em!
				addConnection(DRAW_CONNECT_FROM, peepReleased);
				DRAW_CONNECT_FROM = null;
			}
		}
		DRAW_STATE = 0; // back to normal

	}
	Mouse.update();

	// Update Logic
	connections.forEach(function(connection){
		connection.update(ctx);
	});
	peeps.forEach(function(peep){
		peep.update();
	});

	// Draw Logic
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.scale(2,2);
	connections.forEach(function(connection){
		connection.draw(ctx);
	});
	peeps.forEach(function(peep){
		peep.draw(ctx);
	});
	ctx.restore();

	// RAF
	requestAnimationFrame(update);

}

function Peep(config){
	
	var self = this;

	// Properties
	self.x = config.x;
	self.y = config.y;
	self.drunk = config.drunk;

	// Update:
	// what % of my friends are drunk?
	self.numFriends = 0;
	self.numDrunkFriends = 0;
	self.update = function(){
		var friends = getConnected(self);
		self.numFriends = friends.length;
		self.numDrunkFriends = 0;
		friends.forEach(function(friend){
			if(friend.drunk) self.numDrunkFriends++;
		});
	};

	// Draw
	var radius = 20;
	self.draw = function(ctx){

		ctx.save();
		ctx.translate(self.x, self.y);

		// Circle
		ctx.fillStyle = self.drunk ? "#eebb55" : "#ccc";
		ctx.beginPath();
		ctx.arc(0, 0, radius, 0, Math.TAU, false);
		ctx.fill();

		// Face
		ctx.fillStyle = "rgba(0,0,0,0.5)";
		ctx.beginPath();
		ctx.arc(-10, -1, 3, 0, Math.TAU, false);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(10, -1, 3, 0, Math.TAU, false);
		ctx.fill();
		ctx.beginPath();
		ctx.rect(-7, 5, 14, 2);
		ctx.fill();

		// Say HOW MANY FRIENDS
		var label = self.numDrunkFriends+"/"+self.numFriends;
		if(self.numDrunkFriends/self.numFriends>0.5){ // more than half?
			label += " MAJORITY!";
		}
		ctx.font = '12px monospace';
		ctx.fillStyle = "#dd4040";
		ctx.textAlign = "center";
		ctx.fillText(label, 0, -radius-5);

		ctx.restore();

	};

	// Hit Test
	self.hitTest = function(x,y,buffer){
		if(buffer===undefined) buffer=0;
		var dx = self.x-x;
		var dy = self.y-y;
		var dist2 = dx*dx+dy*dy;
		var r = radius+buffer;
		return (dist2<r*r);
	};

}
function _mouseOverPeep(buffer){
	var result;
	peeps.forEach(function(peep){
		if(peep.hitTest(Mouse.x, Mouse.y, buffer)) result=peep;
	});
	return result;
}

function Connection(config){

	var self = this;

	// Properties
	self.from = config.from;
	self.to = config.to;

	// Update
	self.update = function(){
	};

	// Draw
	self.draw = function(ctx){
		ctx.strokeStyle = "#333";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(self.from.x, self.from.y);
		ctx.lineTo(self.to.x, self.to.y);
		ctx.stroke();
	};

	// Hit Test with a LINE SEGMENT
	// code adapted from https://gist.github.com/Joncom/e8e8d18ebe7fe55c3894
	self.hitTest = function(line){

		var p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y;
		p0_x = line[0];
		p0_y = line[1];
		p1_x = line[2];
		p1_y = line[3];
		p2_x = self.from.x;
		p2_y = self.from.y;
		p3_x = self.to.x;
		p3_y = self.to.y;

    	var s1_x, s1_y, s2_x, s2_y;
	    s1_x = p1_x - p0_x;
	    s1_y = p1_y - p0_y;
	    s2_x = p3_x - p2_x;
	    s2_y = p3_y - p2_y;
	    var s, t;
	    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
	    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

		return (s >= 0 && s <= 1 && t >= 0 && t <= 1);

	};

}
function addConnection(from, to){

	// Don't allow connect if connecting to same...
	if(from==to) return;

	// ...or if already exists, in either direction
	for(var i=0; i<connections.length; i++){
		var c = connections[i];
		if(c.from==from && c.to==to) return;
		if(c.from==to && c.to==from) return;
	}

	// Otherwise, sure!
	connections.push(new Connection({
		from:from, to:to
	}));
	
}
function getConnected(peep){
	var results = [];
	for(var i=0; i<connections.length; i++){ // in either direction
		var c = connections[i];
		if(c.from==peep) results.push(c.to);
		if(c.to==peep) results.push(c.from);
	}
	return results;
}

/////////////////////////////
// MOUSE ////////////////////
/////////////////////////////

var Mouse = {
	x:0, y:0,
	pressed:false
};
Mouse.ondown = function(event){
	Mouse.pressed = true;
	Mouse.onmove(event);
};
Mouse.onmove = function(event){
	Mouse.x = event.offsetX;
	Mouse.y = event.offsetY;
};
Mouse.onup = function(event){
	Mouse.pressed = false;
};
Mouse.update = function(){

	// Just pressed, or just released (one frame ago)
	Mouse.justPressed = (!Mouse.lastPressed && Mouse.pressed);
	Mouse.justReleased = (Mouse.lastPressed && !Mouse.pressed);

	// The last frame's stuff
	Mouse.lastX = Mouse.x;
	Mouse.lastY = Mouse.y;
	Mouse.lastPressed = Mouse.pressed;

};
canvas.addEventListener("mousedown", Mouse.ondown);
canvas.addEventListener("mousemove", Mouse.onmove);
window.addEventListener("mouseup", Mouse.onup);



