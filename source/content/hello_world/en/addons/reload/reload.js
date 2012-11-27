/**
 * Created by Peter Bortchagovsky.
 * 17.01.12 15:37
 */


function(options) {
	var widget = this;
	var settings = {
		css: {}
		, resources: CM.p['reload'].prototype.urls.res
	};
	$.extend(true, settings, options);


	if (widget.$rendered && widget.$rendered.length) {
		var $img = $.tmpl(CM.p['reload'].prototype.tmpl, $.extend(true, {}, settings, {widget_id: widget.wo.widget_id}));
		$img.css(settings.css);
		$img.prependTo(widget.$rendered);
		$img.click(function() {
			widget.ear('reload')
		});
	};
};

/*set load_template true*/
/*set load_styles reload.css*/