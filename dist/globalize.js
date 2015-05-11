/**
 * Globalize v1.0.0
 *
 * http://github.com/jquery/globalize
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-05-08T08:12Z
 */
/*!
 * Globalize v1.0.0 2015-05-08T08:12Z Released under the MIT license
 * http://git.io/TrdQbw
 */
(function( root, factory ) {

	// UMD returnExports
	if ( typeof define === "function" && define.amd ) {

		// AMD
		define([
			"cldr",
			"cldr/event"
		], factory );
	} else if ( typeof exports === "object" ) {

		// Node, CommonJS
		module.exports = factory( require( "cldrjs" ) );
	} else {

		// Global
		root.Globalize = factory( root.Cldr );
	}
}( this, function( Cldr ) {


/**
 * calendarForLocale( cldr )
 *
 * - http://www.unicode.org/reports/tr35/#Key_Type_Definitions

 * - http://www.unicode.org/reports/tr35/#u_Extension
 */
var definedCalendars = [ // http://www.unicode.org/repos/cldr/trunk/common/bcp47/calendar.xml
	// part of this data is available in cldr-data/supplemental/calendarData.json, but not all of it
	"buddhist",
	"chinese",
	"coptic",
	"dangi",
	"ethioaa",
	"ethiopic",
	"gregorian",
	"gregory",
	"hebrew",
	"indian",
	"islamic",
	"islamicc",
	"islamic-civil",
	"islamic-rgsa",
	"islamic-tbla",
	"islamic-umalqura",
	"iso8601",
	"japanese",
	"persian",
	"roc"
];

var calendarsCalendarForLocale = function( cldr ) {
	var cal = cldr.attributes[ "u-ca" ];

	if ( cal && definedCalendars.indexOf( cal ) !== -1) {
		if ( cal === "gregory" ) {
			cal = "gregorian";
		}else if (cal === "islamicc") {
			cal = "islamic-civil";
		}
		return cal;
	}

	cal = cldr.get( [ "supplemental/calendarPreferenceData", cldr.attributes.region ] );
	// It might be worth passing in a list of available calendars and returning
	// the first one on both lists.
	// But for now, just return the most preferred
	if (cal) {
		return cal.split( " " )[0];
	}
	// Return the default calendar
	return "gregorian";
};



// a generalized (Globalized?) date. While eras, years and dates are numbers,
// month indices in CLDR are strings (numbers plus a possible modifier)
// There is no concept of month or year order built into CLDR (thus the month after "1" isn't
// necessarily "2", and the year before 1000 isn't necessarily 999.
// Dates are assumed to go in order,
// so the native Date implementation is valid.
// These objects are designed to be immutable.

function Gdate(){}
Gdate.prototype = {
  getEra: function() { return this._era; },
  getYear: function() { return this._year; },
  getMonth: function() { return this._month; },
  getDate: function() { return this._date; },
  nextDate: function( n ) {
    if (arguments.length === 0){
			n = 1;
		}
		// I'm getting errors with new Date(this._d)
		var d = new Date(this._d.getTime());
    d.setDate(this._d.getDate() + n);
    return new this.constructor(d);
  },
	nextYear: undefined, // virtual function
	nextMonth: undefined, // virtual function
  toDate: function() { return new Date( this._d.getTime() ); },
  _init: function( era, year, month, date ) {
    if (era instanceof Date){
      this._setDate(era);
    }else if ( era instanceof Gdate ){
      this._setFields (era.getEra(), era.getYear(), era.getMonth(), era.getDate());
    }else {
      this._setFields (era, year, month, date);
    }
  },
	constructor: Gdate, // allow the new this.constructor idiom
	_setDate: undefined, // virtual function
	_setFields: undefined, // virtual function
  _era: NaN,
  _year: NaN,
  _month: undefined,
  _date: NaN,
  _d: new Date(NaN)
};

var calendarsGdate = Gdate;




function GregorianDate() { this._init.apply(this, arguments); }
GregorianDate.prototype = new Gdate();

GregorianDate.prototype.constructor = GregorianDate;
GregorianDate.prototype.nextYear = function(n) {
  if (arguments.length === 0){
		n = 1;
	}
  var d = new Date(this._d);
  d.setFullYear(this._d.getFullYear() + n);
  this._coerceMonth(d, this._d.getMonth());
  return new GregorianDate(d);
};
GregorianDate.prototype.nextMonth = function(n) {
  if (arguments.length === 0){
		n = 1;
	}
  var d = new Date(this._d);
  d.setMonth(this._d.getMonth() + n);
  this._coerceMonth(d, (this._d.getMonth() + n + 12) % 12);
  return new GregorianDate(d);
};
GregorianDate.prototype._coerceMonth = function(d, m) {
   if (d.getMonth() > m){
    // date was too large; overflowed into the next month
    d.setDate(1);
    d.setMonth(m + 1);
    d.setDate(0); // last day of previous month
  }
};
GregorianDate.prototype._setDate = function(d) {
  this._d = d;
  if (isNaN(d.getTime())){
    this._era = NaN;
    this._year = NaN;
    this._month = undefined;
    this._date = NaN;
  }else {
    this._era = d.getFullYear() < 0 ? 0 : 1;
    this._year = Math.abs(d.getFullYear());
		if (this._era === 0) {
			++this._year; // Date year == -4 corresponds to 5 BCE
		}
    this._month = "" + (d.getMonth() + 1);  // quickie stringify
    this._date = d.getDate();
  }
};
GregorianDate.prototype._setFields = function(era, year, month, date) {
  var d = new Date(), m = parseInt (month, 10) - 1;
  if (era == null){
		era = d.getFullYear() < 0 ? 0 : 1;
	}
  if (year == null){
		year = d.getFullYear();
	}
  if (month == null){
		month = d.getMonth() + 1;
	}
  if (date == null){
		date = d.getDate();
	}
  if (year < 1){
		year = 1;
	}
  if (m < 0){
		m = 0;
	}
  if (m > 11){
		m = 11;
	}
  if (date < 1){
		date = 1;
	}
  // use d to check for valid date's
	year = era === 1 ? year : 1 - year;
  d.setFullYear(year);
  d.setMonth(m);
  d.setDate(date);
  this._coerceMonth(d, m);
  this._setDate(d);
};

var calendarsGregorianDate = GregorianDate;



// convert from Unicode month indicies to algorithmically friendly numbers
var months = [ "8", "9", "10", "11", "12", "13", "1", "2", "3",
	"4", "5", "7", "6", "7-yeartype-leap" ],
	monthsReversed = {};
months.forEach( function( value, i ) { monthsReversed[value] = i; } );

function addDay(d, n){
	var ret = new Date (d.getTime());
	ret.setDate( ret.getDate() + n );
	return ret;
}

function HebrewDate() { this._init.apply(this, arguments); }
HebrewDate.prototype = new Gdate();

HebrewDate.prototype.constructor = HebrewDate;
HebrewDate.prototype.nextYear = function(n) {
  if (arguments.length === 0){
		n = 1;
	}
	return new HebrewDate( this._era, this._year + n, this._month, this._date );
};
HebrewDate.prototype.nextMonth = function(n) {
	var ret,
		hd = heb2civ( this._d ),
		roshchodesh = addDay(this._d, -hd.d + 1),
		//  the min/max() correct for the possibility of other month being too short
		daysinlastmonth = Math.max( civ2heb( addDay( roshchodesh, -1 ) ).daysinmonth, hd.d ),
		nextroshchodesh = addDay( roshchodesh, hd.daysinmonth ),
		daysintonextmonth = Math.min( hd.d, civ2heb( nextroshchodesh ).daysinmonth );
  if (arguments.length === 0){
		n = 1;
	}
	if (n === 0 ){
		return new HebrewDate ( this );
	}else if ( n === 1 ){
		return new HebrewDate( addDay( roshchodesh, hd.daysinmonth + daysintonextmonth - 1 ) );
	}else if ( n === -1 ){
		return new HebrewDate( addDay( this._d, -daysinlastmonth) );
	}else if ( n > 0 ) {
		ret = this.nextMonth( 1 ).nextMonth( n - 1 ); // anything wrong with tail recursion?
	}else /*  n < 0 */ {
		ret = this.nextMonth( -1 ).nextMonth( n + 1 );
	}
	if ( ret._date === this._date ) {
		return ret;
	}
	// have to deal with dates that were coerced too far back by going through short months
	return new HebrewDate ( this._era, ret._year, ret._month, this._date );
};
HebrewDate.prototype._coerceMonth = function( m, y ) {
	var roshchodesh,
		hd = civ2heb( this._d );
	if (hd.m === m && hd.y === y ) {
		return;
	}
	roshchodesh = civ2heb( heb2civ({ y: y, m: m, d:1 }) );
	this._setDate( heb2civ({ y: y, m: m, d: roshchodesh.daysinmonth }) );
};
HebrewDate.prototype._setDate = function(d) {
	var hd = civ2heb( d );
  if ( hd.y < 1 || isNaN(d.getTime()) ){ // no dates before Creation
    this._era = NaN;
    this._year = NaN;
    this._month = undefined;
    this._date = NaN;
		this._d = new Date( NaN );
  }else {
		this._era = 0;
		this._year = hd.y;
		this._month = months[ hd.m ];
		this._date = hd.d;
  }
};
HebrewDate.prototype._setFields = function(era, year, month, date) {
	var m,
		htoday = civ2heb( new Date() );

	era = 0; // only one era
	if ( year == null ) {
		year = htoday.y;
	}else if ( year < 1 ) {
		year = 1;
	}
	if ( month == null ) {
		m = htoday.m;
	}else if ( month in monthsReversed ) {
		m = monthsReversed[month];
	}else {
		this._setDate( new Date(NaN) );
		return;
	}
	if ( date == null ) {
		date = htoday.d;
	}else if ( date < 1 ) {
		date = 1;
	}
	htoday = {
		y: year,
		m: m,
		d: date
	};
	this._setDate( heb2civ( htoday ) );
	this._coerceMonth( m, year );
};

var calendarsHebrewDate = HebrewDate;

function pesach(year) {
	var a, b, c, m,
		mar;	// "day in March" on which Pesach falls

	a = Math.floor( (12 * year + 17) % 19 );
	b = Math.floor( year % 4 );
	m = 32.044093161144 + 1.5542417966212 * a +  b / 4 - 0.0031777940220923 * year;
	if (m < 0) {
		m -= 1;
	}
	mar = Math.floor( m );
	if ( m < 0 ) {
		m++;
	}
	m -= mar;

	c = Math.floor( ( mar + 3 * year + 5 * b + 5 ) % 7);
	if ( c === 0 && a > 11 && m >= 0.89772376543210 ) {
		mar++;
	}else if ( c === 1 && a > 6 && m >= 0.63287037037037 ) {
		mar += 2;
	}else if ( c === 2 || c === 4 || c === 6 ) {
		mar++;
	}

	mar += Math.floor( ( year - 3760 ) / 100 ) - Math.floor( ( year - 3760 ) / 400 ) - 2;
	return mar;
}

function leap(y) {
	return ( ( y % 400 === 0 ) || ( y % 100 !== 0 && y % 4 === 0 ) );
}

// takes a Date object, returns an object with
// { m: hebrewmonth, d: hebrewdate, y: hebrewyear,
//   daysinmonth: number of days in this Hebrew month }
function civ2heb( date ) {
	var days, hy, p, anchor, adarType,
		d = date.getDate(),
		m = date.getMonth() + 1,
		y = date.getFullYear();

	m -= 2;
	if ( m <= 0 ) { // Jan or Feb
		m += 12;
		y -= 1;
	}

	d += Math.floor( 7 * m / 12 + 30 * (m - 1) ); // day in March
	hy = y + 3760;	// get Hebrew year
	p = pesach( hy );
	if (d <= p - 15) { // before 1 Nisan
		anchor = p;
		d += 365;
		if ( leap(y) ) {
			d++;
		}
		y -= 1;
		hy -= 1;
		p = pesach( hy );
	}else {
		anchor = pesach( hy + 1 );
	}

	d -= p - 15;
	anchor -= p - 12;
	y++;
	if ( leap( y ) ){
		anchor++;
	}

	for ( m = 0; m < 11; m++ ) {
		if ( m === 7 && anchor % 30 === 2 ) {
			days = 30; // Cheshvan
		}else if ( m === 8 && anchor % 30 === 0 ) {
			days = 29; // Kislev
		}else {
			days = 30 - m % 2;
		}
		if ( d <= days ) {
			break;
		}
		d -= days;
	}

	adarType = 0;			// plain old Adar
	if ( m === 11 ) {
		days = 29;
	}
	if ( m === 11 && anchor >= 30 ) {
		if (d > 30) {
			adarType = 2;	// Adar 2
			d -= 30;
		}else {
			adarType = 1;	// Adar 1
			days = 30;
		}
	}

	if ( m >= 6 ) {		// Tishrei or after?
		hy++;
	}

	if ( m === 11 ) { // adjust for Adars
		m += adarType;
	}
	return { d: d, m: m, y: hy, daysinmonth: days };
}

// Takes a hebrew date in the object form above and returns a Date object
// Assumes that the months are valid, except for the following:
// Unicode assumes that m===11 becomes m=13 in leap years (plain Adar translates to Adar II).
// In regular years, both m===12 and m===13 become m=11 (Adar I and Adar II translate to Adar).
function heb2civ( h ){
	var d, day, isleap, m, p, yearlength, yeartype;
	// dates through Cheshvan are completely determined by pesach
	if ( h.m < 6 ) {
		return new Date ( h.y - 3760, 2, pesach( h.y ) - 15 + h.d + Math.ceil( h.m * 29.5 ) );
	}
	if ( h.m < 8 ) {
		return new Date ( h.y - 3761, 2, pesach( h.y - 1 ) - 15 + h.d + Math.ceil( h.m * 29.5 ) );
	}
	p = pesach( h.y - 1 );
	yearlength = pesach( h.y ) - p + 365 + ( leap( h.y - 3760 ) ? 1 : 0 );
	yeartype = yearlength % 30 - 24; // -1 is chaser, 0 is ksidrah, +1 is male
	isleap = yearlength > 360;
	m = h.m;
	if ( isleap && m === 11 ) {
		m += 2;
	}else if ( !isleap && m > 11 ) {
		m = 11;
	}
	day = p - 15 + h.d + Math.ceil( m * 29.5 ) + yeartype;
	if (m > 11) {
		day -= 29; // we added an extra month in there (in leap years, there is no plain Adar)
	}
	d = new Date (h.y - 3761, 2, day);
	// if the hebrew date was valid but wrong
	// (Cheshvan or Kislev 30 in a haser year; Adar I 30 in a non-leap year)
	// then move it back a day to the 29th
	// we won't try to correct an actually invalid date
	if ( h.d < 30 || civ2heb( d ).m === m ){
		return d; // it worked
	}
	return new Date (h.y - 3761, 2, day - 1);
}



// Islamic tabular calendar (http://en.wikipedia.org/wiki/Tabular_Islamic_calendar)
// from Keith Wood's https://github.com/kbwood/calendars/blob/master/jquery.calendars.islamic.js
// Used under license
var jdEpoch = 1948439.5,
		daysPerMonth = [ 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29 ];

function IslamicDate() { this._init.apply(this, arguments); }
IslamicDate.prototype = new Gdate();

IslamicDate.prototype.constructor = IslamicDate;
IslamicDate.prototype.nextYear = function(n) {
  if (arguments.length === 0){
		n = 1;
	}
	return new IslamicDate( this._era, this._year + n, this._month, this._date );
};
IslamicDate.prototype.nextMonth = function(n) {
	var id = fromJD( dateToJD( this._d ) ),
		m = id.m + n,
		y = id.y + Math.floor( ( m - 1 ) / 12 );
	m = ( m + 11 ) % 12 + 1;
	return new IslamicDate( this._era, y, m, id.d );
};
IslamicDate.prototype._coerceMonth = function( m, y ) {
	var id = fromJD( dateToJD( this._d ) );
	if (id.m === m && id.y === y ) {
		return;
	}
	this._setDate( jdToDate( toJD( y, m, daysInMonth( y, m ) ) ) );
};
IslamicDate.prototype._setDate = function(d) {
	var id = fromJD( dateToJD( d ) );
  if ( id.y < 1 || isNaN(d.getTime()) ){ // no dates before Epoch
    this._era = NaN;
    this._year = NaN;
    this._month = undefined;
    this._date = NaN;
		this._d = new Date( NaN );
  }else {
		this._era = 0;
		this._year = id.y;
		this._month = "" + id.m;
		this._date = id.d;
  }
};
IslamicDate.prototype._setFields = function(era, year, month, date) {
	var m = parseInt (month, 10),
		itoday = fromJD( dateToJD( new Date() ) );

	era = 0; // only one era
	if ( year == null ) {
		year = itoday.y;
	}else if ( year < 1 ) {
		year = 1;
	}
	if ( month == null ) {
		m = itoday.m;
	}else if ( m < 1 ) {
		m = 1;
	}else if ( m > 12 ){
		m = 12;
	}
	if ( date == null ) {
		date = itoday.d;
	}else if ( date < 1 ) {
		date = 1;
	}
	this._setDate( jdToDate( toJD( year, m, date ) ) );
	this._coerceMonth( m, year );
};

var calendarsIslamicDate = IslamicDate;

function leapYear ( year ) {
	return ( year * 11 + 14) % 30 < 11;
}

function daysInMonth ( year, month ) {
	return daysPerMonth[ month - 1 ] +
		( month === 12 && leapYear( year ) ? 1 : 0 );
}

// Retrieve the Julian date equivalent for this date,
//	i.e. days since January 1, 4713 BCE Greenwich noon.
function toJD ( year, month, day ) {
	return day + Math.ceil( 29.5 * (month - 1) ) + ( year - 1 ) * 354 +
		Math.floor( 3 + (11 * year ) / 30 + jdEpoch - 1 );
}

function fromJD ( jd ) {
	var month, year, day;
	jd = Math.floor( jd ) + 0.5;
	year = Math.floor( (30 * ( jd - jdEpoch ) + 10646 ) / 10631 );
	year = (year <= 0 ? year - 1 : year);
	month = Math.min( 12, Math.ceil( ( jd - 29 - toJD( year, 1, 1 ) ) / 29.5 ) + 1 );
	day = jd - toJD( year, month, 1 ) + 1;
	return { y: year, m: month, d: day };
}

function dateToJD (d) {
	var a, b,
		year = d.getFullYear(),
		month = d.getMonth(),
		date = d.getDate();
	// Jean Meeus algorithm, "Astronomical Algorithms", 1991
	if (month < 2) {
		month += 12;
		year--;
	}
	a = Math.floor( year / 100 );
	b = 2 - a + Math.floor( a / 4 );
	return Math.floor( 365.25 * ( year + 4716 )) +
		Math.floor(30.6001 * ( month + 2 ) ) + date + b - 1524.5;
}

function jdToDate ( jd ){
	var b, c, d, e, day, month, year, date,
		z = Math.floor( jd + 0.5 ),
		a = Math.floor( ( z - 1867216.25 ) / 36524.25 );
	a = z + 1 + a - Math.floor( a / 4 );
	b = a + 1524;
	c = Math.floor( ( b - 122.1 ) / 365.25);
	d = Math.floor( 365.25 * c );
	e = Math.floor( ( b - d ) / 30.6001);
	day = b - d - Math.floor( e * 30.6001 );
	month = e - ( e > 13.5 ? 14 : 2 );
	year = c - ( month > 1.5 ? 4716 : 4715 );
	date = new Date( year, month, day );
	date.setFullYear( year ); // deal with Y2K bug
	return date;
}




/**
 * A toString method that outputs meaningful values for objects or arrays and
 * still performs as fast as a plain string in case variable is string, or as
 * fast as `"" + number` in case variable is a number.
 * Ref: http://jsperf.com/my-stringify
 */
var toString = function( variable ) {
	return typeof variable === "string" ? variable : ( typeof variable === "number" ? "" +
		variable : JSON.stringify( variable ) );
};




/**
 * formatMessage( message, data )
 *
 * @message [String] A message with optional {vars} to be replaced.
 *
 * @data [Array or JSON] Object with replacing-variables content.
 *
 * Return the formatted message. For example:
 *
 * - formatMessage( "{0} second", [ 1 ] ); // 1 second
 *
 * - formatMessage( "{0}/{1}", ["m", "s"] ); // m/s
 *
 * - formatMessage( "{name} <{email}>", {
 *     name: "Foo",
 *     email: "bar@baz.qux"
 *   }); // Foo <bar@baz.qux>
 */
var formatMessage = function( message, data ) {

	// Replace {attribute}'s
	message = message.replace( /{[0-9a-zA-Z-_. ]+}/g, function( name ) {
		name = name.replace( /^{([^}]*)}$/, "$1" );
		return toString( data[ name ] );
	});

	return message;
};




var objectExtend = function() {
	var destination = arguments[ 0 ],
		sources = [].slice.call( arguments, 1 );

	sources.forEach(function( source ) {
		var prop;
		for ( prop in source ) {
			destination[ prop ] = source[ prop ];
		}
	});

	return destination;
};




var createError = function( code, message, attributes ) {
	var error;

	message = code + ( message ? ": " + formatMessage( message, attributes ) : "" );
	error = new Error( message );
	error.code = code;

	objectExtend( error, attributes );

	return error;
};




var validate = function( code, message, check, attributes ) {
	if ( !check ) {
		throw createError( code, message, attributes );
	}
};




var alwaysArray = function( stringOrArray ) {
	return Array.isArray( stringOrArray ) ? stringOrArray : stringOrArray ? [ stringOrArray ] : [];
};




var validateCldr = function( path, value, options ) {
	var skipBoolean;
	options = options || {};

	skipBoolean = alwaysArray( options.skip ).some(function( pathRe ) {
		return pathRe.test( path );
	});

	validate( "E_MISSING_CLDR", "Missing required CLDR content `{path}`.", value || skipBoolean, {
		path: path
	});
};




var validateDefaultLocale = function( value ) {
	validate( "E_DEFAULT_LOCALE_NOT_DEFINED", "Default locale has not been defined.",
		value !== undefined, {} );
};




var validateParameterPresence = function( value, name ) {
	validate( "E_MISSING_PARAMETER", "Missing required parameter `{name}`.",
		value !== undefined, { name: name });
};




/**
 * range( value, name, minimum, maximum )
 *
 * @value [Number].
 *
 * @name [String] name of variable.
 *
 * @minimum [Number]. The lowest valid value, inclusive.
 *
 * @maximum [Number]. The greatest valid value, inclusive.
 */
var validateParameterRange = function( value, name, minimum, maximum ) {
	validate(
		"E_PAR_OUT_OF_RANGE",
		"Parameter `{name}` has value `{value}` out of range [{minimum}, {maximum}].",
		value === undefined || value >= minimum && value <= maximum,
		{
			maximum: maximum,
			minimum: minimum,
			name: name,
			value: value
		}
	);
};




var validateParameterType = function( value, name, check, expected ) {
	validate(
		"E_INVALID_PAR_TYPE",
		"Invalid `{name}` parameter ({value}). {expected} expected.",
		check,
		{
			expected: expected,
			name: name,
			value: value
		}
	);
};




var validateParameterTypeLocale = function( value, name ) {
	validateParameterType(
		value,
		name,
		value === undefined || typeof value === "string" || value instanceof Cldr,
		"String or Cldr instance"
	);
};




/**
 * Function inspired by jQuery Core, but reduced to our use case.
 */
var isPlainObject = function( obj ) {
	return obj !== null && "" + obj === "[object Object]";
};




var validateParameterTypePlainObject = function( value, name ) {
	validateParameterType(
		value,
		name,
		value === undefined || isPlainObject( value ),
		"Plain Object"
	);
};




var alwaysCldr = function( localeOrCldr ) {
	return localeOrCldr instanceof Cldr ? localeOrCldr : new Cldr( localeOrCldr );
};




// ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions?redirectlocale=en-US&redirectslug=JavaScript%2FGuide%2FRegular_Expressions
var regexpEscape = function( string ) {
	return string.replace( /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1" );
};




var stringPad = function( str, count, right ) {
	var length;
	if ( typeof str !== "string" ) {
		str = String( str );
	}
	for ( length = str.length; length < count; length += 1 ) {
		str = ( right ? ( str + "0" ) : ( "0" + str ) );
	}
	return str;
};




function validateLikelySubtags( cldr ) {
	cldr.once( "get", validateCldr );
	cldr.get( "supplemental/likelySubtags" );
}

function setLocale ( object, locale ){
	var calendar;
	validateParameterPresence( locale, "locale" );
	validateParameterTypeLocale( locale, "locale" );
	object.cldr = alwaysCldr( locale );
	calendar = calendarsCalendarForLocale( object.cldr );
	validateParameterType ( calendar, "calendar",
		calendar in Globalize.calendars, "a defined calendar system" );
	object.cldr.attributes.calendar = calendar;
	validateLikelySubtags( object.cldr );
}

/**
 * [new] Globalize( locale|cldr )
 *
 * @locale [String]
 *
 * @cldr [Cldr instance]
 *
 * Create a Globalize instance.
 */
function Globalize( locale ) {
	if ( !( this instanceof Globalize ) ) {
		return new Globalize( locale );
	}

	setLocale( this, locale );
}

/**
 * Globalize.load( json, ... )
 *
 * @json [JSON]
 *
 * Load resolved or unresolved cldr data.
 * Somewhat equivalent to previous Globalize.addCultureInfo(...).
 */
Globalize.load = function() {
	// validations are delegated to Cldr.load().
	Cldr.load.apply( Cldr, arguments );
};

/**
 * Globalize.locale( [locale|cldr] )
 *
 * @locale [String]
 *
 * @cldr [Cldr instance]
 *
 * Set default Cldr instance if locale or cldr argument is passed.
 *
 * Return the default Cldr instance.
 */
Globalize.locale = function( locale ) {

	validateParameterTypeLocale( locale, "locale" );

	if ( arguments.length ) {
		setLocale( this, locale );
	}
	return this.cldr;
};

/**
 * Optimization to avoid duplicating some internal functions across modules.
 */
Globalize._alwaysArray = alwaysArray;
Globalize._createError = createError;
Globalize._formatMessage = formatMessage;
Globalize._isPlainObject = isPlainObject;
Globalize._objectExtend = objectExtend;
Globalize._regexpEscape = regexpEscape;
Globalize._stringPad = stringPad;
Globalize._validate = validate;
Globalize._validateCldr = validateCldr;
Globalize._validateDefaultLocale = validateDefaultLocale;
Globalize._validateParameterPresence = validateParameterPresence;
Globalize._validateParameterRange = validateParameterRange;
Globalize._validateParameterTypePlainObject = validateParameterTypePlainObject;
Globalize._validateParameterType = validateParameterType;
Globalize._Gdate = calendarsGdate;

Globalize.calendars = {
  gregorian: calendarsGregorianDate,
  hebrew: calendarsHebrewDate,
  islamic: calendarsIslamicDate // question: is this the same as islamic-civil?
};

return Globalize;




}));
