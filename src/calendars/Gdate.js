define(function() {
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

return Gdate;

});