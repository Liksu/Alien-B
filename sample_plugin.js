function(options) {
	var widget = this;
	var settings = {
	};
	$.extend(true, settings, options);

	widget.test = function(options) {
		log('it works! ', widget.wo.widget_id, settings, options);
	};
};

/*set key value*/
/*  all settings stored in CM.p[plugin_name].prototype.settings; template stored in CM.p[plugin_name].prototype.tmpl
	key             value           description
	load_template   true            load template for plugin, named like plugin
	load_template   template_name	load template with different name
	load_styles     css_filename    add styles
*/