/*
 * TITLE: Animator classes
 *
 * > Copyright 2012, Lance Larsen
 * > Licensed under the MIT license
 *
 * Uses flot/jquery.flot.js
 */

//-----------------------------------------------------------------------------
/*
 CLASS: Animator
   Stores a list of animated objects and animates them based on a parameter value.

 CONSTRUCTOR: Animator
 
 PARAMETERS:
   canvas - This is a jquery element where the Animated plots will be renedered.
*/
//-----------------------------------------------------------------------------
function Animator(canvas) {
	// An array of 'Animated' objects
	this.animations = new Array();
	// The DOM canvas that animations will be drawn onto
	this.canvas = canvas;
	// Signal used to end the animation
	this.kill_animation = false;
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: addAnimated
  Add an <Animated> object to the list of animations. The <Animated> object
  doesn't need to be derived from the Animated class, but need to have a 
  function 'setParam(param)' and needs to be a 'flot' plotable object (i.e.
  it should contain a 'data' parameter at least).
 
 PARAMETERS:
  anim - An <Animated> object to add to the list
*/
//-----------------------------------------------------------------------------
Animator.prototype.addAnimated = function(anim) {
	this.animations.push(anim);
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: push
  Add an <Animated> object or create and add an <Animated> object from the input. The
  input should be a value compatible with the <Animated> constructor.

 PARAMETERS:
  input - An <Animated> object, or Animated constructor parameter.
*/
//-----------------------------------------------------------------------------
Animator.prototype.push = function(input) {
	if (input.type == "Animated") {
		this.addAnimated(input);
	} else {
		this.addAnimated(new Animated(input));
	}
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: unshift
  Add an <Animated> object or create and add an <Animated> object from the input. The
  input should be a value compatible with the <Animated> constructor. The oject is added
  at the front of the array.

 PARAMETERS:
  input - An <Animated> object, or Animated constructor parameter.
*/
//-----------------------------------------------------------------------------
Animator.prototype.unshift = function(input) {
	if (input.type == "Animated") {
		this.animations.unshift(input);
	} else {
		this.animations.unshift(new Animated(input));
	}
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: kill
  Signal to end the animation.
*/
//-----------------------------------------------------------------------------
Animator.prototype.kill = function() {
	this.kill_animation = true;
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: animate
  Run the animation

 PARAMETERS:
  from - Initial parameter value for animation
  to   - Final parameter value for animation
  time - Approximate time for the animation to run
*/
//-----------------------------------------------------------------------------
Animator.prototype.animate = function(from, to, time) {
	var delay = 50;
	var dp = (to - from)*delay/(time*1000);
	var curr = from-dp;
	var this_ = this;
	// Animation callback
	var doAnim = function() {
		// Kill the animation of the kill signal is set
		if (this_.kill_animation) return;
		curr = curr + dp;
		this_.plot(curr);
		// End the animation if the final value is reached
		if (curr < to) setTimeout(doAnim, delay);
	}
	// Start the animation
	setTimeout(doAnim, delay);
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: plot
  Set the parameter for each of the animations and plot the results.

 PARAMETERS:
  param - The parameter value
*/
//-----------------------------------------------------------------------------
Animator.prototype.plot = function(param) {
	for (i=0; i<this.animations.length; i++) this.animations[i].setParam(param);
	$.plot(this.canvas, this.animations);
}

//-----------------------------------------------------------------------------
/*
 CLASS: Animated
  Plots that support animation.

 CONSTRUCTOR: Animated
  Make a new Animated object

 PARAMETERS:
  plotinfo - An object containing the values used for a plot. Parameters consistent with
   the 'flot' plot command are accepted. The 'data' parameter is required. A 'param'
   field is required as well. The 'param' field should be an array with the same length
   as the 'data' array, and should contain a numeric parameter value associated with the
   associated 'data' array index. The parameter array should be monotonically increasing
   or decreasing.
*/
//-----------------------------------------------------------------------------
function Animated(plotinfo) {
	this.masterdata = plotinfo.data;
	for (key in plotinfo) {
		// Should have 'param' and 'data' in plotinfo keys.
		this[key] = plotinfo[key];
	}
	this.plotinfo = plotinfo;
	this.paramidx   = 0;
	this.type = "Animated";
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: setParam
  Slice the data based on a parameter value.

 PARAMETERS:
  paramval - The parameter value that is used to slice the plot data
*/
//-----------------------------------------------------------------------------
Animated.prototype.setParam = function(paramval) {
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

//-----------------------------------------------------------------------------
/*
SECTION: Global 
  Globally available functions

FUNCTION: typeOf
  An extended 'typeof' operator.

 PARAMETERS:
   value - The value to test the type of.

 RETURNS:
   The value type. The standard types are supported. Array types are checked for, and 'array' is
   returned insteady of 'object'. If an object includes a 'type' field, this value is returned.
*/
//-----------------------------------------------------------------------------
function typeOf(value) {
	var s = typeof value;
	if (s === 'object') {
		if (value) {
			if ("type" in value) return value.type;
			if (Object.prototype.toString.call(value) == '[object Array]') s = 'array';
		} else { s = 'null'; }
	}
	return s;
}
