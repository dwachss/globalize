/**
 * Globalize v1.0.0
 *
 * http://github.com/jquery/globalize
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-05-19T21:04Z
 */
/*!
 * Globalize v1.0.0 2015-05-19T21:04Z Released under the MIT license
 * http://git.io/TrdQbw
 */
(function( root, factory ) {

	// UMD returnExports
	if ( typeof define === "function" && define.amd ) {

		// AMD
		define([
			"cldr",
			"../globalize",
			"./number",
			"cldr/event",
			"cldr/supplemental"
		], factory );
	} else if ( typeof exports === "object" ) {

		// Node, CommonJS
		module.exports = factory( require( "cldrjs" ), require( "globalize" ) );
	} else {

		// Extend global
		factory( root.Cldr, root.Globalize );
	}
}(this, function( Cldr, Globalize ) {

var createError = Globalize._createError,
	createErrorUnsupportedFeature = Globalize._createErrorUnsupportedFeature,
	formatMessage = Globalize._formatMessage,
	numberSymbol = Globalize._numberSymbol,
	regexpEscape = Globalize._regexpEscape,
	stringPad = Globalize._stringPad,
	validateCldr = Globalize._validateCldr,
	validateDefaultLocale = Globalize._validateDefaultLocale,
	validateParameterPresence = Globalize._validateParameterPresence,
	validateParameterType = Globalize._validateParameterType,
	validateParameterTypePlainObject = Globalize._validateParameterTypePlainObject,
	validateParameterTypeString = Globalize._validateParameterTypeString;


var validateParameterTypeDate = function( value, name ) {
	validateParameterType( value, name, value === undefined || value instanceof Date, "Date" );
};




var createErrorInvalidParameterValue = function( name, value ) {
	return createError( "E_INVALID_PAR_VALUE", "Invalid `{name}` value ({value}).", {
		name: name,
		value: value
	});
};


// Should this be part of cldrjs?


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

var gdateCalendarForLocale = function( cldr ) {
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




/**
 * expandPattern( options, cldr )
 *
 * @options [Object] if String, it's considered a skeleton. Object accepts:
 * - skeleton: [String] lookup availableFormat;
 * - date: [String] ( "full" | "long" | "medium" | "short" );
 * - time: [String] ( "full" | "long" | "medium" | "short" );
 * - datetime: [String] ( "full" | "long" | "medium" | "short" );
 * - raw: [String] For more info see datetime/format.js.
 *
 * @cldr [Cldr instance].
 *
 * Return the corresponding pattern.
 * Eg for "en":
 * - "GyMMMd" returns "MMM d, y G";
 * - { skeleton: "GyMMMd" } returns "MMM d, y G";
 * - { date: "full" } returns "EEEE, MMMM d, y";
 * - { time: "full" } returns "h:mm:ss a zzzz";
 * - { datetime: "full" } returns "EEEE, MMMM d, y 'at' h:mm:ss a zzzz";
 * - { raw: "dd/mm" } returns "dd/mm";
 */

var dateExpandPattern = function( options, cldr ) {
	var dateSkeleton, result, skeleton, timeSkeleton, type,
		calendar = gdateCalendarForLocale( cldr );

	function combineDateTime( type, datePattern, timePattern ) {
		return formatMessage(
			cldr.main([
				"dates/calendars",
				calendar,
				"dateTimeFormats",
				type
			]),
			[ timePattern, datePattern ]
		);
	}

	switch ( true ) {
		case "skeleton" in options:
			skeleton = options.skeleton;
			result = cldr.main([
				"dates/calendars",
				calendar,
				"dateTimeFormats/availableFormats",
				skeleton
			]);
			if ( !result ) {
				timeSkeleton = skeleton.split( /[^hHKkmsSAzZOvVXx]/ ).slice( -1 )[ 0 ];
				dateSkeleton = skeleton.split( /[^GyYuUrQqMLlwWdDFgEec]/ )[ 0 ];
				if ( /(MMMM|LLLL).*[Ec]/.test( dateSkeleton ) ) {
					type = "full";
				} else if ( /MMMM/g.test( dateSkeleton ) ) {
					type = "long";
				} else if ( /MMM/g.test( dateSkeleton ) || /LLL/g.test( dateSkeleton ) ) {
					type = "medium";
				} else {
					type = "short";
				}
				result = combineDateTime( type,
					cldr.main([
						"dates/calendars",
						calendar,
						"dateTimeFormats/availableFormats",
						dateSkeleton
					]),
					cldr.main([
						"dates/calendars",
						calendar,
						"dateTimeFormats/availableFormats",
						timeSkeleton
					])
				);
			}
			break;

		case "date" in options:
		case "time" in options:
			result = cldr.main([
				"dates/calendars",
				calendar,
				"date" in options ? "dateFormats" : "timeFormats",
				( options.date || options.time )
			]);
			break;

		case "datetime" in options:
			result = combineDateTime( options.datetime,
				cldr.main([ "dates/calendars", calendar, "dateFormats", options.datetime ]),
				cldr.main([ "dates/calendars", calendar, "timeFormats", options.datetime ])
			);
			break;

		case "raw" in options:
			result = options.raw;
			break;

		default:
			throw createErrorInvalidParameterValue({
				name: "options",
				value: options
			});
	}

	return result;
};




/**
 * dayOfWeek( date, firstDay )
 *
 * @date
 *
 * @firstDay the result of `dateFirstDayOfWeek( cldr )`
 *
 * Return the day of the week normalized by the territory's firstDay [0-6].
 * Eg for "mon":
 * - return 0 if territory is GB, or BR, or DE, or FR (week starts on "mon");
 * - return 1 if territory is US (week starts on "sun");
 * - return 2 if territory is EG (week starts on "sat");
 */
var dateDayOfWeek = function( date, firstDay ) {
	return ( date.getDay() - firstDay + 7 ) % 7;
};




/**
 * distanceInDays( from, to )
 *
 * Return the distance in days between from and to Dates.
 */
var dateDistanceInDays = function( from, to ) {
	var inDays = 864e5;
	return ( to.getTime() - from.getTime() ) / inDays;
};




/**
 * dayOfYear
 *
 * Return the distance in days of the globalized date to the beginning of the year [0-d].
 */
var dateDayOfYear = function( gdate ) {
  var date = gdate.toDate();
	return Math.round( dateDistanceInDays( gdate.startOfYear().toDate(), date ) );
};




var dateWeekDays = [ "sun", "mon", "tue", "wed", "thu", "fri", "sat" ];




/**
 * firstDayOfWeek
 */
var dateFirstDayOfWeek = function( cldr ) {
	return dateWeekDays.indexOf( cldr.supplemental.weekData.firstDay() );
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
	startOfMonth: function() {
		return this.nextDate( 1 - this._date );
	},
	startOfYear: function() {
    // no choice but to go through each month one at a time
		var thisMonth = this,
			lastMonth = thisMonth.nextMonth(-1);
   while ( lastMonth.getYear() === thisMonth._year ){
      thisMonth = lastMonth;
			lastMonth = thisMonth.nextMonth(-1);
    }
		return thisMonth.startOfMonth();
  },
  toDate: function() {
		// we need to make sure that an arbitrary time doesn't leak through
		var d = new Date( this._d.getFullYear(), this._d.getMonth(), this._d.getDate(),
			0, 0, 0, 0 );
		d.setFullYear( this._d.getFullYear() ); // deal with Y2K bug in Javascript
		return d;
	},
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

Gdate.calendars = {}; // this will store the calendar algorithms (the Gdate subclass constructors)

var gdateGdate = Gdate;

window.Gdate = Gdate;


/**
 * startOf changes the input to the beginning of the given unit.
 *
 * For example, starting at the start of a day, resets hours, minutes
 * seconds and milliseconds to 0. Starting at the month does the same, but
 * also sets the date to 1.
 *
 * calendar is the name of the calendar system, to determine what a "year" and "month" are
 *
 * Returns the modified date
 */
var dateStartOf = function( date, unit, calendar ) {
	if ( unit === "year" ){
		date = new gdateGdate.calendars[ calendar ]( date ).startOfYear().toDate();
	} else if ( unit === "month" ){
		date = new gdateGdate.calendars[ calendar ]( date ).startOfMonth().toDate();
	} else {
		date = new Date( date.getTime() );
	}
	switch ( unit ) {
		case "year":
		case "month":
		case "day":
			date.setHours( 0 );
		/* falls through */
		case "hour":
			date.setMinutes( 0 );
		/* falls through */
		case "minute":
			date.setSeconds( 0 );
		/* falls through */
		case "second":
			date.setMilliseconds( 0 );
	}
	return date;
};




/**
 * millisecondsInDay
 */
var dateMillisecondsInDay = function( date ) {
	// TODO Handle daylight savings discontinuities
	return date - dateStartOf( date, "day" );
};




var datePatternRe = (/([a-z])\1*|'([^']|'')+'|''|./ig);




/**
 * hourFormat( date, format, timeSeparator, formatNumber )
 *
 * Return date's timezone offset according to the format passed.
 * Eg for format when timezone offset is 180:
 * - "+H;-H": -3
 * - "+HHmm;-HHmm": -0300
 * - "+HH:mm;-HH:mm": -03:00
 */
var dateTimezoneHourFormat = function( date, format, timeSeparator, formatNumber ) {
	var absOffset,
		offset = date.getTimezoneOffset();

	absOffset = Math.abs( offset );
	formatNumber = formatNumber || {
		1: function( value ) {
			return stringPad( value, 1 );
		},
		2: function( value ) {
			return stringPad( value, 2 );
		}
	};

	return format

		// Pick the correct sign side (+ or -).
		.split( ";" )[ offset > 0 ? 1 : 0 ]

		// Localize time separator
		.replace( ":", timeSeparator )

		// Update hours offset.
		.replace( /HH?/, function( match ) {
			return formatNumber[ match.length ]( Math.floor( absOffset / 60 ) );
		})

		// Update minutes offset and return.
		.replace( /mm/, function() {
			return formatNumber[ 2 ]( absOffset % 60 );
		});
};




/**
 * format( date, properties )
 *
 * @date [Date instance].
 *
 * @properties
 *
 * Disclosure: this function borrows excerpts of dojo/date/locale.
 */
var dateFormat = function( date, numberFormatters, properties ) {
	var timeSeparator = properties.timeSeparator,
		gdate = new Gdate.calendars[ properties.calendar ]( date );

	return properties.pattern.replace( datePatternRe, function( current ) {
		var ret,
			chr = current.charAt( 0 ),
			length = current.length;

		if ( chr === "j" ) {
			// Locale preferred hHKk.
			// http://www.unicode.org/reports/tr35/tr35-dates.html#Time_Data
			chr = properties.preferredTime;
		}

		if ( chr === "Z" ) {
			// Z..ZZZ: same as "xxxx".
			if ( length < 4 ) {
				chr = "x";
				length = 4;

			// ZZZZ: same as "OOOO".
			} else if ( length < 5 ) {
				chr = "O";
				length = 4;

			// ZZZZZ: same as "XXXXX"
			} else {
				chr = "X";
				length = 5;
			}
		}

		switch ( chr ) {

			// Era
			case "G":
				ret = properties.eras[ gdate.getEra() ];
				break;

			// Year
			case "y":
				// Plain year.
				// The length specifies the padding, but for two letters it also specifies the
				// maximum length.
				ret = gdate.getYear();
				if ( length === 2 ) {
					ret = String( ret );
					ret = +ret.substr( ret.length - 2 );
				}
				break;

			case "Y":
				// Year in "Week of Year"
				// The length specifies the padding, but for two letters it also specifies the
				// maximum length.
				// yearInWeekofYear = date + DaysInAWeek - (dayOfWeek - firstDay) - minDays
				ret = new Date( date.getTime() );
				ret.setDate(
					ret.getDate() + 7 -
					dateDayOfWeek( date, properties.firstDay ) -
					properties.firstDay -
					properties.minDays
				);
				ret = (new Gdate.calendars[ properties.calendar ]( ret )).getYear();
				if ( length === 2 ) {
					ret = String( ret );
					ret = +ret.substr( ret.length - 2 );
				}
				break;

			// Quarter
			case "Q":
			case "q":
        // TODO: figure out how to make gdate handle this.
				// We may have to have a Gdate.prototype.getQuarter
				ret = Math.ceil( ( date.getMonth() + 1 ) / 3 ); //
				if ( length > 2 ) {
					ret = properties.quarters[ chr ][ length ][ ret ];
				}
				break;

			// Month
			case "M":
			case "L":
				ret = gdate.getMonth();
				if ( length > 2 ) {
					ret = properties.months[ chr ][ length ][ ret ];
				}else {
          ret = parseInt(ret, 10); // month number
        }
				break;

			// Week
			case "w":
				// Week of Year.
				// woy = ceil( ( doy + dow of 1/1 ) / 7 ) - minDaysStuff ? 1 : 0.
				// TODO should pad on ww? Not documented, but I guess so.
				ret = dateDayOfWeek( gdate.startOfYear().toDate(), properties.firstDay );
				ret = Math.ceil( ( dateDayOfYear( gdate ) + ret ) / 7 ) -
					( 7 - ret >= properties.minDays ? 0 : 1 );
				break;

			case "W":
				// Week of Month.
				// wom = ceil( ( dom + dow of `1/month` ) / 7 ) - minDaysStuff ? 1 : 0.
				ret = dateDayOfWeek( gdate.startOfMonth().toDate(), properties.firstDay );
				ret = Math.ceil( ( date.getDate() + ret ) / 7 ) -
					( 7 - ret >= properties.minDays ? 0 : 1 );
				break;

			// Day
			case "d":
				ret = gdate.getDate();
				break;

			case "D":
				ret = dateDayOfYear( gdate ) + 1;
				break;

			case "F":
				// Day of Week in month. eg. 2nd Wed in July.
				ret = Math.floor( gdate.getDate() / 7 ) + 1;
				break;

			// Week day
			case "e":
			case "c":
				if ( length <= 2 ) {
					// Range is [1-7] (deduced by example provided on documentation)
					// TODO Should pad with zeros (not specified in the docs)?
					ret = dateDayOfWeek( date, properties.firstDay ) + 1;
					break;
				}

			/* falls through */
			case "E":
				ret = dateWeekDays[ date.getDay() ];
				ret = properties.days[ chr ][ length ][ ret ];
				break;

			// Period (AM or PM)
			case "a":
				ret = properties.dayPeriods[ date.getHours() < 12 ? "am" : "pm" ];
				break;

			// Hour
			case "h": // 1-12
				ret = ( date.getHours() % 12 ) || 12;
				break;

			case "H": // 0-23
				ret = date.getHours();
				break;

			case "K": // 0-11
				ret = date.getHours() % 12;
				break;

			case "k": // 1-24
				ret = date.getHours() || 24;
				break;

			// Minute
			case "m":
				ret = date.getMinutes();
				break;

			// Second
			case "s":
				ret = date.getSeconds();
				break;

			case "S":
				ret = Math.round( date.getMilliseconds() * Math.pow( 10, length - 3 ) );
				break;

			case "A":
				ret = Math.round( dateMillisecondsInDay( date ) * Math.pow( 10, length - 3 ) );
				break;

			// Zone
			case "z":
			case "O":
				// O: "{gmtFormat}+H;{gmtFormat}-H" or "{gmtZeroFormat}", eg. "GMT-8" or "GMT".
				// OOOO: "{gmtFormat}{hourFormat}" or "{gmtZeroFormat}", eg. "GMT-08:00" or "GMT".
				if ( date.getTimezoneOffset() === 0 ) {
					ret = properties.gmtZeroFormat;
				} else {
					ret = dateTimezoneHourFormat(
						date,
						length < 4 ? "+H;-H" : properties.tzLongHourFormat,
						timeSeparator,
						numberFormatters
					);
					ret = properties.gmtFormat.replace( /\{0\}/, ret );
				}
				break;

			case "X":
				// Same as x*, except it uses "Z" for zero offset.
				if ( date.getTimezoneOffset() === 0 ) {
					ret = "Z";
					break;
				}

			/* falls through */
			case "x":
				// x: hourFormat("+HH;-HH")
				// xx or xxxx: hourFormat("+HHmm;-HHmm")
				// xxx or xxxxx: hourFormat("+HH:mm;-HH:mm")
				ret = length === 1 ? "+HH;-HH" : ( length % 2 ? "+HH:mm;-HH:mm" : "+HHmm;-HHmm" );
				ret = dateTimezoneHourFormat( date, ret, ":" );
				break;

			// timeSeparator
			case ":":
				ret = timeSeparator;
				break;

			// ' literals.
			case "'":
				current = current.replace( /''/, "'" );
				if ( length > 2 ) {
					current = current.slice( 1, -1 );
				}
				ret = current;
				break;

			// Anything else is considered a literal, including [ ,:/.@#], chinese, japanese, and
			// arabic characters.
			default:
				ret = current;
		}
		if ( typeof ret === "number" ) {
			ret = numberFormatters[ length ]( ret );
		}
		return ret;
	});
};




/**
 * properties( pattern, cldr )
 *
 * @pattern [String] raw pattern.
 * ref: http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Format_Patterns
 *
 * @cldr [Cldr instance].
 *
 * Return the properties given the pattern and cldr.
 *
 */
var dateFormatProperties = function( pattern, cldr ) {
	var properties = {
			pattern: pattern,
			timeSeparator: numberSymbol( "timeSeparator", cldr ),
			calendar: gdateCalendarForLocale( cldr )
		},
		widths = [ "abbreviated", "wide", "narrow" ];

	function setNumberFormatterPattern( pad ) {
		if ( !properties.numberFormatters ) {
			properties.numberFormatters = {};
		}
		properties.numberFormatters[ pad ] = stringPad( "", pad );
	}

	pattern.replace( datePatternRe, function( current ) {
		var formatNumber,
			chr = current.charAt( 0 ),
			length = current.length;

		if ( chr === "j" ) {
			// Locale preferred hHKk.
			// http://www.unicode.org/reports/tr35/tr35-dates.html#Time_Data
			properties.preferredTime = chr = cldr.supplemental.timeData.preferred();
		}

		// ZZZZ: same as "OOOO".
		if ( chr === "Z" && length === 4 ) {
			chr = "O";
			length = 4;
		}

		switch ( chr ) {

			// Era
			case "G":
				properties.eras = cldr.main([
					"dates/calendars",
					properties.calendar,
					"eras",
					length <= 3 ? "eraAbbr" : ( length === 4 ? "eraNames" : "eraNarrow" )
				]);
				break;

			// Year
			case "y":
				// Plain year.
				formatNumber = true;
				break;

			case "Y":
				// Year in "Week of Year"
				properties.firstDay = dateFirstDayOfWeek( cldr );
				properties.minDays = cldr.supplemental.weekData.minDays();
				formatNumber = true;
				break;

			case "u": // Extended year. Need to be implemented.
			case "U": // Cyclic year name. Need to be implemented.
				throw createErrorUnsupportedFeature({
					feature: "year pattern `" + chr + "`"
				});

			// Quarter
			case "Q":
			case "q":
				if ( length > 2 ) {
					if ( !properties.quarters ) {
						properties.quarters = {};
					}
					if ( !properties.quarters[ chr ] ) {
						properties.quarters[ chr ] = {};
					}
					properties.quarters[ chr ][ length ] = cldr.main([
						"dates/calendars",
						properties.calendar,
						"quarters",
						chr === "Q" ? "format" : "stand-alone",
						widths[ length - 3 ]
					]);
				} else {
					formatNumber = true;
				}
				break;

			// Month
			case "M":
			case "L":
				if ( length > 2 ) {
					if ( !properties.months ) {
						properties.months = {};
					}
					if ( !properties.months[ chr ] ) {
						properties.months[ chr ] = {};
					}
					properties.months[ chr ][ length ] = cldr.main([
						"dates/calendars",
						properties.calendar,
						"months",
						chr === "M" ? "format" : "stand-alone",
						widths[ length - 3 ]
					]);
				} else {
					formatNumber = true;
				}
				break;

			// Week - Week of Year (w) or Week of Month (W).
			case "w":
			case "W":
				properties.firstDay = dateFirstDayOfWeek( cldr );
				properties.minDays = cldr.supplemental.weekData.minDays();
				formatNumber = true;
				break;

			// Day
			case "d":
			case "D":
			case "F":
				formatNumber = true;
				break;

			case "g":
				// Modified Julian day. Need to be implemented.
				throw createErrorUnsupportedFeature({
					feature: "Julian day pattern `g`"
				});

			// Week day
			case "e":
			case "c":
				if ( length <= 2 ) {
					properties.firstDay = dateFirstDayOfWeek( cldr );
					formatNumber = true;
					break;
				}

			/* falls through */
			case "E":
				if ( !properties.days ) {
					properties.days = {};
				}
				if ( !properties.days[ chr ] ) {
					properties.days[ chr ] = {};
				}
				if ( length === 6 ) {

					// If short day names are not explicitly specified, abbreviated day names are
					// used instead.
					// http://www.unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
					// http://unicode.org/cldr/trac/ticket/6790
					properties.days[ chr ][ length ] = cldr.main([
							"dates/calendars",
							properties.calendar,
							"days",
							chr === "c" ? "stand-alone" : "format",
							"short"
						]) || cldr.main([
							"dates/calendars",
							properties.calendar,
							"days",
							chr === "c" ? "stand-alone" : "format",
							"abbreviated"
						]);
				} else {
					properties.days[ chr ][ length ] = cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						chr === "c" ? "stand-alone" : "format",
						widths[ length < 3 ? 0 : length - 3 ]
					]);
				}
				break;

			// Period (AM or PM)
			case "a":
				properties.dayPeriods = cldr.main([
					"dates/calendars",
					properties.calendar,
					"dayPeriods/format/wide"
				]);
				break;

			// Hour
			case "h": // 1-12
			case "H": // 0-23
			case "K": // 0-11
			case "k": // 1-24

			// Minute
			case "m":

			// Second
			case "s":
			case "S":
			case "A":
				formatNumber = true;
				break;

			// Zone
			case "z":
			case "O":
				// O: "{gmtFormat}+H;{gmtFormat}-H" or "{gmtZeroFormat}", eg. "GMT-8" or "GMT".
				// OOOO: "{gmtFormat}{hourFormat}" or "{gmtZeroFormat}", eg. "GMT-08:00" or "GMT".
				properties.gmtFormat = cldr.main( "dates/timeZoneNames/gmtFormat" );
				properties.gmtZeroFormat = cldr.main( "dates/timeZoneNames/gmtZeroFormat" );
				properties.tzLongHourFormat = cldr.main( "dates/timeZoneNames/hourFormat" );

			/* falls through */
			case "Z":
			case "X":
			case "x":
				setNumberFormatterPattern( 1 );
				setNumberFormatterPattern( 2 );
				break;

			case "v":
			case "V":
				throw createErrorUnsupportedFeature({
					feature: "timezone pattern `" + chr + "`"
				});
		}

		if ( formatNumber ) {
			setNumberFormatterPattern( length );
		}
	});

	return properties;
};




var outOfRange = function( value, low, high ) {
	return value < low || value > high;
};




function GregorianDate() { this._init.apply(this, arguments); }
GregorianDate.prototype = new Gdate();

GregorianDate.prototype.constructor = Gdate.calendars.gregorian = GregorianDate;
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
  var d = new Date(this._d.getTime());
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

HebrewDate.prototype.constructor = Gdate.calendars.hebrew = HebrewDate;
HebrewDate.prototype.nextYear = function(n) {
  if (arguments.length === 0){
		n = 1;
	}
	return new HebrewDate( this._era, this._year + n, this._month, this._date );
};
HebrewDate.prototype.nextMonth = function(n) {
	var ret,
		hd = civ2heb( this._d ),
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
		this._d = d;
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

IslamicDate.prototype.constructor = Gdate.calendars.islamic = IslamicDate;
IslamicDate.prototype.nextYear = function(n) {
  if (arguments.length === 0){
		n = 1;
	}
	return new IslamicDate( this._era, this._year + n, this._month, this._date );
};
IslamicDate.prototype.nextMonth = function(n) {
	var id = fromJD( dateToJD( this._d ) ), m, y;
  if (arguments.length === 0){
		n = 1;
	}
	m = id.m + n;
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
		this._d = d;
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
		Math.floor( ( 3 + 11 * year ) / 30 ) + jdEpoch - 1;
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
 * parse( value, tokens, properties )
 *
 * @value [String] string date.
 *
 * @tokens [Object] tokens returned by date/tokenizer.
 *
 * @properties [Object] output returned by date/tokenizer-properties.
 *
 * ref: http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Format_Patterns
 */
var dateParse = function( value, tokens, properties ) {
	var amPm, day, daysOfYear, era, hour, hour12, month, timezoneOffset, valid, year,
		YEAR = 0,
		MONTH = 1,
		DAY = 2,
		HOUR = 3,
		MINUTE = 4,
		SECOND = 5,
		MILLISECONDS = 6,
		date = new Date(),
		gdate = new Gdate.calendars[ properties.calendar ]( date ),
		truncateAt = [],
		units = [ "year", "month", "day", "hour", "minute", "second", "milliseconds" ];

	if ( !tokens.length ) {
		return null;
	}

	valid = tokens.every(function( token ) {
		var century, chr, value, length;

		if ( token.type === "literal" ) {
			// continue
			return true;
		}

		chr = token.type.charAt( 0 );
		length = token.type.length;

		if ( chr === "j" ) {
			// Locale preferred hHKk.
			// http://www.unicode.org/reports/tr35/tr35-dates.html#Time_Data
			chr = properties.preferredTimeData;
		}

		switch ( chr ) {

			// Era
			case "G":
				truncateAt.push( YEAR );
				era = +token.value;
				break;

			// Year
			case "y":
				value = token.value;
				if ( length === 2 ) {
					if ( outOfRange( value, 0, 99 ) ) {
						return false;
					}
					// mimic dojo/date/locale: choose century to apply, according to a sliding
					// window of 80 years before and 20 years after present year.
					century = Math.floor( date.getFullYear() / 100 ) * 100;
					value += century;
					if ( value > date.getFullYear() + 20 ) {
						value -= 100;
					}
				}
				year = value;
				truncateAt.push( YEAR );
				break;

			case "Y": // Year in "Week of Year"
				throw createErrorUnsupportedFeature({
					feature: "year pattern `" + chr + "`"
				});

			// Quarter (skip)
			case "Q":
			case "q":
				break;

			// Month
			case "M":
			case "L":
				month = "" + token.value;
				truncateAt.push( MONTH );
				break;

			// Week (skip)
			case "w": // Week of Year.
			case "W": // Week of Month.
				break;

			// Day
			case "d":
				day = token.value;
				truncateAt.push( DAY );
				break;

			case "D":
				daysOfYear = token.value;
				truncateAt.push( DAY );
				break;

			case "F":
				// Day of Week in month. eg. 2nd Wed in July.
				// Skip
				break;

			// Week day
			case "e":
			case "c":
			case "E":
				// Skip.
				// value = arrayIndexOf( dateWeekDays, token.value );
				break;

			// Period (AM or PM)
			case "a":
				amPm = token.value;
				break;

			// Hour
			case "h": // 1-12
				value = token.value;
				if ( outOfRange( value, 1, 12 ) ) {
					return false;
				}
				hour = hour12 = true;
				date.setHours( value === 12 ? 0 : value );
				truncateAt.push( HOUR );
				break;

			case "K": // 0-11
				value = token.value;
				if ( outOfRange( value, 0, 11 ) ) {
					return false;
				}
				hour = hour12 = true;
				date.setHours( value );
				truncateAt.push( HOUR );
				break;

			case "k": // 1-24
				value = token.value;
				if ( outOfRange( value, 1, 24 ) ) {
					return false;
				}
				hour = true;
				date.setHours( value === 24 ? 0 : value );
				truncateAt.push( HOUR );
				break;

			case "H": // 0-23
				value = token.value;
				if ( outOfRange( value, 0, 23 ) ) {
					return false;
				}
				hour = true;
				date.setHours( value );
				truncateAt.push( HOUR );
				break;

			// Minute
			case "m":
				value = token.value;
				if ( outOfRange( value, 0, 59 ) ) {
					return false;
				}
				date.setMinutes( value );
				truncateAt.push( MINUTE );
				break;

			// Second
			case "s":
				value = token.value;
				if ( outOfRange( value, 0, 59 ) ) {
					return false;
				}
				date.setSeconds( value );
				truncateAt.push( SECOND );
				break;

			case "A":
				date.setHours( 0 );
				date.setMinutes( 0 );
				date.setSeconds( 0 );

			/* falls through */
			case "S":
				value = Math.round( token.value * Math.pow( 10, 3 - length ) );
				date.setMilliseconds( value );
				truncateAt.push( MILLISECONDS );
				break;

			// Zone
			case "Z":
			case "z":
			case "O":
			case "X":
			case "x":
				timezoneOffset = token.value - date.getTimezoneOffset();
				break;
		}

		return true;
	});

	if ( !valid ) {
		return null;
	}

	// 12-hour format needs AM or PM, 24-hour format doesn't, ie. return null
	// if amPm && !hour12 || !amPm && hour12.
	if ( hour && !( !amPm ^ hour12 ) ) {
		return null;
	}

	if ( hour12 && amPm === "pm" ) {
		date.setHours( date.getHours() + 12 );
	}

	// Unspecified units use today's values and
	// truncate date at the most precise unit defined. Eg.
	// If value is "12/31", and pattern is "MM/dd":
	// => new Gdate( <current era>, <current Year>, 12, 31, 0, 0, 0, 0 );
	if ( era == null ) {
		era = gdate.getEra();
	}
	if ( year == null ) {
		year = gdate.getYear();
	}
	if ( daysOfYear !== undefined ) {
		gdate = new Gdate.calendars[ properties.calendar ]( era, year, gdate.getMonth(), 1 );
		gdate = gdate.startOfYear().nextDate( daysOfYear - 1);
		if ( gdate.getYear() !== year ) {
			return null;
		}
	}
	if ( month == null ) {
		month = gdate.getMonth();
	}
	if ( day == null ) {
		day = gdate.getDate();
	}
	gdate = new Gdate.calendars[ properties.calendar ]( era, year, month, day );
	if ( gdate.getMonth() !== month || gdate.getDate() !== day ) {
		// Question: do we really need to do this check,
		// or can we rely on Gdate to correct out-of-bounds values?
		// Question: when should this return null and when false?
		return null;
	}
	date.setFullYear( gdate.toDate().getFullYear() );
	date.setMonth( gdate.toDate().getMonth() );
	date.setDate( gdate.toDate().getDate() );
	truncateAt = Math.max.apply( null, truncateAt );
	date = dateStartOf( date, units[ truncateAt ], properties.calendar );
	if ( timezoneOffset ) {
		date.setMinutes( date.getMinutes() + timezoneOffset );
	}

	return date;
};




/**
 * parseProperties( cldr )
 *
 * @cldr [Cldr instance].
 *
 * Return parser properties.
 */
var dateParseProperties = function( cldr ) {
	return {
		preferredTimeData: cldr.supplemental.timeData.preferred(),
		calendar: gdateCalendarForLocale( cldr )
	};
};




/**
 * Generated by:
 *
 * regenerate().add( require( "unicode-7.0.0/categories/N/symbols" ) ).toString();
 *
 * https://github.com/mathiasbynens/regenerate
 * https://github.com/mathiasbynens/unicode-7.0.0
 */
var regexpN = /[0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D66-\u0D75\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]|\uD800[\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23\uDF41\uDF4A\uDFD1-\uDFD5]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDD16-\uDD1B\uDE40-\uDE47\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDE60-\uDE7E]|\uD804[\uDC52-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDDE1-\uDDF4\uDEF0-\uDEF9]|\uD805[\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9]|\uD806[\uDCE0-\uDCF2]|\uD809[\uDC00-\uDC6E]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59\uDF5B-\uDF61]|\uD834[\uDF60-\uDF71]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDCC7-\uDCCF]|\uD83C[\uDD00-\uDD0C]/;




/**
 * tokenizer( value, pattern, properties )
 *
 * @value [String] string date.
 *
 * @properties [Object] output returned by date/tokenizer-properties.
 *
 * Returns an Array of tokens, eg. value "5 o'clock PM", pattern "h 'o''clock' a":
 * [{
 *   type: "h",
 *   lexeme: "5"
 * }, {
 *   type: "literal",
 *   lexeme: " "
 * }, {
 *   type: "literal",
 *   lexeme: "o'clock"
 * }, {
 *   type: "literal",
 *   lexeme: " "
 * }, {
 *   type: "a",
 *   lexeme: "PM",
 *   value: "pm"
 * }]
 *
 * OBS: lexeme's are always String and may return invalid ranges depending of the token type.
 * Eg. "99" for month number.
 *
 * Return an empty Array when not successfully parsed.
 */
var dateTokenizer = function( value, numberParser, properties ) {
	var valid,
		timeSeparator = properties.timeSeparator,
		calendar = properties.calendar,
		tokens = [],
		widths = [ "abbreviated", "wide", "narrow" ];

	valid = properties.pattern.match( datePatternRe ).every(function( current ) {
		var chr, length, numeric, tokenRe,
			token = {};

		function hourFormatParse( tokenRe, numberParser ) {
			var aux = value.match( tokenRe );
			numberParser = numberParser || function( value ) {
				return +value;
			};

			if ( !aux ) {
				return false;
			}

			// hourFormat containing H only, e.g., `+H;-H`
			if ( aux.length < 8 ) {
				token.value =
					( aux[ 1 ] ? -numberParser( aux[ 1 ] ) : numberParser( aux[ 4 ] ) ) * 60;

			// hourFormat containing H and m, e.g., `+HHmm;-HHmm`
			} else {
				token.value =
					( aux[ 1 ] ? -numberParser( aux[ 1 ] ) : numberParser( aux[ 7 ] ) ) * 60 +
					( aux[ 1 ] ? -numberParser( aux[ 4 ] ) : numberParser( aux[ 10 ] ) );
			}

			return true;
		}

		// Transform:
		// - "+H;-H" -> /\+(\d\d?)|-(\d\d?)/
		// - "+HH;-HH" -> /\+(\d\d)|-(\d\d)/
		// - "+HHmm;-HHmm" -> /\+(\d\d)(\d\d)|-(\d\d)(\d\d)/
		// - "+HH:mm;-HH:mm" -> /\+(\d\d):(\d\d)|-(\d\d):(\d\d)/
		//
		// If gmtFormat is GMT{0}, the regexp must fill {0} in each side, e.g.:
		// - "+H;-H" -> /GMT\+(\d\d?)|GMT-(\d\d?)/
		function hourFormatRe( hourFormat, gmtFormat, timeSeparator ) {
			var re;

			if ( !gmtFormat ) {
				gmtFormat = "{0}";
			}

			re = hourFormat
				.replace( "+", "\\+" )

				// Unicode equivalent to (\\d\\d)
				.replace( /HH|mm/g, "((" + regexpN.source + ")(" + regexpN.source + "))" )

				// Unicode equivalent to (\\d\\d?)
				.replace( /H|m/g, "((" + regexpN.source + ")(" + regexpN.source + ")?)" );

			if ( timeSeparator ) {
				re = re.replace( /:/g, timeSeparator );
			}

			re = re.split( ";" ).map(function( part ) {
				return gmtFormat.replace( "{0}", part );
			}).join( "|" );

			return new RegExp( re );
		}

		function oneDigitIfLengthOne() {
			if ( length === 1 ) {

				// Unicode equivalent to /\d/
				numeric = true;
				return tokenRe = regexpN;
			}
		}

		function oneOrTwoDigitsIfLengthOne() {
			if ( length === 1 ) {

				// Unicode equivalent to /\d\d?/
				numeric = true;
				return tokenRe = new RegExp( "(" + regexpN.source + ")(" + regexpN.source + ")?" );
			}
		}

		function twoDigitsIfLengthTwo() {
			if ( length === 2 ) {

				// Unicode equivalent to /\d\d/
				numeric = true;
				return tokenRe = new RegExp( "(" + regexpN.source + ")(" + regexpN.source + ")" );
			}
		}

		// Brute-force test every locale entry in an attempt to match the given value.
		// Return the first found one (and set token accordingly), or null.
		function lookup( path ) {
			var i, re,
				data = properties[ path.join( "/" ) ];

			for ( i in data ) {
				re = new RegExp( "^" + data[ i ] );
				if ( re.test( value ) ) {
					token.value = i;
					return tokenRe = new RegExp( data[ i ] );
				}
			}
			return null;
		}

		token.type = current;
		chr = current.charAt( 0 ),
		length = current.length;

		if ( chr === "Z" ) {
			// Z..ZZZ: same as "xxxx".
			if ( length < 4 ) {
				chr = "x";
				length = 4;

			// ZZZZ: same as "OOOO".
			} else if ( length < 5 ) {
				chr = "O";
				length = 4;

			// ZZZZZ: same as "XXXXX"
			} else {
				chr = "X";
				length = 5;
			}
		}

		switch ( chr ) {

			// Era
			case "G":
				lookup([
					calendar,
					"eras",
					length <= 3 ? "eraAbbr" : ( length === 4 ? "eraNames" : "eraNarrow" )
				]);
				break;

			// Year
			case "y":
			case "Y":
				numeric = true;

				// number l=1:+, l=2:{2}, l=3:{3,}, l=4:{4,}, ...
				if ( length === 1 ) {

					// Unicode equivalent to /\d+/.
					tokenRe = new RegExp( "(" + regexpN.source + ")+" );
				} else if ( length === 2 ) {

					// Unicode equivalent to /\d\d/
					tokenRe = new RegExp( "(" + regexpN.source + ")(" + regexpN.source + ")" );
				} else {

					// Unicode equivalent to /\d{length,}/
					tokenRe = new RegExp( "(" + regexpN.source + "){" + length + ",}" );
				}
				break;

			// Quarter
			case "Q":
			case "q":
				// number l=1:{1}, l=2:{2}.
				// lookup l=3...
				oneDigitIfLengthOne() || twoDigitsIfLengthTwo() || lookup([
					calendar,
					"quarters",
					chr === "Q" ? "format" : "stand-alone",
					widths[ length - 3 ]
				]);
				break;

			// Month
			case "M":
			case "L":
				// number l=1:{1,2}, l=2:{2}.
				// lookup l=3...
				oneOrTwoDigitsIfLengthOne() || twoDigitsIfLengthTwo() || lookup([
					calendar,
					"months",
					chr === "M" ? "format" : "stand-alone",
					widths[ length - 3 ]
				]);
				break;

			// Day
			case "D":
				// number {l,3}.
				if ( length <= 3 ) {

					// Unicode equivalent to /\d{length,3}/
					numeric = true;
					tokenRe = new RegExp( "(" + regexpN.source + "){" + length + ",3}" );
				}
				break;

			case "W":
			case "F":
				// number l=1:{1}.
				oneDigitIfLengthOne();
				break;

			// Week day
			case "e":
			case "c":
				// number l=1:{1}, l=2:{2}.
				// lookup for length >=3.
				if ( length <= 2 ) {
					oneDigitIfLengthOne() || twoDigitsIfLengthTwo();
					break;
				}

			/* falls through */
			case "E":
				if ( length === 6 ) {
					// Note: if short day names are not explicitly specified, abbreviated day
					// names are used instead http://www.unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
					lookup([
						calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						"short"
					]) || lookup([
						calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						"abbreviated"
					]);
				} else {
					lookup([
						calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						widths[ length < 3 ? 0 : length - 3 ]
					]);
				}
				break;

			// Period (AM or PM)
			case "a":
				lookup([
					calendar,
					"dayPeriods/format/wide"
				]);
				break;

			// Week, Day, Hour, Minute, or Second
			case "w":
			case "d":
			case "h":
			case "H":
			case "K":
			case "k":
			case "j":
			case "m":
			case "s":
				// number l1:{1,2}, l2:{2}.
				oneOrTwoDigitsIfLengthOne() || twoDigitsIfLengthTwo();
				break;

			case "S":
				// number {l}.

				// Unicode equivalent to /\d{length}/
				numeric = true;
				tokenRe = new RegExp( "(" + regexpN.source + "){" + length + "}" );
				break;

			case "A":
				// number {l+5}.

				// Unicode equivalent to /\d{length+5}/
				numeric = true;
				tokenRe = new RegExp( "(" + regexpN.source + "){" + ( length + 5 ) + "}" );
				break;

			// Zone
			case "z":
			case "O":
				// O: "{gmtFormat}+H;{gmtFormat}-H" or "{gmtZeroFormat}", eg. "GMT-8" or "GMT".
				// OOOO: "{gmtFormat}{hourFormat}" or "{gmtZeroFormat}", eg. "GMT-08:00" or "GMT".
				if ( value === properties[ "timeZoneNames/gmtZeroFormat" ] ) {
					token.value = 0;
					tokenRe = new RegExp( properties[ "timeZoneNames/gmtZeroFormat" ] );
				} else {
					tokenRe = hourFormatRe(
						length < 4 ? "+H;-H" : properties[ "timeZoneNames/hourFormat" ],
						properties[ "timeZoneNames/gmtFormat" ],
						timeSeparator
					);
					if ( !hourFormatParse( tokenRe, numberParser ) ) {
						return null;
					}
				}
				break;

			case "X":
				// Same as x*, except it uses "Z" for zero offset.
				if ( value === "Z" ) {
					token.value = 0;
					tokenRe = /Z/;
					break;
				}

			/* falls through */
			case "x":
				// x: hourFormat("+HH;-HH")
				// xx or xxxx: hourFormat("+HHmm;-HHmm")
				// xxx or xxxxx: hourFormat("+HH:mm;-HH:mm")
				tokenRe = hourFormatRe(
					length === 1 ? "+HH;-HH" : ( length % 2 ? "+HH:mm;-HH:mm" : "+HHmm;-HHmm" )
				);
				if ( !hourFormatParse( tokenRe ) ) {
					return null;
				}
				break;

			case "'":
				token.type = "literal";
				current = current.replace( /''/, "'" );
				if ( length > 2 ) {
					current = current.slice( 1, -1 );
				}
				tokenRe = new RegExp( regexpEscape( current ) );
				break;

			default:
				token.type = "literal";
				tokenRe = /./;
		}

		if ( !tokenRe ) {
			return false;
		}

		// Get lexeme and consume it.
		value = value.replace( new RegExp( "^" + tokenRe.source ), function( lexeme ) {
			token.lexeme = lexeme;
			if ( numeric ) {
				token.value = numberParser( lexeme );
			}
			return "";
		});

		if ( !token.lexeme ) {
			return false;
		}

		tokens.push( token );
		return true;
	});

	return valid ? tokens : [];
};




/**
 * tokenizerProperties( pattern, cldr )
 *
 * @pattern [String] raw pattern.
 *
 * @cldr [Cldr instance].
 *
 * Return Object with data that will be used by tokenizer.
 */
var dateTokenizerProperties = function( pattern, cldr ) {
	var properties = {
			pattern: pattern,
			timeSeparator: numberSymbol( "timeSeparator", cldr ),
			calendar: gdateCalendarForLocale( cldr )
		},
		widths = [ "abbreviated", "wide", "narrow" ];

	function populateProperties( path, value ) {

		// The `dates` and `calendars` trim's purpose is to reduce properties' key size only.
		properties[ path.replace( /^.*\/dates\//, "" ).replace( /calendars\//, "" ) ] = value;
	}

	cldr.on( "get", populateProperties );

	pattern.match( datePatternRe ).forEach(function( current ) {
		var chr, length;

		chr = current.charAt( 0 ),
		length = current.length;

		if ( chr === "Z" && length < 5 ) {
				chr = "O";
				length = 4;
		}

		switch ( chr ) {

			// Era
			case "G":
				cldr.main([
					"dates/calendars",
					properties.calendar,
					"eras",
					length <= 3 ? "eraAbbr" : ( length === 4 ? "eraNames" : "eraNarrow" )
				]);
				break;

			// Year
			case "u": // Extended year. Need to be implemented.
			case "U": // Cyclic year name. Need to be implemented.
				throw createErrorUnsupportedFeature({
					feature: "year pattern `" + chr + "`"
				});

			// Quarter
			case "Q":
			case "q":
				if ( length > 2 ) {
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"quarters",
						chr === "Q" ? "format" : "stand-alone",
						widths[ length - 3 ]
					]);
				}
				break;

			// Month
			case "M":
			case "L":
				// number l=1:{1,2}, l=2:{2}.
				// lookup l=3...
				if ( length > 2 ) {
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"months",
						chr === "M" ? "format" : "stand-alone",
						widths[ length - 3 ]
					]);
				}
				break;

			// Day
			case "g":
				// Modified Julian day. Need to be implemented.
				throw createErrorUnsupportedFeature({
					feature: "Julian day pattern `g`"
				});

			// Week day
			case "e":
			case "c":
				// lookup for length >=3.
				if ( length <= 2 ) {
					break;
				}

			/* falls through */
			case "E":
				if ( length === 6 ) {
					// Note: if short day names are not explicitly specified, abbreviated day
					// names are used instead http://www.unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						"short"
					]) || cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						"abbreviated"
					]);
				} else {
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						widths[ length < 3 ? 0 : length - 3 ]
					]);
				}
				break;

			// Period (AM or PM)
			case "a":
				cldr.main([
					"dates/calendars",
					properties.calendar,
					"dayPeriods/format/wide"
				]);
				break;

			// Zone
			case "z":
			case "O":
				cldr.main( "dates/timeZoneNames/gmtFormat" );
				cldr.main( "dates/timeZoneNames/gmtZeroFormat" );
				cldr.main( "dates/timeZoneNames/hourFormat" );
				break;

			case "v":
			case "V":
				throw createErrorUnsupportedFeature({
					feature: "timezone pattern `" + chr + "`"
				});
		}
	});

	cldr.off( "get", populateProperties );

	return properties;
};




function validateRequiredCldr( path, value ) {
	validateCldr( path, value, {
		skip: [
			/dates\/calendars\/[^\/]+\/dateTimeFormats\/availableFormats/,
			/dates\/calendars\/[^\/]+\/days\/.*\/short/,
			/supplemental\/timeData\/(?!001)/,
			/supplemental\/weekData\/(?!001)/,
			/supplemental\/calendarPreferenceData/
		]
	});
}

/**
 * .dateFormatter( options )
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Return a date formatter function (of the form below) according to the given options and the
 * default/instance locale.
 *
 * fn( value )
 *
 * @value [Date]
 *
 * Return a function that formats a date according to the given `format` and the default/instance
 * locale.
 */
Globalize.dateFormatter =
Globalize.prototype.dateFormatter = function( options ) {
	var cldr, numberFormatters, pad, pattern, properties;

	validateParameterTypePlainObject( options, "options" );

	cldr = this.cldr;
	options = options || { skeleton: "yMd" };

	validateDefaultLocale( cldr );

	cldr.on( "get", validateRequiredCldr );
	pattern = dateExpandPattern( options, cldr );
	properties = dateFormatProperties( pattern, cldr );
	cldr.off( "get", validateRequiredCldr );

	// Create needed number formatters.
	numberFormatters = properties.numberFormatters;
	delete properties.numberFormatters;
	for ( pad in numberFormatters ) {
		numberFormatters[ pad ] = this.numberFormatter({
			raw: numberFormatters[ pad ]
		});
	}

	return function( value ) {
		validateParameterPresence( value, "value" );
		validateParameterTypeDate( value, "value" );
		return dateFormat( value, numberFormatters, properties );
	};
};

/**
 * .dateParser( options )
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Return a function that parses a string date according to the given `formats` and the
 * default/instance locale.
 */
Globalize.dateParser =
Globalize.prototype.dateParser = function( options ) {
	var cldr, numberParser, parseProperties, pattern, tokenizerProperties;

	validateParameterTypePlainObject( options, "options" );

	cldr = this.cldr;
	options = options || { skeleton: "yMd" };

	validateDefaultLocale( cldr );

	cldr.on( "get", validateRequiredCldr );
	pattern = dateExpandPattern( options, cldr );
	tokenizerProperties = dateTokenizerProperties( pattern, cldr );
	parseProperties = dateParseProperties( cldr );
	cldr.off( "get", validateRequiredCldr );

	numberParser = this.numberParser({ raw: "0" });

	return function( value ) {
		var tokens;

		validateParameterPresence( value, "value" );
		validateParameterTypeString( value, "value" );

		tokens = dateTokenizer( value, numberParser, tokenizerProperties );
		return dateParse( value, tokens, parseProperties ) || null;
	};
};

/**
 * .formatDate( value, options )
 *
 * @value [Date]
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Formats a date or number according to the given options string and the default/instance locale.
 */
Globalize.formatDate =
Globalize.prototype.formatDate = function( value, options ) {
	validateParameterPresence( value, "value" );
	validateParameterTypeDate( value, "value" );

	return this.dateFormatter( options )( value );
};

/**
 * .parseDate( value, options )
 *
 * @value [String]
 *
 * @options [Object] see date/expand_pattern for more info.
 *
 * Return a Date instance or null.
 */
Globalize.parseDate =
Globalize.prototype.parseDate = function( value, options ) {
	validateParameterPresence( value, "value" );
	validateParameterTypeString( value, "value" );

	return this.dateParser( options )( value );
};

return Globalize;




}));
