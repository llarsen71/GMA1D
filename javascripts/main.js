// Scalar times Vector function
function SxV(s,v)
{
	var v2 = [];
	for (var i=0; i < v.length; i++)
	{
		v2[i] = s*v[i];
	}
	return v2
}

// Vector plut Vector function
function VpV(v1,v2)
{
	var v3 = [];
	for (var i=0; i < v1.length && i < v2.length; i++)
	{
		v3[i] = v1[i]+v2[i];
	}
	return v3;
}

// Solve 1 ODE step using the Runge-Kutta 4 algorithm
function ode_rk4(f, dt, t, pt)
{
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
	
	var result = {t:t+dt, pt: v};
	return result
}

// Solve an ODE using the given number of steps.
function solve_ode(f, dt, t, pt, steps)
{
	var ts  = [];
	var pts = [];
	
	for (var i=0; i < steps; i++)
	{
		var v = ode_rk4(f, dt, t, pt);
		t  = ts[i]  = v.t;
		pt = pts[i] = v.pt;
	}
	
	var result = {t:ts, pt:pts};
	return result;
}

function GMA_Mode(f)
{
	var gma =
	{
		solutions: [],
		
		steps: 0,
		
		solve: function(dt, t, pts, steps)
		{
			this.steps = steps;
			
			for (var i=0; i < pts.length; i++)
			{
				this.solutions[i] = solve_ode(f, dt, t, pts[i], steps);
			}
		},
		
		getRing: function(stepn)
		{
			var pts = [];
			for (var i=0; j<this.solution.length; j++)
			{
				pts[i] = this.solution[j].pt[stepn];
			}
			
			return pts;
		}
	}
	
	return gma
}