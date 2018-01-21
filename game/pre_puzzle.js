window.onload = function(){
	init();
}

var CONNECT_FROM_BUFFER = 5;

canvas.width = canvas.height = 500;
canvas.style.width = canvas.style.height = 250;

function init(){

	// Add the canvas
	document.body.appendChild(canvas);

	// Add the PEEPS
	peeps.push(new Peep({
		x:25+30, y:25+55,
		drunk:false
	}));
	peeps.push(new Peep({
		x:25+30, y:25+170,
		drunk:false
	}));
	peeps.push(new Peep({
		x:25+170, y:25+55,
		drunk:true
	}));
	peeps.push(new Peep({
		x:25+170, y:25+170,
		drunk:true
	}));

	addConnection(peeps[2], peeps[1]);
	addConnection(peeps[2], peeps[3]);

	// Update
	update();

}
