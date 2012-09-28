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
 opt.ncontours - Number of contours to return from getContours. Initializes
             this.ncontours and this.last_index. (Default: 6)
 opt.contourOffset - The ode index offset to the first contour. Initializes
             this.ctrOffset and this.last_index. (Default: 0)
 opt.contourTotalSteps - The total number of ode steps over the contour range. Initializes this.contourTotalSteps. (Default: this.steps - opt.contourOffset)
 opt.limit - (Optional) A limit function used to indicate when to bound the solution.
             The function should take a point and indicate true if the
             point is within the bounds, or false if it is not.
 opt.contourFactory - (Optional) factory used to process contour objects.
             The function form is 'contourFactory(gmaobj, stepn, contour)'
             where gmaobj is this object, stepn is the stepn is index
             used to get the points, and contour is a object with 'data'
             holding the contour data. 
 opt.solutionFactory - (Optional) factory used to process solutions that are
             returned from getSolution. The function form is 
             'solutionFactory(gmaobj, stepn, contour)'
*/
//-----------------------------------------------------------------------------
function GMAmode(opt) {
	this.V = opt.V;
	this.steps = opt.steps;
	this.ctrFactory = opt.contourFactory || defaultFactory;
	this.solnFactory = opt.solutionFactory || defaultFactory;

	this.odes  = [];
	this.offset_avg = 0;
	this.t = [];

	this.solve(this.steps, opt.dt, opt.t, opt.pts, opt.limit);
	opt.ncontours = opt.ncontours || 6;
	opt.contourOffset = opt.contourOffset || 0;
	opt.contourTotalSteps = opt.contourTotalSteps || (this.steps - opt.contourOffset);
	this.setContourParams(opt);
	// this.tmin and this.tmax set later
}

//-----------------------------------------------------------------------------
/*
FUNCTION: setnContours
 Set the number of contours to retrieve from getContours.

PARAMETERS:
 opt               - Object to hold the parameters. All are optional.
 opt.ncontours     - Number of contours to return from getContours. Initializes
                     this.ncontours and this.last_index.
 opt.contourOffset - The ode index offset to the first contour. Initializes
                     this.ctrOffset and this.last_index.
 opt.contourTotalSteps - The total number of ode steps over the contour range.
                     Initializes this.contourTotalSteps.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.setContourParams = function(opt) {
	var update_last_index = false;
	if (arguments.length == 0) { return; }
	if (opt.ncontours != undefined) { 
		this.ncontours = opt.ncontours;
		update_last_index = true;
	}
	if (opt.contourOffset != undefined) { 
		this.ctrOffset = opt.contourOffset; 
		update_last_index = true;
	}
	if (opt.contourTotalSteps != undefined) {
		this.contourTotalSteps = Math.min(opt.contourTotalSteps, (this.steps - this.ctrOffset));
		update_last_index = true;
	}
	if (update_last_index) {
		if (this.ncontours > 0) {
			var stepsz = Math.floor(this.contourTotalSteps / this.ncontours);
			this.last_index = this.ctrOffset + stepsz*this.ncontours;
		}
	}
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
	this.tinit();
}

//-----------------------------------------------------------------------------
/*
FUNCTION: tinit
 This is called after the odes are solved to set up the t array, which is a
 complete array of timestep values.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.tinit = function() {
	var odes = this.odes;
	if (odes.length < 1) return;
	var t = [];
	t = t.concat(odes[0].t);
	offset = odes[0].offset;
	for (var i=1; i < odes.length; i++) {
		var offseti = odes[i].offset;
		var tendi = offseti + odes[i].t.length;
		if (offseti < offset && tendi >= offset) {
			var temp = odes[i].t.slice(0,offset-offseti);
			t = temp.concat(t);
			offset = offseti;
		}
		
		var tend = offset + t.length;
		if (tendi > tend && offseti <= tend) {
			var offseti = tend - offseti
			t = t.concat(odes[i].t.slice(offseti, odes[i].length));
		}
	}
	this.t = t;
}

//-----------------------------------------------------------------------------
/*
FUNCTION: getStep4t
 Get the step count associated with the time t.

PARAMETERS:
 t - The time we want the timestep for.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getStep4t = function (t) {
	if (this.t.length < 1) return -1;
	if (t < this.t[0]) return -1;
	for (var i=0; i<this.t.length; i++) { if (t < this.t[i]) return i-1; }
	return this.t.length-1;
}

//-----------------------------------------------------------------------------
/*
FUNCTION: getStepIterator
  Iterates through the solution points skipping values as indicated in 'opt'.

PARAMETERS:
 opt - (Optional) Object with the following input fields
 opt.nCurves - The number of modal or solution curves to extract. Default is 6.
 opt.offset  - The offset to the first index to use.
 opt.totalSteps - The last step to use as a modal curve. The default is the
   number of solve steps.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getStepIterator = function (opt) {
	opt = opt || {};
	opt.nCurves = opt.nCurves || 6;
	opt.stepsz = Math.floor(opt.totalSteps/opt.nCurves);
	var nCurves = opt.nCurves;
	var offset = opt.offset;
	var stepsz = opt.stepsz;
	var iter = function(callback) {
		for (var i = 0; i<nCurves; i++) {
			callback(i, offset + i*stepsz, opt);
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
 raw   - Returns the result without passing it through the contourFactory.
 
RETURNS:
 A contour generated by the contourFactory function that was passed to the
 constructor. The contourFactory function is called as 
 'contourFactory(gmaobj, stepn, contour)', where contour contain the fields
 't' and 'pts' where 't' is a parameter array, and 'pts' are the contour
 points.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getContour = function(stepn, raw) {
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
	var data = {t: t, pts: pts};
	if (arguments.length > 1) { if (raw) return data; }
	return this.ctrFactory(this, stepn, data);
}

//-----------------------------------------------------------------------------
/*
FUNCTION: getContours
 Push GMA contours onto an array.

PARAMETERS:
 arry - An array to push contours onto using 'arry.push(value)'
 opt - Options used by <GMAmode.getStepIterator>.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getContours = function(arry, opt) {
	if (arguments.length < 2) { opt = {}; }
	this.setContourParams(opt);
	opt.offset = this.ctrOffset;
	opt.nCurves = this.ncontours;
	opt.totalSteps = this.contourTotalSteps;
	var this_ = this;
	var addplot = function (i, idx, opt) {
		arry.push(this_.getContour(idx));
		opt.idx = idx;
	}
	var iter = this.getStepIterator(opt);
	iter(addplot);
}

//-----------------------------------------------------------------------------
/*
FUNCTION: getSolution
 Gets one of the ODE solutions used to calculate the generalized mode evolution.

PARAMETERS:
 idx - The index of the ODE solution to get.
 raw - Returns the result without passing it through the solutionFactory.

RETURNS:
 A value as returned by the solutionFactory. The solution factory is called as
 solutionFactory(gmaobj, stepn, contour) as defined in 
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getSolution = function(idx, raw) {
	var t = [], pts = [];
	var index1 = Math.max(0, this.ctrOffset - this.odes[idx].offset);
	var index2 = Math.max(0, this.last_index+1 - this.odes[idx].offset);
	if (index2 < 1) return;

	t = this.odes[idx].t.slice(index1, this.last_index+1);
	pts = this.odes[idx].pts.slice(index1, this.last_index+1);
	if (arguments.length > 1) { if (raw) return {t: t, pts: pts}; }
	return this.solnFactory(this, idx, {t: t, pts: pts});
}

//-----------------------------------------------------------------------------
/*
FUNCTION: getSolutions
 Push a set of ODE solutions onto an array.

PARAMETERS:
 arry - The array to add solutions to using 'arry.push(soln)'
 opt  - Options used by <GMAmode.getStepIterator> for selecting the set of
        solutions.
*/
//-----------------------------------------------------------------------------
GMAmode.prototype.getSolutions = function(arry, opt) {
	opt = opt || {};
	opt.offset = opt.offset || 0;
	opt.totalSteps = this.odes.length - opt.offset;
	var this_ = this;
	var addplot = function(i, idx, opt) {
		var soln = this_.getSolution(idx); 
		if (soln) arry.unshift(soln);
	}
	var iter = this.getStepIterator(opt);
	iter(addplot);
	// Remove total steps, so that it doesn't affect other plot calls.
	delete opt["totalSteps"];
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