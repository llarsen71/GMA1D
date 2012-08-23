/*
 * TITLE: Vector Operations
 *
 * Javascript has arrays, but it does not support vector style mathematical 
 * operations such as array addition, scalar multiplication, etc.  This 
 * module includes function to handle some of these vector operations.
 *
 * > Copyright 2012, Lance Larsen
 * > Licensed under the MIT license
 *
 */
//-----------------------------------------------------------------------------
/*
 FUNCTION: SxV
  Scalar times Vector function

 PARAMETERS:
  s - A scalar value to multiply each element of the vector by
  v - The vector

 RETURNS:
  s*v
*/
//-----------------------------------------------------------------------------
function SxV(s,v) {
	var v2 = [];
	for (var i=0; i < v.length; i++) {
		v2[i] = s*v[i];
	}
	return v2
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: SpV
  Scalar plus Vector function

 PARAMETERS:
  s - Scalar value to add to each element in the vector
  v - The vector

 RETURNS:
  v+s
*/
//-----------------------------------------------------------------------------
function SpV(s,v) {
	var v2 = [];
	for (var i=0; i < v.length; i++) {
		v2[i] = s + v[i];
	}
	return v2
}


//-----------------------------------------------------------------------------
/*
 FUNCTION: VpV
  Vector plus Vector function

 PARAMETERS:
  v1 - the first vector to add
  v2 - the second vector to add

 RETURNS:
  v1 + v2
*/
//-----------------------------------------------------------------------------
function VpV(v1,v2)
{
	var v3 = [];
	for (var i=0; i < v1.length && i < v2.length; i++) {
		v3[i] = v1[i]+v2[i];
	}
	return v3;
}

//-----------------------------------------------------------------------------
/*
 FUNCTION: linspace
  linspace creates a new vector with the indicated length. The values are
  either a range of evenly spaced numbers from beginning with xmin and 
  ending with xmax, or the results of calling a callback with each number
  in the range xmin to xmax.

 PARAMETERS:
  xmin     - The minimum value for the range
  xmax     - The maximum value for the range
  length   - The length of the vector to create
  callback - (Optional) A function of the form callback(xval) that takes
             values one at a time in the range xmin to xmax and return
             a value to include in the vector.

 RETURNS:
  the generated vector (i.e. array)
*/
//-----------------------------------------------------------------------------
function linspace(xmin,xmax,length,callback) {
	var hasCallback = (arguments.length > 3);
	var result = [];
	var dx = (xmax-xmin)/(length-1);
	for (var i=0; i<length; i++) {
		var x = xmin + i*dx;
		if (hasCallback) { result[i] = callback(x); }
		else { result[i] = x; }
	}
	return result;
}
