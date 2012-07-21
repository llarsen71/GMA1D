//-----------------------------------------------------
// ODE Class
//-----------------------------------------------------

function ODE(V) {
	this.t   = [];
	this.pts = [];
	this.n   = -1;
	this.V   = V;
}

// Take one step in the ODE. Add to t and pts.
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

ODE.prototype.pushPt = function(stepn, vector) {
	if (this.pts.length > stepn) vector.push(this.pts[stepn]);
}

ODE.prototype.setLimit = function(limit_func) {
	this.limit = limit_func;
}

//-----------------------------------------------------
// GMAMode Class
//-----------------------------------------------------
function GMAMode (V, steps, dt, t, pts, limit) {
	this.V = V;
	this.odes  = [];
	this.steps = steps;
	this.first_index = 0;
	this.solve(steps, dt, t, pts, limit);
}

GMAMode.prototype.solve = function(steps, dt, t, pts, limit) {
	if (arguments.length >= 4) {
		// If we are starting a solution, initialize the ODEs and solve.
		this.last_index = this.steps + 1;
		// Create a new old for each initial point in pts.
		for (var i=0; i<pts.length; i++) {
			this.odes[i] = new ODE(this.V);
			if (limit) { this.odes[i].setLimit(limit); }
			this.odes[i].solve(steps, dt, t, pts[i]);
		}
	}
	else {
		// If we are continuing the solution, add append the new number of steps.
		this.steps += steps;
		this.last_index = this.steps + 1;
		odes = this.odes;
		for (var i=0; i < odes.length; i++) { odes[i].solve(steps,dt); }
	}
}

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

GMAMode.prototype.getContour = function(stepn) {
	var pts = [];
	for (var i=0; i<this.odes.length; i++) {
		this.odes[i].pushPt(stepn,pts);
	}
	return pts;
}

GMAMode.prototype.getContours = function(arry, opts) {
	colors = ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"];
	var this_ = this;
	var addplot = function (i, idx, opts) {
		arry.push({data:this_.getContour(idx),color:colors[i%colors.length]});
		opts.idx = idx;
	}
	var iter = this.getStepIterator(opts);
	iter(addplot);
	this.first_index = opts.offset;
	this.nCurves = opts.nContours;
	this.last_index = opts.idx;
}

GMAMode.prototype.getSolution = function(idx) {
	return this.odes[idx].pts.slice(this.first_index, this.last_index);
}

GMAMode.prototype.getSolutions = function(arry, opts) {
	opts = opts || {};
	opts.totalSteps = this.odes.length;
	var colorType = (opts.useGrey) ? "grey" : "range";
	colorOpts = {range:[ "#9440ed", "#4da74d", "#cb4b4b", "#afd8f8", "#edc240"],
	              grey:["#bbbbbb"]};
	colors = colorOpts[colorType];
	var this_ = this;
	var addplot = function(i,idx,opts) {
		arry.push({data:this_.getSolution(idx), color:colors[i%colors.length]});
	}
	var iter = this.getStepIterator(opts);
	iter(addplot);
	// Remove total steps, so that it doesn't affect other plot calls.
	delete opts["totalSteps"];
}

GMAMode.prototype.setLimit = function(limit_func) {
	for (ode in this.odes) {
		ode.setLimit(limit_func);
	}
}
