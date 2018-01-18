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
canvas.style.cursor = "none";
var ctx = canvas.getContext('2d');

var peeps = [];
var connections = [];
var drawing = new Drawing();
var cursor = new Cursor();

function init(){

	// Add the canvas
	document.body.appendChild(canvas);

	// Add the PEEPS
	angle = -Math.TAU*(5.5/12);
	for(var i=0; i<12; i++){
		angle += Math.TAU/12;
		var x = 250 + Math.cos(angle)*200;
		var y = 250 + Math.sin(angle)*200 + 15;
		var peep = new Peep({
			x:x, y:y,
			drunk:(i<4)
		});
		peeps.push(peep);
	}

	// Update
	update();

}

var winnerImage = new Image();
winnerImage.src = "winner.png";

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
			drawing.startConnect(peepClicked); // Drawing logic
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
		drawing.startErase(); // Drawing logic

	}
	if(Mouse.justReleased && DRAW_STATE!==0){

		// Connecting peeps, and released on a peep?
		if(DRAW_STATE==1){
			var peepReleased = _mouseOverPeep(20); // buffer of 20px
			if(peepReleased){ // connect 'em!
				addConnection(DRAW_CONNECT_FROM, peepReleased);
				DRAW_CONNECT_FROM = null;
			}
			drawing.endConnect(); // Drawing logic
		}else if(DRAW_STATE==2){
			drawing.endErase(); // Drawing logic
		}
		DRAW_STATE = 0; // back to normal

	}
	Mouse.update();

	// Cursor Logic
	if(DRAW_STATE==0){
		var peepHovered = _mouseOverPeep(20); // buffer of 20px
		if(peepHovered){
			cursor.setMode(Cursor.CONNECT);
		}else{
			cursor.setMode(Cursor.NORMAL);
		}
	}
	if(DRAW_STATE==1){
		cursor.setMode(Cursor.CONNECT);
	}
	if(DRAW_STATE==2){
		cursor.setMode(Cursor.ERASE);
	}

	// Update Logic
	connections.forEach(function(connection){
		connection.update(ctx);
	});
	drawing.update();
	peeps.forEach(function(peep){
		peep.update();
	});
	cursor.update();

	// WINNER? Only if ALL peeps think drinking is in the majority
	var isWinner = true;
	peeps.forEach(function(peep){
		if(!peep.isMajority) isWinner=false;
	});

	// Draw Logic
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.scale(2,2);
	//ctx.translate(0,100);

		connections.forEach(function(connection){
			connection.draw(ctx);
		});
		drawing.draw(ctx);
		peeps.forEach(function(peep){
			peep.draw(ctx);
		});
		cursor.draw(ctx);
		if(isWinner){
			ctx.drawImage(winnerImage, 0, 0, 500, 500);
		}

	ctx.restore();

	// RAF
	requestAnimationFrame(update);

}

var bubbleImage = new Image();
bubbleImage.src = "bubble.png";
var beerImage = new Image();
beerImage.src = "beer.png";
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
	self.faceX = 0;
	self.faceY = 0;
	self.faceBlink = 0;
	self.isMajority = false;
	self.update = function(){

		// Face position!
		var faceVector = {
			x: (Mouse.x-self.x)/5,
			y: (Mouse.y-self.y)/5
		};
		faceVector.mag = Math.sqrt(faceVector.x*faceVector.x + faceVector.y*faceVector.y);
		var max_distance = 5;
		if(faceVector.mag>max_distance){
			faceVector.x = faceVector.x * (max_distance/faceVector.mag);
			faceVector.y = faceVector.y * (max_distance/faceVector.mag);
		}
		if(self.drunk){
			self.faceX = self.faceX*0.95 + faceVector.x*0.05;
			self.faceY = self.faceY*0.95 + faceVector.y*0.05;
		}else{
			self.faceX = self.faceX*0.8 + faceVector.x*0.2;
			self.faceY = self.faceY*0.8 + faceVector.y*0.2;
		}

		// Blink?
		if(self.drunk){
			if(Math.random()<0.01) self.faceBlink=!self.faceBlink;
		}else{
			if(!self.faceBlink){
				if(Math.random()<0.002) self.faceBlink=true;
			}else{
				if(Math.random()<0.09) self.faceBlink=false;
			}
		}

		// Friends connected...
		var friends = getConnected(self);
		self.numFriends = friends.length;
		self.numDrunkFriends = 0;
		friends.forEach(function(friend){
			if(friend.drunk) self.numDrunkFriends++;
		});

		// Is Majority?
		if(self.numFriends>0 && self.numDrunkFriends/self.numFriends>0.5) self.isMajority=true;
		else self.isMajority=false;

		// Drunk...
		drunkRotateA += drunkRotateAVel;
		drunkRotateB += drunkRotateBVel;

	};

	// Draw
	var radius = 20;
	var drunkRotateA = Math.random()*Math.TAU;
	var drunkRotateAVel = 0.02+Math.random()*0.05;
	var drunkRotateB = Math.random()*Math.TAU;
	var drunkRotateBVel = 0.02+Math.random()*0.05;
	var drunkRotateC = Math.random()*Math.TAU;
	var drunkRotateCVel = 0.02+Math.random()*0.05;
	self.draw = function(ctx){

		ctx.save();
		ctx.translate(self.x, self.y);

		// Circle
		ctx.fillStyle = self.drunk ? "#eebb55" : "#ccc";
		ctx.beginPath();
		ctx.arc(0, 0, radius, 0, Math.TAU, false);
		ctx.fill();

		// Face
		ctx.save();
		if(self.drunk) ctx.rotate(Math.sin(drunkRotateA)*0.1); // DRUNK ROTATE
		if(self.drunk) ctx.drawImage(beerImage, 5, 0, 25, 25); // BEER
		ctx.translate(self.faceX, self.faceY);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			if(self.drunk) ctx.rotate(Math.sin(drunkRotateB)*0.1); // DRUNK ROTATE
			if(self.faceBlink){
				ctx.beginPath();
				ctx.rect(-14, -1, 8, 2);
				ctx.fill();
				ctx.beginPath();
				ctx.rect(6, -1, 8, 2);
				ctx.fill();
			}else{
				ctx.beginPath();
				ctx.arc(-10, -1, 3, 0, Math.TAU, false);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(10, -1, 3, 0, Math.TAU, false);
				ctx.fill();
			}
			if(self.drunk) ctx.rotate(Math.sin(drunkRotateC)*0.1); // DRUNK ROTATE
			ctx.beginPath();
			ctx.rect(-7, 5, 14, 2);
			ctx.fill();
		ctx.restore();

		// Say HOW MANY FRIENDS
		ctx.drawImage(bubbleImage,
					  self.isMajority?100:0, 0, 100, 100,
					  -15, -52, 30, 30);
		var label = self.numDrunkFriends+"/"+self.numFriends;
		ctx.font = '12px sans-serif';
		ctx.fillStyle = "rgba(0,0,0,0.5)";
		ctx.textAlign = "center";
		ctx.fillText(label, 0, -radius-12);

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

function Drawing(){

	var self = this;

	// Update!
	self.update = function(){

		// Connection
		if(self.connectFrom){
			// Over any peeps? Connect to THAT! Else, connect to Mouse
			var peepHovered = _mouseOverPeep(20); // buffer of 20px
			if(peepHovered==self.connectFrom) peepHovered=null; // if same, nah
			self.connectTo = peepHovered ? peepHovered : Mouse;
		}

		// Erase
		if(self.isErasing){
			self.eraseTrail.unshift([Mouse.x,Mouse.y]); // add to start
			if(self.eraseTrail.length>10){
				self.eraseTrail.pop(); // remove from end
			}
		}else{
			self.eraseTrail.pop(); // remove from end
		}

	};

	// Connection!
	self.connectFrom = null;
	self.connectTo = null;
	self.startConnect = function(from){
		self.connectFrom = from;
	};
	self.endConnect = function(){
		self.connectFrom = null;
	};

	// Erase!
	self.isErasing = false;
	self.eraseTrail = [];
	self.startErase = function(){
		self.isErasing = true;
	};
	self.endErase = function(){
		self.isErasing = false;
	};

	// Draw
	self.draw = function(ctx){

		// Connecting...
		if(self.connectFrom){
			ctx.strokeStyle = "#666";
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(self.connectFrom.x, self.connectFrom.y);
			ctx.lineTo(self.connectTo.x, self.connectTo.y);
			ctx.stroke();
		}

		// Erase
		if(self.eraseTrail.length>0){
			ctx.strokeStyle = "#dd4040";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(self.eraseTrail[0][0], self.eraseTrail[0][1]);
			for(var i=1; i<self.eraseTrail.length; i++){
				ctx.lineTo(self.eraseTrail[i][0], self.eraseTrail[i][1]);
			}
			ctx.stroke();
		}

	};

}

var cursorImage = new Image();
cursorImage.src = "cursor.png";
function Cursor(){
	var self = this;

	// MODES
	// 0 - normal
	// 1 - hover, CAN connect
	// 2 - erase
	self.mode = 0;
	self.setMode = function(mode){
		self.mode = mode;
	};

	// Rotate when mouse pressed
	self.rotation = 0; 

	// Update
	self.update = function(){
		var r = Mouse.pressed ? -0.2 : 0;
		self.rotation = self.rotation*0.5 + r*0.5;
	};

	// Draw
	self.draw = function(ctx){
		ctx.save();
		ctx.translate(Mouse.x, Mouse.y);
		ctx.rotate(self.rotation);
		var sx;
		switch(self.mode){
			case Cursor.NORMAL: sx=0; break;
			case Cursor.CONNECT: sx=1; break;
			case Cursor.ERASE: sx=2; break;
		}
		sx = sx*100;
		ctx.drawImage(cursorImage,
					  sx, 0, 100, 100,
					  0, -40, 40, 40);
		ctx.restore();
	};

}
Cursor.NORMAL = 0;
Cursor.CONNECT = 1;
Cursor.ERASE = 2;

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



