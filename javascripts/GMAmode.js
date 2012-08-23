/*
 * Generalized Modal Analysis (GMA) routines for solving 1-D generalized mode.
 *
 * Copyright 2012, Lance Larsen
 * Licensed under the MIT license
 *
 * Uses ODE.js
 */

//-----------------------------------------------------------------------------
// GMAmode constructor - solve is called automatically
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
function GMAmode (opt) {
	this.V = opt.V;
	this.steps = opt.steps;
	this.ctrFactory = (opt.contourFactory) ? opt.contourFactory : defaultFactory;
	this.solnFactory = (opt.solutionFactory) ? opt.solutionFactory : defaultFactory;

	this.odes  = [];
	this.first_index = 0;
	this.offset_avg = 0;

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
// GMAmode: solve
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
GMAmode.prototype.solve = function(steps, dt, t, pts, limit) {
	var avg_offset = 0;

	if (arguments.length >= 3) {
		// If we are starting a solution, initialize the ODEs and solve.
		this.last_index = this.steps + 1;
		this.tmin = this.tmax = t;
		
		// Create a new old for each initial point in pts.
		for (var i=0; i<pts.length; i++) {
			this.odes[i] = new ODE(this.V);
			if (limit) { this.odes[i].setLimit(limit); }
			var soln = this.odes[i].solve(steps, dt, t, pts[i]);
			// time offset.
			var offset = (dt > 0) ? 0 : steps + 1 - soln.t.length;
			avg_offset += offset*offset;
			this.odes[i].offset = offset;

			// Set tmin or tmax based on the solutions last t value.
			if (this.tmin > soln.t[0]) this.tmin = soln.t[0];
			var mx = soln.t.length - 1;
			if (this.tmax < soln.t[mx]) this.tmax = soln.t[mx];
		}
	} else {
		// If we are continuing the solution, add append the new number of steps.
		this.steps += steps;
		this.last_index = this.steps + 1;
		odes = this.odes;
		for (var i=0; i < odes.length; i++) {
			var soln = odes[i].solve(steps,dt);
			var offset = (dt > 0) ? 0 : steps + 1 - soln.t.length;
			avg_offset += offset*offset;
			this.odes[i].offset = offset;
			// Set tmin or tmax based on the solutions last t value.
			if (this.tmin > soln.t[0]) this.tmin = soln.t[0];
			var mx = soln.t.length - 1;
			if (this.tmax < soln.t[mx]) this.tmax = soln.t[mx];
		}
	}
	this.offset_avg = Math.floor(Math.sqrt(avg_offset/this.last_index));
}

//-----------------------------------------------------------------------------
// GMAmode: getStepIterator
//-----------------------------------------------------------------------------
GMAmode.prototype.getStepIterator = function (opts) {
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
// GMAmode: 
//-----------------------------------------------------------------------------
GMAmode.prototype.getContour = function(stepn) {
	var t = [];
	var pts = [];
	var told = undefined;
	for (var i=0; i<this.odes.length; i++) {
		var stepn1 = stepn - this.odes[i].offset;
		if (stepn1 >=0) {
			this.odes[i].pushPt(stepn1,t,pts);
		}
	}
	return this.ctrFactory(this, stepn, {t: t, pts: pts});
}

//-----------------------------------------------------------------------------
// GMAmode: 
//-----------------------------------------------------------------------------
GMAmode.prototype.getContours = function(arry, opts) {
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
// GMAmode: 
//-----------------------------------------------------------------------------
GMAmode.prototype.getSolution = function(idx) {
	var t = [], pts = [];
	var index1 = Math.max(0, this.first_index - this.odes[idx].offset);
	var index2 = Math.max(0, this.last_index+1 - this.odes[idx].offset);
	if (index2 < 1) return;

	t = this.odes[idx].t.slice(index1, this.last_index+1);
	pts = this.odes[idx].pts.slice(index1, this.last_index+1);
	return this.solnFactory(this, idx, {t: t, pts: pts});
}

//-----------------------------------------------------------------------------
// GMAmode: 
//-----------------------------------------------------------------------------
GMAmode.prototype.getSolutions = function(arry, opts) {
	opts = opts || {};
	opts.totalSteps = this.odes.length;
	var this_ = this;
	var addplot = function(i, idx, opts) {
		var soln = this_.getSolution(idx); 
		if (soln) arry.push(soln);
	}
	var iter = this.getStepIterator(opts);
	iter(addplot);
	// Remove total steps, so that it doesn't affect other plot calls.
	delete opts["totalSteps"];
}

//-----------------------------------------------------------------------------
// GMAmode: 
//-----------------------------------------------------------------------------
GMAmode.prototype.setLimit = function(limit_func) {
	for (ode in this.odes) {
		ode.setLimit(limit_func);
	}
}