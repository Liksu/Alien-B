/**
 * Created by Peter Bortchagovsky.
 * 29.11.11 17:05
 *
 * contract
 * collapses under the name of the widget
 *
 * @constructor
 * @param {Object} [options]
 */
function(options) {
	var widget = this;
	var settings = {};
	$.extend(true, settings, options);

	widget.contract = function(selector) {
		var items = widget.$rendered.find(selector);
		
		if (items.is(':visible')) items.fadeOut('slow');
		else items.fadeIn('slow');
	};
};
/*set load_template false*/