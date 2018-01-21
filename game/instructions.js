window.onload = function(){
	init();
}

var CONNECT_FROM_BUFFER = 15;

canvas.width = canvas.height = 1000;
canvas.style.width = canvas.style.height = 500;

var peepPositions = [
	[27+20,154],[30+20,263],[39+10,444],[73+10,63],[88+10,367],
	[125,210],
	[125,290], // 6
	[140+10,470],[195+5,128],[215+5,358],
	[221,38],[295,450],[332,121],
	[375,290], // 13
	[375,210],
	[378,397],[429,52],[451,183],[445,459],[461,323]
];

function init(){

	// Add the canvas
	document.body.appendChild(canvas);

	// Add peeps!
	peepPositions.forEach(function(position){
		var peep = new Peep({
			x:position[0], y:position[1],
			noBubble:true
		});
		peeps.push(peep);
	});

	// Connect
	addConnection(peeps[6], peeps[13]);

	// Update
	update();

}

var instructionConnectImage = new Image();
instructionConnectImage.src = "instruction_connect.png";
var instructionDisconnectImage = new Image();
instructionDisconnectImage.src = "instruction_disconnect.png";
var connectAlpha = 1;
var connectShow = true;
var disconnectAlpha = 1;
var disconnectShow = true;

var lastNumOfConnections = 1;
function _preUpdate(){

	if(connectShow && connections.length>lastNumOfConnections){ // increased!
		connectShow = false;
	}
	if(disconnectShow && connections.length<lastNumOfConnections){ // decreased!
		disconnectShow = false;
	}
	lastNumOfConnections = connections.length;

	// Draw instructions...
	connectAlpha = connectAlpha*0.9 + (connectShow?1:0)*0.1;
	disconnectAlpha = disconnectAlpha*0.9 + (disconnectShow?1:0)*0.1;
	if(connectAlpha<0.01) connectAlpha=0;
	if(disconnectAlpha<0.01) disconnectAlpha=0;
	ctx.save();
	if(connectAlpha>0){
		ctx.globalAlpha = connectAlpha;
		ctx.drawImage(instructionConnectImage, 0, 0, 500, 500);
	}
	if(disconnectAlpha>0){
		ctx.globalAlpha = disconnectAlpha;
		ctx.drawImage(instructionDisconnectImage, 0, 0, 500, 500);
	}
	ctx.restore();

}


