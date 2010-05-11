(function($) {
    var invariant = $.cultures.invariant,
        standard = invariant.calendars.standard,
        culture = $.cultures["rm-CH"] = $.extend(true, {}, invariant, {
        name: "rm-CH",
        englishName: "Romansh (Switzerland)",
        nativeName: "Rumantsch (Svizra)",
        numberFormat: {
            ',': "\u0027",
            percent: {
                pattern: ["-n%","n%"],
                ',': "\u0027"
            },
            currency: {
                pattern: ["$-n","$ n"],
                ',': "\u0027",
                symbol: "fr."
            }
        },
        calendars: {
            standard: $.extend(true, {}, standard, {
                name: "Gregorian_Localized",
                days: [["dumengia","glindesdi","mardi","mesemna","gievgia","venderdi","sonda"],["du","gli","ma","me","gie","ve","so"]],
                months: [["schaner","favrer","mars","avrigl","matg","zercladur","fanadur","avust","settember","october","november","december",""],["schan","favr","mars","avr","matg","zercl","fan","avust","sett","oct","nov","dec",""]],
                AM: "",
                PM: "",
                eras: [{"name":"s. Cr.","start":null,"offset":0}],
                patterns: {
                    d: "dd/MM/yyyy",
                    D: "dddd, d MMMM yyyy",
                    f: "dddd, d MMMM yyyy HH:mm",
                    F: "dddd, d MMMM yyyy HH:mm:ss",
                    M: "dd MMMM",
                    Y: "MMMM yyyy"
                }
            })
        }
    });
    culture.calendar = culture.calendars.standard;
})(jQuery);