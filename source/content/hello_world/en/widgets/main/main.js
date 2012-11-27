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

	/*use plugin contract*/
	self.use('contract');

	self.stash_robber = function(stash) {
		stash.version = CM.ver();
		return stash;
	};

	self.ready = function() {
		CM.root.$rendered.attr({title: self.wo.voc.title})
		self.$rendered.draggable({cancel: self.events.sl['caption']});
	}

	self.trigg('update:before', function(data, cb, sender) {
		data.time = 'server time: ' + data.time.replace(/\..*/, '');
		return [data, cb, sender];
	});

	self.events.set('click.caption', function(e) {
		self.contract('body');
	});

	self.events.set('click.lock', function(e) {
		self.alert('Locked');
		setTimeout(function() {
			self.alert(false);
		}, 1000);
	});

}
