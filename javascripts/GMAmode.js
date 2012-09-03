/*
 * TITLE: GMAmode class
 *  Generalized Modal Analysis (GMA) routines for solving 1-D generalized mode.
 *  A Generalized 1-D Mode is constructed by starting with a curve in the
 *  ODE solution space where the points on the curve are taken as ODE initial 
 *  conditions (t=0). The evolution of the curve is found by solving each
 *  point on the curve, and using t as the evolution parameter. So for example,
 *  the curve is carried by the vector field, and results in a new curve at t=1
 *  (or any other number).
 *
 * > Copyright 2012, Lance Larsen
 * > Licensed under the MIT license
 *
 * Uses ODE.js
 */

//-----------------------------------------------------------------------------
/*
 CLASS: GMAmode 
  Creates a new GMA model object. Solve is called automatically to calculate
  the modal solution.

 CONSTRUCTOR: GMAmode
   Creates a new GMAmode object.

 PARAMETERS:
   opt       - An object with the following properites
   opt.V     - The vector field or ODE
   opt.steps - The number of steps to solve for each point on initial modal
               curve
   opt.dt    - The timestep for each step
   opt.t     - The initial time value
   opt.pts   - The initial mode curve
   opt.limit - A limit function used to indicate when to bound the solution.
               The function should take a point and indicate true if the
               point is within the bounds, or false if it is not.
   opt.contourFactory - (Optional) factory used to process contour objects.
               The function form is 'contourFactory(gmaobj, stepn, contour)'
               where gmaobj is this object, stepn is the stepn is index
               used to get the points, and contour is a object with 'data'
               holding the contour data. 
*/
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
/*
 FUNCTION: solve
  Calculate the evolution of the modal curve. The optional parameters are not
  needed if solve is called more than once. Calling solve without the
  optional parameters extends the solution.

 PARAMETERS:
  steps - The number of steps to solve for each point on initial mode curve
  dt    - The timestep for each step
  t     - (Optional) The initial time value
  pts   - (Optional)The initial mode curve
  limit - (Optional)A limit function used to indicate when to bound the solution.
          The function should take a point and indicate true if the point is
          within the bounds, or false if it is not.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.solve = function(steps, dt, t, pts, limit) {
	var avg_offset = 0;

	if (arguments.length >= 3) {
		// If we are starting a solution, initialize the ODEs and solve.
		this.last_index = this.steps + 1;
		//this.tmin = this.tmax = t;
		this.tmax = t;
		
		// Create a new ODE object for each initial point in pts.
		for (var i=0; i<pts.length; i++) {
			this.odes[i] = new ODE(this.V);
			if (limit) { this.odes[i].setLimit(limit); }
			var soln = this.odes[i].solve(steps, dt, t, pts[i]);
			// If we are calculating backwards in t, some solutions may become invalid, so
			// we set an offset index to let us know how to match up ODE solutions.
			var offset = (dt > 0) ? 0 : steps + 1 - soln.t.length;
			avg_offset += offset*offset;
			this.odes[i].offset = offset;

			// Set tmin or tmax based on the solutions last t value.
			//if (this.tmin > soln.t[0]) this.tmin = soln.t[0];
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
			//if (this.tmin > soln.t[0]) this.tmin = soln.t[0];
			var mx = soln.t.length - 1;
			if (this.tmax < soln.t[mx]) this.tmax = soln.t[mx];
		}
	}
	this.offset_avg = Math.floor(Math.sqrt(avg_offset/this.last_index));
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: getStepIterator
   Iterates through the solution points skipping values as indicated in 'opts'.

 PARAMETERS:
  opts - (Optional) Object with the following input fields
  opts.nCurves - The number of modal or solution curves to extract. Default is 6.
  opts.offset  - The offset to the first index to use.
  opts.totalSteps - The last step to use as a modal curve. The default is the
   number of solve steps.
*/
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
/*
 FUNCTION: getContour
  Get the generalized mode contour.

 PARAMETERS:
  stepn - The ODE step that is associated with the the contour.
 
 RETURNS:
  A contour generated by the contourFactory function that was passed to the
  constructor. The contourFactory function is called as 
  'contourFactory(gmaobj, stepn, contour)', where contour contain the fields
  't' and 'pts' where 't' is a parameter array, and 'pts' are the contour
  points.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getContour = function(stepn) {
	var t = [];
	var pts = [];
	var told = undefined;
	for (var i=0; i<this.odes.length; i++) {
		var stepn1 = stepn - this.odes[i].offset;
		if (stepn1 >=0) {
			this.odes[i].pushPt(stepn1,t,pts);
			if (this.tmin == undefined || t[t.length-1] < this.tmin) {
				this.tmin = t[t.length-1];
			}
		}
	}
	return this.ctrFactory(this, stepn, {t: t, pts: pts});
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: getContours
  Push GMA contours onto an array.

 PARAMETERS:
  arry - An array to push contour values onto using 'arry.push(value)'
  opts - Options used by <GMAmode.getStepIterator>.
*/
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
/*
 FUNCTION: getSolution
  Gets one of the ODE solutions used to calculate the generalized mode evolution.

 PARAMETERS:
  idx - The index of the ODE solution to get.

 RETURNS:
  A value as returned by the solutionFactory. The solution factory is called as
  solutionFactory(gmaobj, stepn, contour) as defined in 
*/
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
/*
 FUNCTION: getSolutions
  Push a set of ODE solutions onto an array.

 PARAMETERS:
  arry - The array to add solutions to using 'arry.push(soln)'
  opts - Options used by <GMAmode.getStepIterator> for selecting the set of
         solutions.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getSolutions = function(arry, opts) {
	opts = opts || {};
	opts.totalSteps = this.odes.length;
	var this_ = this;
	var addplot = function(i, idx, opts) {
		var soln = this_.getSolution(idx); 
		if (soln) arry.unshift(soln);
	}
	var iter = this.getStepIterator(opts);
	iter(addplot);
	// Remove total steps, so that it doesn't affect other plot calls.
	delete opts["totalSteps"];
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: setLimit
  Add a limit function that is used to bound the ODE solution points that are
  retained.

 PARAMETERS:
  limit_func: The limit function to use. This is called as 'limit_func(pt)'
    and should return true if the point is retained, or false if the point
    is discarded.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.setLimit = function(limit_func) {
	for (ode in this.odes) {
		ode.setLimit(limit_func);
	}
}

//-----------------------------------------------------------------------------
/*
 SECTION: Global
   Globally scoped functions

 FUNCTION: defaultFactory
  The default contour or solution factory just returns the object passed in.

 PARAMETERS:
  gmaobj  - The GMAmode object that the contour is associated with.
  stepn   - The index used when getting the modal contour.
  contour - An object with field 't' and 'pts'. Both are arrays of the same size, 
    with 't' being the parameter value, and 'pts' the associated ODE solution points.

 RETURNS:
  This simply returns the contour (or solution) value that is passed in without 
  modification.
*/
//-----------------------------------------------------------------------------
function defaultFactory(gmaobj, stepn, contour) {
	return contour;
}