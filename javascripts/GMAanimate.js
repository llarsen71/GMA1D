/*
 * TITLE:  GMA Animation
 *  Functions and classes used to animation the Generalized 1-D mode.
 * 
 * > Copyright 2012, Lance Larsen
 * > Licensed under the MIT license
 *
 * Uses Animate.js
 */
 
//----------------------------------------------------------------------------
/*
 SECTION: Global
  Globally accessible functions.

 FUNCTION: AnimatedGMAPlotFactory 
  This generates a factory function that is used by the <GMAmode> object.

 PARAMETERS:
  colors - An array of colors, or an object with a 'next' function that returns
           the next plot color to use each time 'next' is called.

 RETURNS:
  A factory function is returned that is called as
    > factory(gmaobj, stepn, contour)
  where 'gmaobj' is a <GMAmode> object, 'stepn' is the index used to get the
  contour, and 'contour' is an object with field 't' and 'pts'. Both are arrays
  of the same size, with 't' being the parameter value, and 'pts' the associated
  ODE solution points.
*/
 //----------------------------------------------------------------------------
function AnimatedGMAPlotFactory(colors) {
	var i = -1;
	var clrs = wrapColorsArray(colors);
	function factory(gmaobj, paramval, contour) {
		var contourPlot = new Animated({param: contour.t, data: contour.pts, color: clrs.next()});
		return contourPlot;
	}
	return factory;
}
 
//----------------------------------------------------------------------------
/*
 FUNCTION: wrapColorsArray
  Makes a colors array into an object with 'next' if needed.

 PARAMETERS:
  colors - An array of colors, or an object with a 'next' function that
           returns the next color each time next is called.

 RETURNS:
  If an array of colors is passed to <AnimatedGMAPlotFactory>
  this will return a new object that wraps the array and includes a 'next'
  function that is used to loop through the colors.
*/
//----------------------------------------------------------------------------
function wrapColorsArray(colors) {
	if (typeOf(colors) == 'array') {
		var i = -1;
		function next() { 
			i = (i+1)%this.length;
			return colors[i];
		}
		return {next: next};
	}
	return colors;
}

//----------------------------------------------------------------------------
/*
 CLASS: ColorSwitcher
  This class allows you to switch the color set that is used to plot
  animation curves. Color sets are passed to the constructor along with the
  name of the initial set.

 CONSTRUCTOR: ColorSwitcher
  Creates a new ColorSwitcher object.

 PARAMETERS:
  colorSets - An object with all the colors sets, which are arrays with
    different color values defined (such as {myclrs:["#edc240",...]})
  initialSet - The name of the initial set of colors to use.
*/
//----------------------------------------------------------------------------
function ColorSwitcher(colorSets, initialSet) {
	// colorSets = An object containing the different color sets.
	this.colorSets = colorSets;
	// type = The name of the color set that is currently used
	this.type = initialSet;
	// colors = The current color set being used
	this.colors = this.colorSets[initialSet];
	// idx = The index of the last color used in the color set
	this.idx = -1;
}

ColorSwitcher.prototype.setColorSet = function(type) {
	this.type = type;
	this.colors = this.colorSets[type];
	this.resetIndex();
}

ColorSwitcher.prototype.resetIndex = function(idx) {
	if (!idx) idx = -1;
	this.idx = idx;
}

ColorSwitcher.prototype.next = function() {
	this.idx = (this.idx+1)%this.colors.length;
	return this.colors[this.idx];
}
