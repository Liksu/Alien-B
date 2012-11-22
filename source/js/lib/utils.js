/**
 * Created by Peter Bortchagovsky
 * at 05.07.11 18:49
 */

/**
 * extend jQuery
 */
if (jQuery) (function($) {

    $.fn.disable = function() {
	    return this.each(function() {
		    $(this).attr("disabled","disabled");
	    })
    };

	$.fn.enable = function() {
		return this.each(function() {
			$(this).removeAttr('disabled');
		})
	};

	/**
	 *
	 * @param {Object} data Object with 'type' key. Note, that "method" is server api method, and called like /api/method
	 * @param {Function} [cb]
	 */
	$.get_json = function(data, cb) {
		if (!data) data = {};
		data.inbox_id = CM.instance_id;

		var url = data.method_url || u.t(CM.settings.urls.api, {method: data.method || 'status'});

		delete data.method_url;
		delete data.method;

//		if (data.params != undefined) data.params = JSON.stringify(data.params || {});
		for (var i in data) if (data[i] != undefined && typeof data[i] == 'object') data[i] = JSON.stringify(data[i] || {});

//		url += '?' + data.type + '=' + data.id; // for debug
		return $.ajax({
			url: url
		  , data: data
		  , contentType: 'application/x-www-form-urlencoded'
		  , success: typeof cb == 'function' ? cb : function(json) { CM.ear('new_data', json) }
		  , error: function() { CM.ear('get_data_error') }
		  , type: 'post'
		  , dataType: 'json'
//		  , cache: false
		});
	};

	$.fn.htmls = function() {
		var htmls = [];
		this.each(function() {
			htmls.push( $(this).html() );
		});
		return htmls;
	};

	$.fn.serialize_to_params = function() {
		var params = {};
		this.each(function() {
			$(this).serializeArray().each(function() {params[ this.name ] = this.value })
		});
		return params;
	};

	$.fn.$ = function(selector, self) {
		if (self && self.events && self.events.sl) {
			if (self.events.sl[selector]) selector = self.events.sl[selector];
//			this = $(this) // filter only in self
		};
		return $(selector, this);
	};

	$.fn.set_val = function(val) {
		this.each(function() {
			if ($(this).is('input, select, textarea')) $(this).val(val);
			else $(this).html(val);
		});
	};

	$.fn.get_val = function() {
		if (this.eq(0).is('input, select, textarea')) return this.eq(0).val();
		else return this.eq(0).html();
	};

	$.fn.get_vals = function() {
		var results = [];
		this.each(function() {
			if ($(this).is('input, select, textarea')) results.push( $(this).val() );
			else results.push( $(this).html() );
		});
		return results;
	};

})(jQuery);


/**
 * Daniel James's version of indexOf
 */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj, fromIndex) {
    if (fromIndex == null) {
        fromIndex = 0;
    } else if (fromIndex < 0) {
        fromIndex = Math.max(0, this.length + fromIndex);
    }
    for (var i = fromIndex, j = this.length; i < j; i++) {
        if (this[i] === obj)
            return i;
    }
    return -1;
  };
}
/* *** */


/**
 * object u for utils
 */
u = {};

/**
 * Process template to text
 *
 * @param {String} tmpl
 * @param {Object} data
 */
u.t = function(tmpl, data) {
	return $.tmpl(tmpl, data)[0].textContent
};

/**
 * Split string by space (or delimiter if defined)
 *
 * @param {String} str
 * @param {RegExp} [delim]
 */
u.qw = function(str, delim) {
    if (!delim) delim = /\s+/;
    return str.split(delim);
};
String.prototype.qw = function(delim) {return u.qw(this, delim)};


u.repair_types = function(string) {
	switch (string.toLowerCase()) {
		case 'true'      : return true;
		case 'false'     : return false;
		case 'undefined' : return undefined;
		case 'null'      : return null;
	}
	if (/^(\d+)$/.test(string)) return +string;
	return String(string);
};
String.prototype.repair_types = function() {return u.repair_types(this)};

/**
 * Translate function params into object
 *
 * @example (function(foo, bar){ return u.args2obj(arguments) })(10, 20) => {foo: 10, bar: 20}
 * @param {Object} args Arguments object, required
 * @return {Object}
 */
u.args2obj = function(args) {
	var obj = {};
	var params = args.callee.toString().match(/function.*\((.*?)\)/)[1].split(', ');
	for (var i in args) obj[params[i] || i] = args[i];
	return obj;
};

u.dump = function() {
	var arr = [];

	for (var i = 0; i < arguments.length; i++) {
		var obj = arguments[i] || {};
		if (obj.callee && obj.length) obj = u.args2obj(obj); // if arguments passed
		if (typeof obj != 'object') arr.push(obj);
		else for (var n in obj) if ((obj instanceof Array && obj.hasOwnProperty(n)) || !(obj instanceof Array)) arr.push(n + ': ', obj[n]);
	}

	if (log) log.apply(this, arr);
	else if (console && console.debug) console.debug.apply(this, arr);
	else return arr;
};


//

/**
 *
 * @this Array
 * @param {Function} callback
 */
Array.prototype.each = function(callback) {return $.each(this, callback)};
Array.prototype.eachdef = function(callback) {
	return $.each(this, function(i, item) {
		return item !== undefined ? callback.call(item, i, item) : true;
	})
};


Array.prototype.grep = function(callback) {return $.grep(this, callback)};
Array.prototype.map = function(callback) {return $.map(this, callback)};

/**
 *
 * @param arr
 * @param obj
 */
u.has = function(arr, obj) {
    return (arr.indexOf(obj) != -1);
};
Array.prototype.has = function(obj) {return u.has(this, obj)};
String.prototype.has = function(obj) {return u.has(this, obj)};


/**
 * Create random array
 *
 * @param {Number} count
 * @param {String|Array} [dict]
 * @param {Boolean} [unic]
 * @return {Array}
 */
u.rand = function(count, dict, unic) {
	if (dict == undefined || !dict.length) dict = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
	if (typeof dict == 'string') dict = dict.split('');
	if (count == undefined) count = 8;
	if (unic == undefined) unic = false;

	var arr = [];
	for (var i = 1; i <= count; i++) {
		var n = Math.round((Math.random()*dict.length)-0.5);
		if (unic && count <= dict.length) {
			while (arr.has( dict[n] )) n = Math.round((Math.random()*dict.length)-0.5);
		}
		arr.push( dict[n] );
	}
	return arr;
};
Array.prototype.rand = function(n, unic) {
	if (unic == undefined) unic = true;
	if (n != undefined) return u.rand(n, this, unic);
	else return u.rand(this.length, this, unic);
};
String.prototype.rand = function(n, unic) {
	if (unic == undefined) unic = true;
	if (n != undefined) return u.rand(n, this.split(''), unic).join('');
	else return u.rand(this.length, this.split(''), unic).join('');
};
Number.prototype.rand = function(n, unic) {
    if (n == undefined) return ( Math.floor( Math.random() * this) );
    
    var arr = [];
    for (var i = 0; i < this; i++) arr[i] = i;

	if (unic == undefined) unic = true;
	return u.rand(n, arr, unic);
};

/**
 * insert item between every array elements
 *
 * @param {String} item
 * @param {Number} start
 */
Array.prototype.insert = function(item, start) {
	if (item == undefined) item = ', ';
	if (start == undefined) start = 1;
	for (var i = start; i < this.length; i += 2) this.splice(i, 0, item);
	return this;
};

/**
 * function for easy debug
 *
 * @param {String} widget_name
 */
u.reset_widget = function(widget_name) {
	var ws = [];

	CM.identify(widget_name).each(function() {
		ws.push({wo: this.wo, parent: this.parent});
		this.unload();
	});
	delete CM.s.w[widget_name];
	
	ws.each(function() {
		this.parent.children.append(this.wo);
	});
};

/**
 * Get keys of object
 *
 * @param obj
 */
u.object_keys = function(obj) {
	var arr = [];
	for (var i in obj) if (obj.hasOwnProperty(i)) arr.push(i);
	return arr;
};

/**
 * Get values of object
 *
 * @param obj
 */
u.object_vals = function(obj) {
	var arr = [];
	u.object_keys(obj).each(function(i, key) {
		arr.push(obj[key]);
	});
	return arr;
};

u.object_to_json = function(data) {
//	return {q: data.toSource().replace(/^\((.*)\)$/, '$1').replace(/([\w\d\_]+):/g, '"$1":')}
	return {q: JSON.stringify(data)}
};


u.olink = function(data, link, cb) {
	var path = link.replace(/\]/g, '').split(/\.|\[/);
	var res = data;
	for (var i = 0; i < path.length; i++) if (res) res = res[path[i]];
	if (cb && typeof cb == 'function') res = cb(link, res);
	return res;
};

// smth

u.uid = function() {
	return ''.rand(32).match(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/).slice(1).join('-').replace(/\_/, 'a');
//	return [''.rand(8), ''.rand(4), ''.rand(4), ''.rand(3), ''.rand(12)].join('-').replace(/\_/, 'a');
};


u.get_gather = function(gather_id) {
	return CM.s.q['gather'][gather_id] && CM.s.q['gather'][gather_id].link;
};

u.get_gather_object = function(gather_id) {
	return CM.s.q['gather'][gather_id];
};

u.set_to_gather = function(gather_id, key, value) {
	if (CM.s.q['gather'][gather_id]) {
		if (key != undefined) CM.s.q['gather'][gather_id].link[key] = value;
		CM.gather(gather_id);
		return CM.s.q['gather'][gather_id];
	}
	return false;
};

u.collapse_wo = function(array_wo) {
	if (array_wo.length > 1)
		for (var i = array_wo.length - 1; i > 0; i--) {
			array_wo[i-1].children.each(function(tray_id) {
				array_wo[i-1].children[tray_id].each(function(n, widget_id) {
					if (widget_id == array_wo[i].widget_id) array_wo[i-1].children[tray_id][n] = array_wo[i];
				});
			});
		};
	return array_wo[0];
};

u.extract_tag = function(plain_html, tag, attributes) {
	if (!plain_html) return [];
	if (!tag) tag = 'script';
	if (!attributes) attributes = {};
//	plain_html = "foo <script cut='true'> bar <script cut='false'> zoo </script> loo </script> gaa <script> zaa </script>";

	var re = new RegExp('<'+tag+'([\\s\\S](?!<'+tag+'))*?<\\/'+tag+'>', 'im');
	var found_tags = [];
	var i;

	// I. extract loop
	while (re.test(plain_html)) {
		plain_html = plain_html.replace(re, function(tag_item) {
			return '<#tag' + (found_tags.push({html: tag_item, extract: true}) - 1) + '#>';
		});
	};

	// II. mark loop
	re = new RegExp('<'+tag+'(.*?)>', 'i');
	for (i = 0; i < found_tags.length; i++) {
		// set flag
		var attrs = re.exec(found_tags[i].html)[1];
		var $tag = $('<' + tag + ' ' + attrs + '></' + tag + '>');
		for (var a in attributes) {
			found_tags[i].extract = !( $tag.attr(a) == undefined || ($tag.attr(a) && attributes[a] && attributes[a] != $tag.attr(a)) );
		};
	};

	// III. compile htmls
	found_tags.push({html: plain_html, extract: false});
	found_tags.each(function(i, tag_item) {
		found_tags[i].html = found_tags[i].html.replace(/<#tag(\d+)#>/g, function(str, number) {
//			log('replace: ', i, arguments);
			return found_tags[number].extract ? '' : found_tags[number].html;
		});
	});

	return {html: found_tags.pop().html, tags: found_tags.grep(function(tag_item, i) { return tag_item.extract }).map(function(tag_item, i) { return tag_item.html })};
};


u.find_in_parents = function(widget, path, type) {
	if (!widget || !path) return undefined;

	do {
//		log(widget.wo.widget_name, dtype + '=', u.olink(widget, path));
		var result = u.olink(widget, path);

		if (result && (type ? typeof result == type : true)) break;
		else result = undefined;

		widget = widget.parent;
	} while (widget);

	return result
};


/**
 * found in inet function for filter big json by some key
 *
 * @param obj
 * @param key
 * @param val
 */
u.filter = function(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
	        if (i != 'parent') objects = objects.concat(arguments.callee(obj[i], key, val));
        } else if (i == key && (val != undefined ? obj[key] == val : true)) {
            objects.push(obj);
        }
    }
    return objects;
};

/**
 *
 * @param obj
 * @param {Object} settings {ignore: Array, key: string, value: string}
 */
u.storage2text = function(selector, obj) {
	if (!obj) obj = CM.s.c;
//	if (!selector) return obj;
	if (!selector) selector = "";

	var objects = [];

	for (var i in obj) {
		var selectori = selector + (obj instanceof Array ? '[' + i + ']' : '.' + i);

	    if (!obj.hasOwnProperty(i)) continue;
	    if (typeof obj[i] == 'object') {
		    if (i != 'parent') objects = objects.concat(arguments.callee(selectori, obj[i]));
	    } else {
	        objects.push(selectori + '=' + (obj[i] ? typeof obj[i] != 'function' ? obj[i].toString() : 'function' : 'undef'));
	    }
	}

	return objects;
};

u.storage_filter = function(selector, obj) {
	if (!obj) obj = CM.s;
	if (!selector) return obj;

	var key, tmp;
	if (/=/.test(selector)) {
		key = selector.split(/=/)[1];
		selector = selector.split(/=/)[0];
	}

	var objects = [];

	if (obj && obj != {} && (tmp = u.olink(obj, selector))) {
        if (!key || tmp == key) objects.push(obj);
	} else {
		for (var i in obj) {
			if (!obj.hasOwnProperty(i)) continue;
			if (i != 'parent' && typeof obj[i] == 'object') {
				objects = objects.concat(arguments.callee(selector, obj[i]));
			}
		}
	}
	return objects;

};

/**
 *
 * @param {String} selector
 * @param {Object|Array|Function} [context] if function - return array of objects or object, default = window
 */
u._ = function(selector, context) {
	// object: {properties: values, parent: parent_object, children: children_objects[]}
	// key: {key: {...}}
	//TODO: smarty selectors
};