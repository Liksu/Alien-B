/**
 * Liksu tools
 * Lools::Debug
 * Lib for simple debug js with console.
 * Created by Peter Bortchagovsky.
 * Date: feb 2009
 */


//if (typeof window["xdebug"] == "undefined") xdebug = [];

ok = function() { if (typeof window["xdebug"] != "undefined") {
	var str = new Array();

	if (arguments.length) {
		for (var i = 0; i < arguments.length; i++) str[i] = arguments[i];
	}

	str.unshift("ok" + (str.length ? ":" : ""));
	if (xdebug.has("alert")) {
		alert(str.join("\n"));
	} else {
		if (str.length) {log.apply(this, str)} else {log()}
	}
}; return true};

log = function() { if (typeof window["xdebug"] != "undefined") {
	var str = new Array();

	if (arguments.length) {
		for (var i = 0; i < arguments.length; i++) str[i] = arguments[i];
	} else {
		str = ["ok"];
	}

	if ( xdebug.has("timings") ) str.unshift(u.getDT() + " > ");

	if (window['console'] != undefined) {
		if (console.log.apply) log = function() {console.log.apply(console, arguments)};
		else log = Function.prototype.bind.call(console.log, console);

		if (typeof console.debug == "function" && xdebug.has("debug")) {
			for (var i = 2; i < str.length; i += 2) {
				if (!((typeof str[i-1] == 'string' && (str[i-1].match(/[:,=]\s*$/) || str[i-1].match(/\s+$/))) || (typeof str[i] == 'string' && (str[i].match(/^\s+/))))) str.splice(i, 0, ', ');
				else str.splice(i, 0, '');
			}
			if (console['debug']) console.debug.apply(console, str);
			else if (console['log']) console.log.apply(console, str);
		}
		else if (typeof console.log == "function" && xdebug.has("log")) console.log(str.join("\n"))
	};
}; return true};


/**
 * extend object u
 */

u.format00 = function(n, count, symb) {
	var s = n;
	if (!count) count = 2;
	if (!symb) symb = '0';
	for (var i = count; i>0; i--) s = symb + s;
	return s.substring(s.length-count)
}
u.getDate_DM = function() {return [Date().split(" ")[2], Date().split(" ")[1]].join(" ")} // Funny :)
u.getTime = function() {return new Date().getTime()}
u.getDT = function() {
	var d = new Date();
	return ""
//		+ d.getFullYear()			+ "."
//		+ u.format00(d.getMonth()*1+1)		+ "."
//		+ u.format00(d.getDate())		+ " "
		+ u.format00(d.getHours())		+ ":"
		+ u.format00(d.getMinutes())		+ ":"
		+ u.format00(d.getSeconds())		+ "."
		+ u.format00(d.getMilliseconds(), 3)
		;
}
