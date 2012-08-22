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

function typeOf(value) {
	var s = typeof value;
	if (s === 'object') {
		if (value) {
			if (Object.prototype.toString.call(value) == '[object Array]') s = 'array';
		} else { s = 'null'; }
	}
	return s;
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
function wrapColorsArray(colors) {
	if (typeOf(colors) == 'array') {
		var i = -1;
		function next() { 
			i = (i+1)%this.length;
			return colors[i];
		}
		return next;
	}
	return colors;
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
function ColorSwitcher(colorSets, initialSet) {
	this.colorSets = colorSets;
	this.colors = this.colorSets[initialSet];
	this.idx = -1;
}

ColorSwitcher.prototype.setColorSet = function(type) {
	this.colors = this.colorSets[type];
	this.resetIndex();
}

ColorSwitcher.prototype.resetIndex = function(idx) {
	if (!idx) idx = -1;
	this.idx = idx;
}

// next is the function that should be passed in to AnimatedGMAPlotFactory.
// This is called to interate through the colors in the current colorSet.
ColorSwitcher.prototype.next = function() {
	this.idx = (this.idx+1)%this.colors.length;
	return this.colors[this.idx];
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
function AnimatedGMAPlotFactory(colors) {
	var i = -1;
	var nextClr = wrapColorsArray(colors);
	function factory(gmaobj, stepn, contour) {
		var contourPlot = new Animated({param: contour.t, data: contour.pts, color: nextClr()});
		return contourPlot;
	}
	return factory;
}
