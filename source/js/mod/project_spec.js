/**
 * Created by Peter Bortchagovsky.
 * 22.12.11 14:39
 */

function(CM) {
	var self = this;

	CM.W.constructor_hook.push(function() {
		var widget = this;

		if (!widget.children) widget.children = {};
		widget.children.clone = function(from_widget_id, to_widget_id) {
			var new_wo = {};
			if (typeof from_widget_id == 'object') { // if new wo passed
				$.extend(true, new_wo, from_widget_id);
			} else if (CM.s.c[from_widget_id] && CM.s.c[from_widget_id].wo) { // if widget_id passed
				$.extend(true, new_wo, CM.s.c[from_widget_id].wo);
			} else {
				return false;
			}

			new_wo.clone = new_wo.widget_id;
			if (!to_widget_id || typeof to_widget_id != 'number' || typeof to_widget_id != 'string') {
				var re = /_clone(\d+)$/;
				if (re.test(new_wo.widget_id)) {
					to_widget_id = new_wo.widget_id.replace(re, '') + '_clone' + (+RegExp.$1 + 1);
				} else {
					to_widget_id = new_wo.widget_id + '_clone1';
				}
			}

			new_wo.widget_id = to_widget_id;
			widget.children.append(new_wo);
		}
	});

	self.after_load = function() {
	};

}