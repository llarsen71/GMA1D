/*
 * TITLE: ODE Solver
 *
 * > Copyright 2012, Lance Larsen
 * > Licensed under the MIT license
 *
 * Uses vector.js
 */
  
//-----------------------------------------------------------------------------
/*
 CLASS: ODE 

 The ode class is used to solve a system of ordinary differential equations. 
 The ODE is expected to be provided to the constuctor in vector field form.
 Take the following ODE for example:
   >  x''' - x'' + 2*x' - 3*x = sin(t)         (1)
 This can be written in first order form, by assigning a new variable for
 all but the highest order derivative: 
   >  x' = y                                   (2)
   >  y' = z  (i.e. x'' = z)
 Note that the higest order derivative can then be replaced with a first
 order derivative (z' = x'''). If we substitute (2) and z' into (1) and solve
 for z' (i.e. x''') we get:
   >  z' = z - 2*y + 3*x + sin(t)              (3)

 If we combine the equations from (2) and (3) we now have a system of
 equations in first order form.
   >  x' = y
   >  y' = z
   >  z' = z - 2*y + 3*x + sin(t)
     
 This can be represented as a vector or an array.
   >  [x',y',z'] = [y, z, z-2*y+3*x+sin(t)]    (4)

 To use the ODE class, a javascript function needs to be created that 
 replicates a first order vector field such as equation (4) above. The 
 javascript function takes the independent derivative variable as a first
 value (if we assume x' = dx/dt then t is our independent variable), and the
 array of dependent variables (in this case [x,y,z]) as the second term. Here
 is an example function.

 > var V = function(t, pt) {
 >    var x = pt[0], y= pt[1], z = pt[2];
 >    return [y, z, z - 2*y + 3*x + sin(t)];
 > }
 >
 > var ode_ = ODE(V);
*/
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
/*
 CONSTRUCTOR: ODE

 PARAMETERS:
  V - The ODE in vector field form V(t,pt) where t is the derivative variable, and 
      pt is a current initial or solution point. V should return the ODE 
      vector feild value at the point 'pt'
*/
//-----------------------------------------------------------------------------

function ODE(V) {
	// Array of time values
	this.t   = [];
	// Array of solution points
	this.pts = [];
	// The ODE in vector field form
	this.V   = V;
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: step
  The ODE step function adds one step to the ODE solution based on the given  dt.

 PARAMETERS:
  dt - The time step size

 RETURNS:
  true if a point was added, or false if it was not. A point is not
  added if any of the vector values is NaN. In addition, if the ODE has a 
  function named 'limit', this will be called with the new point that is
  calculated. If the 'limit' function returns false, the point is not added
  and false is returned from this function.
*/
//-----------------------------------------------------------------------------

ODE.prototype.step = function(dt) {
	var t  = (dt<0) ? this.t[0] : this.t[this.t.length-1];
	var pt = (dt<0) ? this.pts[0] : this.pts[this.pts.length-1];
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
	if (dt < 0) {
		this.t.unshift(t+dt);
		this.pts.unshift(pt);
	} else {
		this.t.push(t+dt);
		this.pts.push(pt);
	}
	return true;
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: solve
  The function calculate an ODE solution.

 PARAMETERS:
  steps - The number of ODE steps to take.
  dt    - The step size.
  t     - (Optional) The initial time. If 'solve' has already been called
          once, it can be called again to extend the solution, and this
          value is not needed.
  pt    - (Optional) The initial point. Only needed for initial call to solve.
 
 RETURNS:
  An object literal containing 't', which is an array of time values,
  and 'pts', which is the solution point associated with each time in 't'.
*/
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
	else if (this.t.length == 0) {
		alert("initial conditions are needed for first call to 'solve'");
	}

	// Solve the ODE
	for (var i=0; i < steps; i++) {
		if (!this.step(dt)) break;
	}

	return {t: this.t, pts: this.pts}
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: pushPt
  This appends value at 'stepn'.

 PARAMETERS:
  stepn - The step to take values from
  t     - The t array to push t to.
  pts   - The pts array to push a point to.
*/
//-----------------------------------------------------------------------------
ODE.prototype.pushPt = function(stepn, t, pts) {
	if (this.pts.length > stepn) {
		t.push(this.t[stepn]);
		pts.push(this.pts[stepn]);
	}
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: setLimit
  Adds a limit function to the ODE.

 PARAMETERS:
 limit_func - The function will be called as limit_func(pt), where 'pt' is
  the next solution point. The function should return true if the point is 
  within the acceptable solution bounds, or false if it is outside the bounds.
*/
//-----------------------------------------------------------------------------
ODE.prototype.setLimit = function(limit_func) {
	this.limit = limit_func;
}
