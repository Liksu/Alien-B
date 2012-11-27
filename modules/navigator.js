/**
 * Created by Peter Bortchagovsky.
 * 11.10.11 02:37
 */


function(CM) {
	var self = this;
	CM.s.q.navigator = [];

	CM.trigg('register_navigate', function(widget) {
		if (CM.s.q.navigator) widget.navigate_queue_id = CM.s.q.navigator.push(widget.navigate) - 1;
		else log('Navigator not found');
	});

	CM.trigg('unregister_navigate', function(widget) {
		if (CM.s.q.navigator) delete CM.s.q.navigator[widget.navigate_queue_id];
		else log('Navigator not found');
	});

	self.navigate_callback = function(hash){
		if(hash == "") {
		} else if (hash = hash.match(/^!\/(.*)/)[1]) {
			log('navigate to: ', hash);
			var found = false;
			CM.s.q.navigator.each(function(i, func) {
				if (func) found = func(hash);
				return !found;
			});
			if (!found) {
				$.get_json({method: 'getObject', id: hash, type: 'tree'}, function(new_wo) {
					if (new_wo.status == 'error') {
						CM.ear('navigation_error', hash, new_wo);
						return false;
					}
					
					var widgets = CM.identify(new_wo.widget_name);
					if (!widgets.length) $.get_json({method: 'getParentWidgets', widgetId: new_wo.widget_id}, function(array_wo) {
							//TODO:compare
						var real = CM.root;
						var new_wo;

						for (var i = 0; i < array_wo.length; i++) {
							new_wo = array_wo[i];
							
							if (real.children[new_wo.widget_id]) real = real.children[new_wo.widget_id];
							else {
//								ok(real, real.wo.widget_id, new_wo.widget_id + '[' + new_wo.tray + ']');

								real.children.change(new_wo.tray, new_wo);
								break;
							}
						}
					});
					else {
						widgets.each(function(i, widget) {
							widget.parent.children.change(widget.wo.widget_id, new_wo.widget_id)
						});
					}
					// else change child
				});
			};
		}
	};

	$.history.init(self.navigate_callback, {unescape: ",/&", startup: false, prefix: '#!/' });

};