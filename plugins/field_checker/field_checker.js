/**
 * Created by Peter Bortchagovsky.
 * 17.01.12 21:24
 */


function(options) {
	var widget = this;
	var settings = {
		obligatory_class: 'obligatory'
	};
	$.extend(true, settings, options);

	widget.field_check = function($els) {
//		log('field_checker called for ', $els);
		if (!$els || !$els.length) $els = widget.$rendered.find('*[checker]').add('*.' + settings.obligatory_class).not(widget.trays_selector);
		var null_checker = null;
		var deferred = [];
		$els.each(function(i, el) {
			var $el = $(el);
			var null_deferred = [];

			var checkers = $el.attr('checker');
			checkers = checkers ? checkers.qw() : [];
			if ($el.is('.' + settings.obligatory_class)) checkers.push(settings.obligatory_class);

			checkers.each(function(i, checker_name) {
				var checker = u.find_in_parents(widget, 'checkers.' + checker_name, 'function');
				if (checker) {
					var result_deferred = $.when( checker.call(widget, $el, $el.get_val()) ).pipe(function(result) {
						if (![true, false, undefined, null].has(result)) $el.set_val( result );
//						ok($el.attr('name'), 'checkers.' + checker_name, result);
						return result;
					});

					null_deferred.push(result_deferred);
					deferred.push(result_deferred);
				}
			});

			deferred.push($.when.apply(null, null_deferred).pipe(function() {
				var result = null;
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] === false) result = false;
					if (arguments[i] === true && result === null) result = true;
				};

				if (result !== null) {
					if (null_checker === null) null_checker = u.find_in_parents(widget, 'checkers.null', 'function');
					result = null_checker.call(widget, $el, result);
				}
				
				return result;
			}));

		});

		return $.when.apply(null, deferred).pipe(function() {
			var result = true;
			for (var i = 0; i < arguments.length; i++) if (!arguments[i]) result = false;
			return result;
		});
	};


	widget.trigg('appendToParent:after', function() {
		$.each({input: 'keyup', textarea: 'keyup', select: 'change'}, function(selector, eventType) {
			widget.$rendered.delegate(selector, eventType, function(e) {
				widget.field_check( $(e.target) )
//					.then(function() {
//						ok('delegate section full result', arguments);
//					});
				e.stopPropagation();
			});
		});

		widget.trigg('render', function() {
			widget.field_check();
		});
	});
};

CM.W.constructor_hook.push(function() {
	this.checkers = {};
});