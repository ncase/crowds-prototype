window.onload = function(){
	init();
}

var CONNECT_FROM_BUFFER = 20;

canvas.width = canvas.height = 1000;
canvas.style.width = canvas.style.height = 500;

function init(){

	// Add the canvas
	document.body.appendChild(canvas);

	// Add the PEEPS
	var angle = -Math.TAU*(5.5/12);
	for(var i=0; i<12; i++){
		angle += Math.TAU/12;
		var x = 250 + Math.cos(angle)*180;
		var y = 250 + Math.sin(angle)*180 + 15;
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
function _onUpdate(){
	// WINNER? Only if ALL peeps think drinking is in the majority
	var isWinner = true;
	peeps.forEach(function(peep){
		if(!peep.isMajority) isWinner=false;
	});
	if(isWinner){
		ctx.drawImage(winnerImage, 20, 20, 460, 460);
	}
}