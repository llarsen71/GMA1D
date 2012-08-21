/*
 * ODE and 1D Mode solving subroutines.
 *
 * Copyright 2012, Lance Larsen
 * Licensed under the MIT license
 */

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// ODE Class 
//
// The ode class is used to solve a system of ordinary differential equations. 
// The ODE is expected to be provided to the constuctor in vector field form.
// Take the following ODE for example:
//     x''' - x'' + 2*x' - 3*x = sin(t)         (1)
// This can be written in first order form, by assigning a new variable for
// all but the highest order derivative: 
//     x' = y                                   (2)
//     y' = z  (i.e. x'' = z)
// Note that the higest order derivative can then be replaced with a first
// order derivative (z' = x'''). If we substitute (2) and z' into (1) and solve
// for z' (i.e. x''') we get:
//     z' = z - 2*y + 3*x + sin(t)              (3)
//
// If we combine the equations from (2) and (3) we now have a system of
// equations in first order form.
//     x' = y
//     y' = z
//     z' = z - 2*y + 3*x + sin(t)
//     
// This can be represented as a vector or an array:
//     [x',y',z'] = [y, z, z-2*y+3*x+sin(t)]    (4)
//
// To use the ODE class, a javascript function needs to be created that 
// replicates a first order vector field such as equation (4) above. The 
// javascript function takes the independent derivative variable as a first
// value (if we assume x' = dx/dt then t is our independent variable), and the
// array of dependent variables (in this case [x,y,z]) as the second term. Here
// is an example function:
//
// var V = function(t, pt) {
//    var x = pt[0], y= pt[1], z = pt[2];
//    return [y, z, z - 2*y + 3*x + sin(t)];
// }
//
// var ode_ = ODE(V);
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// ODE constructor
//
// Inputs:
//   V - The ODE vector field V(t,pt) where t is the derivative variable, and 
//       pt is a current initial or solution point. V should return the ODE 
//       vector feild value at the point.
//-----------------------------------------------------------------------------

function ODE(V) {
	this.t   = [];
	this.pts = [];
	this.n   = -1;
	this.V   = V;
}

//-----------------------------------------------------------------------------
// ODE: step
//
// The ODE step function adds one step to the ODE solution based on the given 
// dt.
//
// return true if a point was added, or false if it was not. A point is not
// added is any of the point values is NaN. In addition, if the ODE has a 
// function named 'limit', this will be called with the new point that is
// calculated. If the 'limit' function returns false, the point is not added
// and false is returned from this function. 
//-----------------------------------------------------------------------------

ODE.prototype.step = function(dt) {
	var t  = this.t[this.n];
	var pt = this.pts[this.n];
	var V  = this.V;

	//k1 = dt*V(t,pt)
	var k1 = SxV(dt, V(t,pt));
	// dt*V(t+0.5*dt, pt+0.5*k1)
	var k2 = SxV(dt, V(t+0.5*dt, VpV(pt, SxV(0.5, k1))));
	// k3 = dt*V(t+0.5*dt,pt+0.5*k2)
	var k3 = SxV(dt, V(t+0.5*dt, VpV(pt, SxV(0.5, k2))));
	// k4 = dt*V(t+dt,pt+k3)
	var k4 = SxV(dt, V(t+0.5*dt, VpV(pt, k3)));
	// v = pt + (k1+2.0*(k2+k3)+k4)/6.0
	var pt = VpV(pt, SxV(1.0/6.0, VpV(k1,SxV(2,VpV(k2,k3)),k4)));

	for (n in pt) { if (isNaN(n)) {return false;}}
	if ("limit" in this) {
		if (typeof this.limit === "function") {
			if (!this.limit(pt)) return false; 
		}
	}

	// Increment the index
	this.n += 1;
	// Add a new time value and the new ODE solution point.
	this.t[this.n]   = t+dt;
	this.pts[this.n] = pt;
	return true;
}

//-----------------------------------------------------------------------------
// ODE: solve
//
// The solve function solves the given number of ODE steps.
//
// Inputs:
//   steps - The number of ODE steps to take.
//   dt    - The step size.
//   t     - (Optional) The initial time. If solve has already been called
//           once, it can be called again to extend the solution, and this
//           value is not needed.
//   pt    - (Optional) The initial point. Only needed for initial call to
//           solve
//
// returns an object literal containing 't', which is an array of time values,
// and pts, which is the solution point associated with each time in 't'.
//-----------------------------------------------------------------------------
ODE.prototype.solve = function(steps, dt, t, pt) {
	// Do initialization
	this.dt = dt;
	// Set initial conditions if they are passed in.
	if (arguments.length > 2) {
		this.t   = [t];
		this.pts = [pt];
		this.n   = 0;
	}
	else if (this.n === -1) {
		alert("initial conditions are needed for first call to 'solve'");
	}

	// Solve the ODE
	for (var i=0; i < steps; i++) {
		if (!this.step(dt)) break;
	}

	return {t: this.t, pts: this.pts}
}

//-----------------------------------------------------------------------------
// ODE: pushPt
//
// This appends value at 'stepn'.
//
// Input:
//   stepn - The step to take values from
//   t     - The t array to push t to.
//   pts   - The pts array to push a point to.
//-----------------------------------------------------------------------------
ODE.prototype.pushPt = function(stepn, t, pts) {
	if (this.pts.length > stepn) {
		t.push(this.t[stepn]);
		pts.push(this.pts[stepn]);
	}
}

//-----------------------------------------------------------------------------
// ODE: setLimit
//
// This adds a limit function to the ODE. The function that is passed in should
// expect a point array, and should return true if the point is within the
// desired solution bounds, or false if it is outside the desired bounds.
//-----------------------------------------------------------------------------
ODE.prototype.setLimit = function(limit_func) {
	this.limit = limit_func;
}

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// GMAMode Class
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// GMAMode constructor - solve is called automatically
//
// Inputs:
//   opt.V     - The vector field or ODE
//   opt.steps - The number of steps to solve for each point on initial modal
//               curve
//   opt.dt    - The timestep for each step
//   opt.t     - The initial time value
//   opt.pts   - The initial mode curve
//   opt.limit - A limit function used to indicate when to bound the solution.
//               The function should take a point and indicate true if the
//               point is within the bounds, or false if it is not.
//   opt.contourFactory - (Optional) factory used to process contour objects.
//               The function form is 'contourFactory(gmaobj, stepn, contour)'
//               where gmaobj is this object, stepn is the stepn is index
//               used to get the points, and contour is a object with 'data'
//               holding the contour data. 
//-----------------------------------------------------------------------------
function GMAMode (opt) {
	this.V = opt.V;
	this.steps = opt.steps;
	this.ctrFactory = (opt.contourFactory) ? opt.contourFactory : defaultFactory;
	this.solnFactory = (opt.solutionFactory) ? opt.solutionFactory : defaultFactory;

	this.odes  = [];
	this.first_index = 0;

	this.solve(this.steps, opt.dt, opt.t, opt.pts, opt.limit);
	// this.tmin and this.tmax set later
}

//-----------------------------------------------------------------------------
// The default contour factory just returns the object passed in.
//-----------------------------------------------------------------------------
function defaultFactory(gmaobj, stepn, contour) {
	return contour;
}

//-----------------------------------------------------------------------------
// GMAMode: solve
//
// Solve the ODE to calculate the evolution of the modal curve.
//
// Inputs:
//   steps - The number of steps to solve for each point on initial mode curve
//   dt    - The timestep for each step
//
//   Optional: Not needed if extending the solution
//
//   t     - The initial time value
//   pts   - The initial mode curve
//   limit - A limit function used to indicate when to bound the solution. The
//           function should take a point and indicate true if the point is
//           within the bounds, or false if it is not.
//-----------------------------------------------------------------------------
GMAMode.prototype.solve = function(steps, dt, t, pts, limit) {
	if (arguments.length >= 3) {
		// If we are starting a solution, initialize the ODEs and solve.
		this.last_index = this.steps + 1;
		this.tmin = this.tmax = t;
		// Create a new old for each initial point in pts.
		for (var i=0; i<pts.length; i++) {
			this.odes[i] = new ODE(this.V);
			if (limit) { this.odes[i].setLimit(limit); }
			var soln = this.odes[i].solve(steps, dt, t, pts[i]);

			// Set tmin or tmax based on the solutions last t value.
			var tend = soln.t[soln.t.length - 1];
			if (dt > 0) { if (tend > this.tmax) { this.tmax = tend; } } 
			else { if (tend < this.tmin) { this.tmin = tend; } }
		}
	} else {
		// If we are continuing the solution, add append the new number of steps.
		this.steps += steps;
		this.last_index = this.steps + 1;
		odes = this.odes;
		for (var i=0; i < odes.length; i++) {
			var soln = odes[i].solve(steps,dt);

			// Set tmin or tmax based on the solutions last t value.
			var tend = soln.t[soln.t.length - 1];
			if (dt > 0) { if (tend > this.tmax) { this.tmax = tend; } } 
			else { if (tend < this.tmin) { this.tmin = tend; } }
		}
	}
}

//-----------------------------------------------------------------------------
// GMAMode: getStepIterator
//-----------------------------------------------------------------------------
GMAMode.prototype.getStepIterator = function (opts) {
	opts = opts || {};
	opts.nCurves = opts.nCurves || 6;
	opts.offset = opts.offset || 0;
	opts.totalSteps = opts.totalSteps || this.steps;
	opts.stepsz = Math.floor((opts.totalSteps-opts.offset)/opts.nCurves);
	var nCurves = opts.nCurves;
	var offset = opts.offset;
	var stepsz = opts.stepsz;
	var iter = function(callback) {
		for (var i = 0; i<nCurves; i++) {
			callback(i, offset + i*stepsz, opts);
		}
	}
	return iter;
}

//-----------------------------------------------------------------------------
// GMAMode: 
//-----------------------------------------------------------------------------
GMAMode.prototype.getContour = function(stepn) {
	var t = [];
	var pts = [];
	for (var i=0; i<this.odes.length; i++) {
		this.odes[i].pushPt(stepn,t,pts);
	}
	return this.ctrFactory(this, stepn, {t: t, pts: pts});
}

//-----------------------------------------------------------------------------
// GMAMode: 
//-----------------------------------------------------------------------------
GMAMode.prototype.getContours = function(arry, opts) {
	var this_ = this;
	var addplot = function (i, idx, opts) {
		arry.push(this_.getContour(idx));
		opts.idx = idx;
	}
	var iter = this.getStepIterator(opts);
	iter(addplot);
	this.first_index = opts.offset;
	this.nCurves = opts.nContours;
	this.last_index = opts.idx;
	this.contourOpts = opts;
}

//-----------------------------------------------------------------------------
// GMAMode: 
//-----------------------------------------------------------------------------
GMAMode.prototype.getSolution = function(idx) {
	var t = [], pts = [];
	t   = this.odes[idx].t.slice(this.first_index, this.last_index+1);
	pts = this.odes[idx].pts.slice(this.first_index, this.last_index+1);
	return this.solnFactory(this, idx, {t: t, pts: pts});
}

//-----------------------------------------------------------------------------
// GMAMode: 
//-----------------------------------------------------------------------------
GMAMode.prototype.getSolutions = function(arry, opts) {
	opts = opts || {};
	opts.totalSteps = this.odes.length;
	var this_ = this;
	var addplot = function(i,idx,opts) {
		arry.push(this_.getSolution(idx));
	}
	var iter = this.getStepIterator(opts);
	iter(addplot);
	// Remove total steps, so that it doesn't affect other plot calls.
	delete opts["totalSteps"];
}

//-----------------------------------------------------------------------------
// GMAMode: 
//-----------------------------------------------------------------------------
GMAMode.prototype.setLimit = function(limit_func) {
	for (ode in this.odes) {
		ode.setLimit(limit_func);
	}
}
