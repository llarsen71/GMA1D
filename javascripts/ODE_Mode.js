function ODE(f)
{
	var ode_rk4 = 
	{
		t:   [], // Time values
		pts: [], // Solution points
		n:   -1, // Next step index

		step: function(dt) // Take one step in the ODE. Add to t and pts.
		{
			var t  = this.t[this.n];
			var pt = this.pts[this.n];

			//k1 = dt*f(t,pt)
			var k1 = SxV(dt, f(t,pt));
			// dt*f(t+0.5*dt, pt+0.5*k1)
			var k2 = SxV(dt, f(t+0.5*dt, VpV(pt, SxV(0.5, k1))));
			// k3 = dt*f(t+0.5*dt,pt+0.5*k2)
			var k3 = SxV(dt, f(t+0.5*dt, VpV(pt, SxV(0.5, k2))));
			// k4 = dt*f(t+dt,pt+k3)
			var k4 = SxV(dt, f(t+0.5*dt, VpV(pt, k3)));
			// v = pt + (k1+2.0*(k2+k3)+k4)/6.0
			var v = VpV(pt, SxV(1.0/6.0, VpV(k1,SxV(2,VpV(k2,k3)),k4)));

			for (n in v) { if (isNaN(n)) {return false;}}
			if ("limit" in this)
			{
				if (typeof this.limit === "function")
				{
					if (!this.limit(v)) { return false;} 
				}
			}

			// Increment the index
			this.n += 1;
			// Add a new time value and the new ODE solution point.
			this.t[this.n]   = t+dt;
			this.pts[this.n] = v;
			return true;
		},

		solve: function(steps, dt, t, pt)
		{
			// Do initialization
			this.dt = dt;
			// Set initial conditions if they are passed in.
			if (arguments.length > 2)
			{
				this.t   = [t];
				this.pts = [pt];
				this.n   = 0;
			}
			else if (this.n === -1)
			{
				alert("initial conditions are needed for first call to 'solve'");
			}

			// Solve the ODE
			for (var i=0; i < steps; i++)
			{
				if (!this.step(dt)) { break; }
			}

			return {t: this.t, pts: this.pts}
		},

		pushPt: function(stepn, vector)
		{
			if (this.pts.length > stepn) vector.push(this.pts[stepn]);
		},

		setLimit: function(limit_func)
		{
			this.limit = limit_func;
		}
	}

	return ode_rk4;
}

function GMA_Mode(f)
{
	var gma =
	{
		odes:  [], // Set of ode solvers
		steps:  0, // Solution steps

		solve: function(steps, dt, t, pts, limit)
		{
			if (arguments < 3) 
			{
				// If we are continuing the solution, increment steps
				this.steps += steps;
				odes = this.odes;
				for (var i=0; i < odes.length; i++) { odes[i].solve(steps,dt); }
			}
			else 
			{
				// If we are starting a solution, initialize the ODEs and solve.
				this.steps = steps;
				this.odes = [];
				for (var i=0; i<pts.length; i++) 
				{
					this.odes[i] = ODE(f);
					if (arguments.length > 4) { this.odes[i].setLimit(limit); }
					this.odes[i].solve(steps, dt, t, pts[i]);
				}
			}
		},

		getContour: function(stepn)
		{
			var pts = [];
			for (var i=0; i<this.odes.length; i++)
			{
				this.odes[i].pushPt(stepn,pts);
			}
			return pts;
		},

		getContours: function(arry, num, offset)
		{
			if (arguments.length < 3) offset = 0;
			var step = (this.steps-offset)/num;
			if (step < 1) return;
			for (var i=0; i<num; i++)
			{
				arry.push({data:this.getContour(offset+i*step)})
			}
			arry.last_step = offset + num*step;
		},

		getSolution: function(idx)
		{
			return this.odes[idx].pts;
		},

		getSolutions: function(arry, nslns, offset)
		{
			if (arguments.length < 3) offset=0;
			var step = (this.odes.length-offset)/nslns;
			if (step < 1) return;
			for (var i=0; i<nslns; i++)
			{
				arry.push({data:this.getSolution(offset+i*step)});
			}
		},

		setLimit: function(limit_func)
		{
			for (ode in this.odes)
			{
				ode.setLimit(limit_func);
			}
		}
	}

	return gma
}
