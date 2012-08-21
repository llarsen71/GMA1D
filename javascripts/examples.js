// Duffing oscillator
function DuffingEqn(eps, c) {
	var Duffing = function(t,v) {
		var v2 = [];
		v2[0] =  v[1];
		v2[1] = -2*c*v[1]-v[0]-eps*Math.pow(v[0],3);
		return v2;
	}
	return Duffing;
}

// Van Der Pol oscillator
function VanDerPolEqn(c) {
	var VanDerPol = function(t,v) {
		pt = [v[1], c*(1-v[0]*v[0])*v[1] - v[0]];
		return pt;
	}
	return VanDerPol;
}

function Ellipse(a,excentricity,angle) {
	var ellips = function(t) {
		var pt  = [a*Math.cos(t),a*excentricity*Math.sin(t)];
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		var pt2 = [pt[0]*c+pt[1]*s,-pt[0]*s+pt[1]*c];
		return pt2;
	}
	return ellips;
}

function DuffingSolver(steps) {
	var g = Ellipse(0.5, 1.2, -Math.PI/4.5);
	var pts = linspace(0.0,2*Math.PI,60,g);
	var colors = ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"];
	var ctrFactory = AnimatedGMAContourFactory(colors);
	var solnFactory = AnimatedGMAContourFactory(colors);

	var f = DuffingEqn(0.05, 0.2);
	var steps = 500;
	gma = new GMAMode({V:f, steps:steps, dt:-0.05, t:1.0, pts:pts, contourFactory:ctrFactory, solutionFactory:solnFactory});

	gma.plot = DuffingPlot;
	return gma;
}

function DuffingPlot(canvas, showMode, showSolns) {
	var plots = [];
	var contours = 14;
	if (showMode) this.getContours(plots,{nCurves:contours});
	if (showSolns) this.getSolutions(plots,{nCurves:2,useGrey:showMode});

	var plot = $.plot($(canvas), plots);
}

function VanDerPolSolver(isteps, osteps) {
	// The VanDerPol ODE vector equation
	var vdp = VanDerPolEqn(0.2);
	var colors = ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"];
	var ctrFactory = AnimatedGMAContourFactory(colors);
	var solnFactory = AnimatedGMAContourFactory(colors);

	// ---- Inner Solution ----
	// Start with an inner ellipse as the set of initial points
	var initialring = Ellipse(0.1, 1.2, Math.PI/4.5);
	var cirpts = linspace(0.0,2*Math.PI,60,initialring);

	var gmainner = new GMAMode({V:vdp, steps:isteps, dt:0.05, t:1.0, pts:cirpts, contourFactory:ctrFactory, solutionFactory:solnFactory});

	// ---- Outer Solution ----
	// Use a ring just wider than the limit cycle for the outer 
	// initial points. Use the ODE sovler to calculate the limit cycle.
	// Start with a point on the limit cycle.
	var x = [2.0113107,0.0509031224];
	// take the number of steps that closes the loop.
	var v = new ODE(vdp).solve(113, 0.0673, 1.0, x);
	var limitcycle = v.pts;

	// Function to enlarge the limit cycle solution 
	v.scale = function(sf) {
		var pts = [];
		for (var i=0; i<this.pts.length; i++) {
			pts[i] = SxV(sf,this.pts[i]);
		}
		return pts;
	}
	var pts = v.scale(1.01);

	var steps = 400;
	// Don't let the solution points exceed a bound of 50.
	var limit = function(v) {
		for (var i=0; i<v.length; i++) {
			if (Math.abs(v[i]) > 50.0) return false;
		}
		return true;
	}
	ctrFactory = AnimatedGMAContourFactory(colors);
	solnFactory = AnimatedGMAContourFactory(colors);
	var gmaouter = new GMAMode({V:vdp, steps:steps, dt:-0.05, t:1.0, pts:pts, limit:limit, contourFactory:ctrFactory, solutionFactory:solnFactory});

	var gma = 
	{ inner: gmainner,
	  outer: gmaouter,
	  plot: VanDerPolPlot,
	  limitcycle: limitcycle };

	return gma;
}

function VanDerPolPlot(canvas, showMode, showSolns) {
	// Structure to store the plots.
	var plots = new Animator($(canvas));

	// Rings inside the limit cycle
	var contours = 6;
	if (showMode) this.inner.getContours(plots, {nCurves:contours});
	if (showSolns) this.inner.getSolutions(plots, {nCurves:2,useGrey:showMode});

	// Rings outside the limit cycle
	var offset = 80;
	contours = 10;
	if (showMode) this.outer.getContours(plots,{nCurves:contours,offset:offset});
	if (showSolns) this.outer.getSolutions(plots,{nCurves:6,useGrey:showMode});

	// Include the limit cycle
	if (showMode) plots.push({data: this.limitcycle, lines: {lineWidth: 3.0}});

	// Plot the results
	//var plot = $.plot($(canvas), plots);
	plots.animate(this.outer.tmin, this.outer.tmax, 10);
}

function updatePlot(gmas, form) {
	var type, showSoln, showMode;
	// Get the plot inputs
	for (var i=0; i<form.length; i++) {
		field = form.elements[i];
		if (field.name === "model") type = field.value;
		else if (field.name === "showSoln") showSoln = field.checked;
		else if (field.name === "showMode") showMode = field.checked;
	}
	// Select the specific GMAMode from gmas and plot results.
	// The form.name should match the name of the canvas to update.
	gmas[type].plot(form.name, showMode, showSoln);
}

function solutionAnimateFactory() {
	var colors = ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"];
	var clrFactory = AnimatedGMAContourFactory(["#9440ed", "#4da74d", "#cb4b4b", "#afd8f8", "#edc240"]);
	var greyFactory = AnimatedGMAContourFactory(["#bbbbbb"]);

	function factory() {
	}
	
	function setFactoryType(typ) {
	}
}
