/*
 * Animation of the GMA plot values.
 *
 * Copyright 2012, Lance Larsen
 * Licensed under the MIT license
 *
 * Uses Animate.js
 */

//----------------------------------------------------------------------------
// AnimatedGMAPlotFactory 
//----------------------------------------------------------------------------
function AnimatedGMAPlotFactory(colors) {
	var i = -1;
	var clrs = wrapColorsArray(colors);
	function factory(gmaobj, stepn, contour) {
		var contourPlot = new Animated({param: contour.t, data: contour.pts, color: clrs.next()});
		return contourPlot;
	}
	return factory;
}
 
//----------------------------------------------------------------------------
// wrapColorsArray - If an array of colors is passed to AnimatedGMAPlotFactory
// this will return a new object that wraps the array and includes a 'next'
// function that is used to loop through the colors.
//
// Inputs:
//   colors - An array of colors, or an object with a 'next' function that
//            returns the next color each time next is called.
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
//----------------------------------------------------------------------------
// ColorSwitcher Class
//
// This class allows you to switch the color set that is used to plot
// animation curves. Color sets are passed to the constructor along with the
// name of the initial set.
//
// Inputs:
//    colorSets: An object with all the colors sets, which are arrays with
//               different color values defined (such as {myclrs:["#edc240",...]})
//    initialSet: The name of the initial set of colors to use.
//----------------------------------------------------------------------------
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
