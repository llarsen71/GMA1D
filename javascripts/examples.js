/*
 * TITLE: Examples
 * Duffing and Van Der Pol oscillator examples.
 *
 * > Copyright 2012, Lance Larsen
 * > Licensed under the MIT license
 *
 * Uses GMAmode.js, Animate.js, flot/jquery.js, and flot/jquery.flot.js
 */

/*
PROPERTY: colors
 A set of colors used for plotting curves.
*/
var colors = ["#9440ed", "#4da74d", "#cb4b4b", "#edc240", "#afd8f8"];
/*
PROPERTY: colorSets
 Different color sets. This is used to switch the solution plots between a set of colors (when no
 contours are plotted, and grey (when mode contours are plotted).
*/
var colorSets = new ColorSwitcher({gray: ["#bbbbbb"], colors: colors},'colors');
/*
PROPERTY: canvases
 This is an object that is used to hold the list of current plot canvases.
*/
var canvases = {};

/*
FUNCTION: Ellipse
 Get a parameteric function that produces the points for an ellipse.  This is used to generate 
 an initial modal curve in the region of an ODE is oscillatory and approximately linear.

PARAMETERS:
 a - the amplitude along the widest axis of the ellipse (the x axis).
 excentricity - The ratio of the small axis amplitude to the large axis amplitude.
 angle - The rotation angle of the ellipse from the x axis.
 
RETURNS:
 A parametric function for an ellipse of the form func(t) which returns an [x,y] pt. The parameter t 
 should go from 0 to 2*pi.
*/
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

/*
FUNCTION: DuffingEqn
 This generate a Duffing Equation ODE vector field function. The duffing equation has the
 form x''+2*c*x'+x+eps*x^3=0.

PARMAETERS:
 eps - The cubic nonlinearity coefficient
 c - The damping coefficient
 
RETURNS:
 An Duffing ODE function of the form 'V(t,pt)' that returns the ODE vector [x',x'']. 
 't' is the independent value, and 'pt' is [x,x'].
*/
function DuffingEqn(eps, c) {
	var Duffing = function(t,pt) {
		var v2 = [];
		v2[0] =  pt[1];
		v2[1] = -2*c*pt[1]-pt[0]-eps*Math.pow(pt[0],3);
		return v2;
	}
	return Duffing;
}

/*
FUNCTION: DuffingSolver
 Function to solve the Duffing equation.

PARAMETERS:
 steps - The number of ODE steps to take when solving the Duffing equation. Note that this
 solves backwards from a solution near the equilibrium point with step sizes of -0.05.

RETURNS:
 A GMAmode object for the Duffing oscillator.
*/
function DuffingSolver() {
	var g = Ellipse(0.5, 1.2, -Math.PI/4.5);
	var pts = linspace(0.0,2*Math.PI,60,g);
	var ctrFactory = AnimatedGMAPlotFactory(colors);
	var solnFactory = AnimatedGMAPlotFactory(colorSets);

	var f = DuffingEqn(0.05, 0.2);
	var steps = 360;
	var gma = new GMAmode({V:f, steps:steps, dt:-0.05, t:0.0, pts:pts, contourFactory:ctrFactory, solutionFactory:solnFactory});

	gma.plot = DuffingPlot;
	return gma;
}

/*
FUNCTION: DuffingPlot
 Plot the Duffing generalized 1-D mode and/or some of the solution curves.
 The plot is animated, showing the time progress of the solution.

PARAMETERS:
 canvas - The canvas the the solution is plotted onto.
 showMode - Flag to indicate whether the modal contours should be plotted.
 showSolns - Flag to indicate whether the ODE solutions should be plotted.
*/
function DuffingPlot(canvas, showMode, showSolns) {
	if (canvas in canvases) canvases[canvas].kill();
	canvases[canvas] = new Animator($(canvas));
	var duff_plots = canvases[canvas];

	var contours = 12;
	if (showMode) this.getContours(duff_plots,{nCurves:contours});
	if (showSolns) {
		colorSets.setColorSet((showMode) ? 'gray':'colors');
		this.getSolutions(duff_plots,{nCurves:4});
	}
	//var plot = $.plot($(canvas), duff_plots);
	duff_plots.animate(this.tmin, this.tmax, 8);
}

/*
FUNCTION: VanDerPolEqn
 This generate a VanDer Pol Equation ODE vector field function. The Van Der Pol equation has the
 form x''-c*(1-x^2)*x'+x=0.

PARMAETERS:
 c - The (negative) damping coefficient
 
RETURNS:
 An Van Der Pol ODE function of the form 'V(t,pt)' that returns the ODE vector [x',x'']. 
 't' is the independent value, and 'pt' is [x,x'].
*/
function VanDerPolEqn(c) {
	var VanDerPol = function(t,v) {
		pt = [v[1], c*(1-v[0]*v[0])*v[1] - v[0]];
		return pt;
	}
	return VanDerPol;
}

/*
FUNCTION: VanDerPolSolver
 Function to solve the Duffing equation.

PARAMETERS:
 isteps - The number of ODE steps to take solving the Van Der Pol equation from inside the limit cycle.
   The initial curve is an Ellipse near the unstable equilibrium. This solution is disabled at present.
 osteps - The number of ODE steps to take solveing the Van Der Pol equation from outside the limit cycle.
  The initial curve is a slightly expanded limit cycle curve. The solution is solved backwards (away from
  the limit cycle, with a step size of -0.05.

RETURNS:
 A GMAmode object for the Van Der Pol oscillator.
*/
function VanDerPolSolver() {
	// The VanDerPol ODE vector equation
	var vdp = VanDerPolEqn(0.2);
	var ctrFactory = AnimatedGMAPlotFactory(colors);
	var solnFactory = AnimatedGMAPlotFactory(colorSets);

	// ---- Inner Solution ----
	// Start with an inner ellipse as the set of initial points
	var initialring = Ellipse(0.1, 1.2, Math.PI/4.5);
	var cirpts = linspace(0.0,2*Math.PI,60,initialring);
	var isteps = 400;
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

/*
FUNCTION: VanDerPolPlot
 Plot the VanDer Pol generalized 1-D mode and/or some of the solution curves.
 The plot is animated, showing the time progress of the solution.

PARAMETERS:
 canvas - The canvas the the solution is plotted onto.
 showMode - Flag to indicate whether the modal contours should be plotted.
 showSolns - Flag to indicate whether the ODE solutions should be plotted.
*/
function VanDerPolPlot(canvas, showMode, showSolns) {
	// Structure to store the plots.
	if (canvas in canvases) canvases[canvas].kill();
	canvases[canvas] = new Animator($(canvas));
	canvases[canvas] = new Animator($(canvas));
	var vdp_plots = canvases[canvas];

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
	if (showMode) this.outer.getContours(vdp_plots,{nCurves:contours,offset:offset});
	if (showSolns) {
		colorSets.setColorSet((showMode) ? 'gray' : 'colors');
		this.outer.getSolutions(vdp_plots,{nCurves:8});
	}

	// Include the limit cycle
	vdp_plots.push({data: this.limitcycle, lines: {lineWidth: 3.0}, color:"#000000"});

	// Plot the results
	//var plot = $.plot($(canvas), vdp_plots);
	vdp_plots.animate(this.outer.tmin, this.outer.tmax, 8);
}