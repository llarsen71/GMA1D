// Duffing oscillator
function DuffingEqn(eps, c)
{
	var Duffing = function(t,v)
	{
		var v2 = [];
		v2[0] =  v[1];
		v2[1] = -2*c*v[1]-v[0]-eps*Math.pow(v[0],3);
		return v2;
	}
	return Duffing;
}

// Van Der Pol oscillator
function VanDerPolEqn(c)
{
	var VanDerPol = function(t,v)
	{
		pt = [v[1], c*(1-v[0]*v[0])*v[1] - v[0]];
		return pt;
	}
	return VanDerPol;
}

function Ellipse(a,excentricity,angle)
{
	var ellips = function(t)
	{
		var pt  = [a*Math.cos(t),a*excentricity*Math.sin(t)];
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		var pt2 = [pt[0]*c+pt[1]*s,-pt[0]*s+pt[1]*c];
		return pt2;
	}
	return ellips;
}

function DuffingPlot(canvas)
{
	var g = Ellipse(0.5, 1.2, -Math.PI/4.5);
	var pts = linspace(0.0,2*Math.PI,60,g)
	
	var f = DuffingEqn(0.05, 0.2);
	gma = GMA_Mode(f);
	var steps = 500;
	gma.solve(steps, -0.05, 1.0, pts);

	var rings = 20;
	var dn = Math.floor(steps/rings);
	var plots = []
	for (var i=0; i<rings; i++)
	{
		plots[i] = {data:gma.getRing(i*dn)}
	}
	var plot = $.plot($(canvas), plots);
}

function VanDerPolPlot(canvas)
{
	// First get the limit cycle.
	var vdp = VanDerPolEqn(0.2);
	// Start with a point on the limit cycle.
	var x = [2.0113107,0.0509031224];
	// take the number of steps that closes the loop.
	var v = ODE(vdp).solve(113, 0.0673, 1.0, x);
	// Structure to store the plots.
	var plots2 = [];

	v.scale = function(sf)
	{
		var pts = [];
		for (var i=0; i<this.pts.length; i++)
		{
			pts[i] = SxV(sf,this.pts[i]);
		}
		return pts;
	}

	var pts = v.scale(1.01);
	//var plot = $.plot($(canvas), [{data:v.pts}]);

	var gma2  = GMA_Mode(vdp);
	var steps = 600;
	var limit = function(v)
	{
		for (var i=0; i<v.length; i++)
		{
			if (Math.abs(v[i]) > 50.0) return false;
		}
		return true;
	}
	gma2.solve(steps, -0.05, 1.0, pts, limit);

	var rings = 10;
	var dn = Math.floor(steps/rings);
	for (var i=0; i<rings; i++)
	{
		plots2[i] = {data:gma2.getRing(i*dn)}
	}

	var initialring = Ellipse(0.1, 1.2, Math.PI/4.5);
	var cirpts = linspace(0.0,2*Math.PI,60,initialring);

	steps = 1000;
	rings = 6;
	gma2.solve(steps, 0.05, 1.0, cirpts);
	dn = Math.floor(steps/rings);
	for (var i=0; i<rings; i++)
	{
		plots2.push({data:gma2.getRing(i*dn)});
	}

	// Include the limit cycle
	plots2.push({data:v.pts,lines:{lineWidth: 3.0}});
	var plot = jQuery.plot($(canvas), plots2);
}
