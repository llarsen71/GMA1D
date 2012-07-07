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

			// Increment the index
			this.n += 1;
			// Add a new time value and the new ODE solution point.
			this.t[this.n]   = t+dt;
			this.pts[this.n] = v;
		},

		solve: function(steps, dt, t, pt)
		{
			// Do initialization
			this.dt = dt
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
			for (var i=0; i < steps; i++) { this.step(dt); }

			return {t: this.t, pts: this.pts}
		},

		pushPt: function(stepn, vector)
		{
			vector.push(this.pts[stepn]);
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

		solve: function(steps, dt, t, pts)
		{
			if (arguments < 3) 
			{
				// If we are continuing the solution, increment steps
				this.steps += steps;
				for (var i=0; i<pts.length; i++) { this.odes[i].solve(steps,dt); }
			}
			else 
			{
				// If we are starting a solution, initialize the ODEs and solve.
				this.steps = steps;
				this.odes = [];
				for (var i=0; i<pts.length; i++) 
				{
					this.odes[i] = ODE(f);
					this.odes[i].solve(steps, dt, t, pts[i]);
				}
			}
		},

		getRing: function(stepn)
		{
			var pts = [];
			for (var i=0; i<this.odes.length; i++)
			{
				this.odes[i].pushPt(stepn,pts);
			}
			return pts;
		}
	}

	return gma
}
