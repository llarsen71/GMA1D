//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
// Stores a list of animated objects and animates them together.
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
function Animator(canvas) {
	this.animations = new Array();
	this.canvas = canvas;
}

// Add an animated object
Animator.prototype.addAnimated = function(anim) {
	this.animations.push(anim);
}

// 
Animator.prototype.push = function(value) {
	if (value.type == "Animated") {
		this.addAnimated(value);
	} else {
		this.addAnimated(new Animated(value));
	}
}

// Run the animation
Animator.prototype.animate = function(from, to, time) {
	var id;
	var delay = 50;
	var dp = (to - from)*delay/(time*1000);
	var curr = from-dp;
	var animations = this.animations;
	var canvas = this.canvas;
	var f = function() {
		curr = curr + dp;
		for (i=0; i<animations.length; i++) animations[i].setData(curr);
		$.plot(canvas, animations);
		if (curr >= to) clearInterval(id);
	}
	id = setInterval(f, delay);
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
function Animated(plotinfo) {
	this.masterdata = plotinfo.data;
	for (key in plotinfo) {
		// Should have 'param' and 'data' in plotinfo keys.
		this[key] = plotinfo[key];
	}
	this.plotinfo = plotinfo;
	this.paramidx   = 1;
	this.type = "Animated";
}

Animated.prototype.setData = function(paramval) {
	if (!this["param"]) return;
	var pidx = this.paramidx;
	if (this.param[pidx] != paramval) {
		var step = (this.param[pidx] < paramval) ? 1 : -1;
		paramval = paramval*step;
		while(step * this.param[pidx] < paramval) {
			var idx = pidx + step;
			if (idx < 1 || idx >= this.param.length) break;
			this.paramidx = pidx = idx;
		}
	}
	this.data = this.masterdata.slice(0, pidx+1);
}

function AnimatedGMAContourFactory(colors) {
	var i = -1;
	function factory(gmaobj, stepn, contour) {
		i = (i+1)%colors.length;
		var contourPlot = new Animated({param: contour.t, data: contour.pts, color: colors[i%colors.length]});
		return contourPlot;
	}
	return factory;
}
