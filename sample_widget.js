/**
 * render widget
 * @constructor
 * @param {widget_object} wo
 */
function(wo) {
	var self = this;
	CM.W.apply(self);
	$.extend(true, self.wo, wo);

	// preload addons
	/*use plugin example_plugin_name*/
	/*include module example_module_name*/

	//self.use('example_plugin_name');

	/**
	 * prepare the data before the render
	 */
	self.init = function() {
	};

	/**
	 * after render callback
	 */
	self.ready = function() {
//		log('widget stash: ', self.get_stash());
//		self.use('example_plugin_name', options_hash)
	};
}