/**
 * Created by Peter Bortchagovsky.
 * 28.11.11 22:32
 *
 * alert
 * lock widget with passed message
 *
 * @constructor
 * @param {Object} [options]
 */
function(options) {
	var widget = this;
	var settings = {};
	var tmpl = CM.p['alert'].prototype.tmpl;
	var stash = {};
	$.extend(true, settings, options);

	/**
	 * @param {String|Boolean} msg
	 */
	widget.alert = function(msg, part_selector) {
		$.extend(true, stash, CM.exstash(settings, {msg: msg}));
		var $wrapper = $('div.alert_block', widget.$rendered);
		if (!$wrapper.length) $wrapper = $.tmpl(tmpl, stash).prependTo(widget.$rendered);
		if (typeof msg == 'boolean' && !msg) $wrapper.hide();
		else {
			$wrapper.tmplItem().update();
			$wrapper.show();
		}
	};

	widget.trigg('block', function(data, sender, cb) {
		if (!data) data = {};
		if (!data.message) data.message = '';

		if (data.timeout) {

			widget.block_id = CM.gather({
				link: { sec: data.timeout }
				, properties: [ function(link) { return !link.sec } ]
				, cb: function() {
					widget.alert(false);
					if (cb) cb();
				}
				, every: function(link) {
					var secs = [];
					secs.length = link.sec;

					widget.alert(u.t(data.message, $.extend(true, {sec: link.sec, secs: secs}, data)));
					link.sec--;
					setTimeout(function() { CM.gather(link.gathering_id) }, 1000);
				}
				, once: 'every'
			});

		} else {
			widget.alert(data.message);
			if (cb) cb();
		}
	});

	widget.trigg('unblock', function(data, sender, cb) {
		if (widget.block_id) {
			u.get_gather_object(widget.block_id).properties.length = 0;
			CM.gather(widget.block_id);
			delete widget.block_id;
		}
		else widget.alert(false);

		if (cb) cb();
	});


};
/*set load_template true*/
/*set load_styles alert.css*/
