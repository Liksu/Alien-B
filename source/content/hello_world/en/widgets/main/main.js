/**
 * Created by Peter Bortchagovsky.
 * 26.09.11 14:31
 */

/**
 * render widget
 * @param {widget_object} wo
 */
function(wo) {
	var self = this;
	CM.W.apply(self);
	$.extend(true, self.wo, wo);

	self.stash_robber = function(stash) {
		stash.version = CM.ver();
		return stash;
	};

	self.ready = function() {
		self.$rendered.draggable();
	}
}