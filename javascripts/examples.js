/*
 * Duffing and Van Der Pol oscillator examples.
 *
 * Copyright 2012, Lance Larsen
 * Licensed under the MIT license
 *
 * Uses GMAmode.js, Animate.js, flot/jquery.js, and flot/jquery.flot.js
 */

var colors = ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"];
var colorSets = new ColorSwitcher({gray: ["#bbbbbb"], colors: colors},'colors');

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

function DuffingSolver(steps) {
	var g = Ellipse(0.5, 1.2, -Math.PI/4.5);
	var pts = linspace(0.0,2*Math.PI,60,g);
	var ctrFactory = AnimatedGMAPlotFactory(colors);
	var solnFactory = AnimatedGMAPlotFactory(colorSets);

	var f = DuffingEqn(0.05, 0.2);
	var steps = 500;
	gma = new GMAmode({V:f, steps:steps, dt:-0.05, t:0.0, pts:pts, contourFactory:ctrFactory, solutionFactory:solnFactory});

	gma.plot = DuffingPlot;
	return gma;
}

var duff_plots = undefined;
function DuffingPlot(canvas, showMode, showSolns) {
	if (duff_plots) duff_plots.kill();
	duff_plots = new Animator($(canvas));

	var contours = 14;
	if (showSolns) {
		colorSets.setColorSet((showMode) ? 'gray':'colors');
		this.getSolutions(duff_plots,{nCurves:4});
	}
	if (showMode) this.getContours(duff_plots,{nCurves:contours});
	//var plot = $.plot($(canvas), duff_plots);
	duff_plots.animate(this.tmin, this.tmax, 8);
}

// Van Der Pol oscillator
function VanDerPolEqn(c) {
	var VanDerPol = function(t,v) {
		pt = [v[1], c*(1-v[0]*v[0])*v[1] - v[0]];
		return pt;
	}
	return VanDerPol;
}

function VanDerPolSolver(isteps, osteps) {
	// The VanDerPol ODE vector equation
	var vdp = VanDerPolEqn(0.2);
	var ctrFactory = AnimatedGMAPlotFactory(colors);
	var solnFactory = AnimatedGMAPlotFactory(colorSets);

	// ---- Inner Solution ----
	// Start with an inner ellipse as the set of initial points
	var initialring = Ellipse(0.1, 1.2, Math.PI/4.5);
	var cirpts = linspace(0.0,2*Math.PI,60,initialring);

	var gmainner = new GMAmode({V:vdp, steps:isteps, dt:0.05, t:0.0, pts:cirpts, contourFactory:ctrFactory, solutionFactory:solnFactory});

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
	ctrFactory = AnimatedGMAPlotFactory(colors);
	solnFactory = AnimatedGMAPlotFactory(colorSets);
	var gmaouter = new GMAmode({V:vdp, steps:steps, dt:-0.05, t:0.0, pts:pts, limit:limit, contourFactory:ctrFactory, solutionFactory:solnFactory});

	var gma = 
	{ inner: gmainner,
	  outer: gmaouter,
	  plot: VanDerPolPlot,
	  limitcycle: limitcycle };

	return gma;
}

var vdp_plots = undefined;
function VanDerPolPlot(canvas, showMode, showSolns) {
	// Structure to store the plots.
	if (vdp_plots) vdp_plots.kill();
	vdp_plots = new Animator($(canvas));

	// Rings inside the limit cycle
	var contours = 6;
	/*
	if (showMode) this.inner.getContours(vdp_plots, {nCurves:contours});
	if (showSolns) {
		colorSets.setColorSet((showMode) ? 'gray' : 'colors');
		this.inner.getSolutions(vdp_plots, {nCurves:2});
	}
	*/

	// Rings outside the limit cycle
	var offset = 35;
	contours = 10;
	if (showSolns) {
		colorSets.setColorSet((showMode) ? 'gray' : 'colors');
		this.outer.getSolutions(vdp_plots,{nCurves:8});
	}
	if (showMode) this.outer.getContours(vdp_plots,{nCurves:contours,offset:offset});

	// Include the limit cycle
	vdp_plots.push({data: this.limitcycle, lines: {lineWidth: 3.0}});

	// Plot the results
	//var plot = $.plot($(canvas), vdp_plots);
	vdp_plots.animate(this.outer.tmin, this.outer.tmax, 8);
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
	// Select the specific GMAmode from gmas and plot results.
	// The form.name should match the name of the canvas to update.
	gmas[type].plot(form.name, showMode, showSoln);
}