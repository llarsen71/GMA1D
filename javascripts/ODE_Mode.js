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

function GMAMode (V) {
	this.ode   = [];
	this.steps = 0;
	this.V     = V;
}

this.GMAMode.prototype.solve = function(steps, dt, t, pts, limit) {
	if (arguments < 3) {
		// If we are continuing the solution, increment steps
		this.steps += steps;
		odes = this.odes;
		for (var i=0; i < odes.length; i++) { odes[i].solve(steps,dt); }
	} else {
		// If we are starting a solution, initialize the ODEs and solve.
		this.steps = steps;
		this.odes = [];
		for (var i=0; i<pts.length; i++) {
			this.odes[i] = new ODE(this.V);
			if (arguments.length > 4) { this.odes[i].setLimit(limit); }
			this.odes[i].solve(steps, dt, t, pts[i]);
		}
	}
}

this.GMAMode.prototype.getContour = function(stepn) {
	var pts = [];
	for (var i=0; i<this.odes.length; i++) {
		this.odes[i].pushPt(stepn,pts);
	}
	return pts;
}

this.GMAMode.prototype.getContours = function(arry, num, offset) {
	if (arguments.length < 3) offset = 0;
	var step = (this.steps-offset)/num;
	if (step < 1) return;
	for (var i=0; i<num; i++) {
		arry.push({data:this.getContour(offset+i*step)})
	}
	arry.last_step = offset + num*step;
}

this.GMAMode.prototype.getSolution = function(idx) {
	return this.odes[idx].pts;
}

this.GMAMode.prototype.getSolutions = function(arry, nslns, offset) {
	if (arguments.length < 3) offset=0;
	var step = (this.odes.length-offset)/nslns;
	if (step < 1) return;
	for (var i=0; i<nslns; i++) {
		arry.push({data:this.getSolution(offset+i*step)});
	}
}

this.GMAMode.prototype.setLimit = function(limit_func) {
	for (ode in this.odes) {
		ode.setLimit(limit_func);
	}
}
