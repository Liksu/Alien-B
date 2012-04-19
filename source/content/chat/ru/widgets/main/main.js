/**
 * Created by Peter Bortchagovsky.
 * 25.03.12 4:10
 */

function(wo) {
	var self = this;
	CM.W.apply(self);
	$.extend(true, self.wo, wo);

	self.ready = function() {
//		log('my main loaded');
	}
}
