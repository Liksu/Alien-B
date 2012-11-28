/**
 * Created by Peter Bortchagovsky.
 * 22.09.11 22:23
 */

var CM = new (function () {
	var self = this;

	self.s = {         // Storages
		  o: {}         // WO storage widget_id: widget_object // Compiled widget storage, like DOM, root = CM => now in CM.children
		, d: {}         // Data storage, widget_id => wo.data
		, q: {}         // Queue storage, owner: {...} || [...]
		, w: {}         // Widget storage (html + js), widget_name: {tmpl: {name: "html tmpl"}, js: function-constructor}
		, c: {}         // Cache, widget_id => widget object link
		, s: {}         // Styles, css_file_name: [template_name]
	};

	self.children = {};
	self.settings = {
		  version: "alpha.4.2"
		, lang: 'en'
		, mode: 'default'
		, theme: 'default'
		, re: {
				  includes: new RegExp('/\\*((?:use)|(?:include)) (\\w+) (\\w+)(?: (\\w+\\.\\w+))?\\*/', 'gi')
				, plugin_settings: new RegExp('/\\*set (\\w+) (.+)\\*/', 'gim')
				, global_css_tag: /^global\/(\w+\.css)$/i
				, split_to_filename: /\/(?!.*\/)/
		}
	};
	self.stash = {};       // Data hash for processing template
	self.instance_id = 0;  // inbox_id
	self.mod = {};         // Modules
	self.W = function(s, f) {  // Widget constructor
		var self = s || this;
//		var self = this;

		if (f && typeof f == 'string') f = f.qw();

		if (!f || f.has('attributes')) {
			self.trays = [undefined];          // self trays
			self.trays_selector = '';
			self.settings = {};
			self.css = [];
//			self.events = {sl: {}, fn: {}};    // events storage {sl: {event_item_name: 'selector'}, fn: {event_item_name: {ev: 'event_name.like.click', cb: action_function}}}
			self.children = {};       // collection of self children
			self.$rendered = {};       // ?
			self.parent = undefined;  // link to parent object
		}

		// self loading info
		// extend it!
		if (!f || f.has('attributes') || f.has('wo'))
		self.wo = {
			tray: 1
		  , template_name: 'W'
		  , widget_name: 'W'
		  , widget_id: 'W'
		  , widget_size_type: 'W'
		  , data: {}
		  , voc: {}
		  , settings: {}
		  , trays: []
		  , children: []
		  , need_data: true
		  , draw_if_null: false
		};


		/*** children ***************************************************************/

		if ((!f || f.has('children')) && !self.children) self.children = {};
		if (!f || f.has('children'))
		/**
		 *
		 * @param {Object|String} widget_id wo or widget_id
		 * @param every_cb
		 */
		self.children.append = function(widget_id, every_cb) {
			log(self.wo.widget_id + '.append: ', widget_id);
			CM.load(widget_id, self, function(widget) {
				self.trigg('append:before');
				log('append ', (widget.wo && widget.wo.widget_id) + ' to ' + (self.wo && self.wo.widget_id));//, self, widget);
				if (!CM.s.c[widget.wo.widget_id] || !CM.s.c[widget.wo.widget_id].length) {
					log('no widget in cache, append(' + widget.wo.widget_id + ') in process');
					self.trigg('append');

					// prepare
					widget.set_css();
					widget.set_trays();
					$.extend(true, widget.settings, widget.wo.settings);
					widget.init(); // after html elements check and before other processing
					widget.set_events();

//							ok(widget.wo.widget_id);
					// do smth with prepared data before process
					if (every_cb) every_cb(self, widget);

					// process
					widget.render();
					widget.children.load_all();

					widget.ready();
					//TODO: call done when children's loaded
					//widget.done();
//					widget.wo.unboxed = true;
					widget.trigg('append:after');
				}
			});
		};

		if (!f || f.has('children'))
		//TODO:children change: keep actual wo
		self.children.change = function(from_widget_id, to_widget_id, cb) {
			log(self.wo.widget_id + '.change widget ', (from_widget_id && from_widget_id.widget_id) || from_widget_id, ' to ', to_widget_id.widget_id || to_widget_id);
			
			if (from_widget_id == to_widget_id || (typeof to_widget_id == 'object' && from_widget_id == to_widget_id.widget_id)) {
				log('change child to himself', from_widget_id, to_widget_id);
				return false
			}

			self.children.remove(from_widget_id);
			self.children.append(to_widget_id, cb);

			var flag = false;
			self.wo.children.eachdef(function(tray_number, tray_array) {
				self.wo.children[tray_number].eachdef(function(widget_number, widget) {
					log(self.wo.widget_id + '.change', 'check wo.children[' + tray_number + '][' + widget_number + '](' + (typeof widget == 'object' ? widget.widget_id : widget) + ') <=> ', from_widget_id);
					if ((typeof widget == 'object' ? widget.widget_id : widget) == from_widget_id) {
						flag = true;
						self.wo.children[tray_number][widget_number] = CM.s.o[to_widget_id] || to_widget_id;
					}
				});
			});
			if (!flag) {
				self.wo.children.each(function(tray_number, tray_array) {
					if (tray_number == from_widget_id - 1) {
						self.wo.children[tray_number] = [to_widget_id];
					};
				});
			};
		};

		if (!f || f.has('children'))
		self.children.remove = function(widget_id) {
			log(self.wo.widget_id + '.remove: ', widget_id);
			// call child's unload
			// unless widget_id - unload all children
			if (self.children[widget_id]) {
				// remove one child
				log(self.wo.widget_id + '.remove: ', self.children[widget_id].wo.widget_id + '.unload');
				self.children[widget_id].unload();
			} else {
				if (typeof widget_id == 'number') {
					// remove all children in specified tray
					// call self for each widget in tray
					// widget_id => tray_id
					for (var i = 0; i < self.wo.children[widget_id - 1].length; i++) {
						log(self.wo.widget_id + '.remove tray ' + widget_id + ', widget: ', (typeof self.wo.children[widget_id - 1][i] == 'object' ? self.wo.children[widget_id - 1][i].widget_id : self.wo.children[widget_id - 1][i]));
						self.children.remove(typeof self.wo.children[widget_id - 1][i] == 'object' ? self.wo.children[widget_id - 1][i].widget_id : self.wo.children[widget_id - 1][i]);
					}
				} else if (!arguments.length) {
					// remove all children
					// call self for each tray
					for (var tray_id = 1; tray_id <= self.wo.children.length; tray_id++) self.children.remove(tray_id);
				}
			}
		};

		if (!f || f.has('children'))
		/**
		 *
		 * @param cb
		 */
		self.children.load_all = function(cb, force) {
//			var local_self = this == self.children ? self : this;
//			var self = this;

			if (!force && self.wo.children.length == 1 && self.wo.children[0].length == 1 && self.wo.children[0][0] == null) {
				CM.get_wo(null, function(json) {
					self.wo.children = json.children;
					self.children.load_all(cb, true);
				});
			} else {
				// call append for each child from wo.children
				for (var tray_number = 0; tray_number < self.wo.children.length; tray_number++) if (self.wo.children[tray_number] instanceof Array)
					for (var i = 0; i < self.wo.children[tray_number].length; i++)
						if (self.wo.children[tray_number][i] && !(CM.s.c[self.wo.children[tray_number][i]] || CM.s.c[self.wo.children[tray_number][i].widget_id]))
							self.children.append(self.wo.children[tray_number][i], cb);
			}
		};


		/*** render *****************************************************************/

		if (!f || f.has('render'))
		/**
		 *
		 */
		self.render = function() {
//			var self = this;
			log(self.wo.widget_id + '.render: self = ', self.wo.widget_id, 'parent = ', self.parent);
			self.stash = self.get_stash();
			self.trigg('render:before');

			if (self.wo.need_data && !self.wo.draw_if_null && !self.not_empty_data()) {
				log('render out: ', self.wo.widget_id);
				self.$rendered = $("<div></div>");
				return self;
			}

			try {
				self.$rendered = $.tmpl(CM.s.w[self.wo.widget_name].tmpl[self.wo.template_name], self.stash);
			} catch(e) {
				log('Render error: ', {error: e, widget: self.wo.widget_id, template: CM.s.w[self.wo.widget_name].tmpl[self.wo.template_name], stash: self.stash});
				self.$rendered = $("<div></div>");
			}

			self.$rendered.attr({
					  'id':             self.wo.widget_id
					, 'data-widget_id': self.wo.widget_id
			});

			self.trigg('render');

			self.format_data();

//			log('RENDER. self tray: ', self.wo.tray, '; parent trays: ', self.parent.trays);
			//TODO: append in right place
			if (self.wo.tray) $(self.parent.trays[self.wo.tray].selector, self.parent.$rendered).append( self.$rendered );

//			log('RENDER wid: ', self.wo.widget_id, self.$rendered);
//			log(self.parent.trays, self.wo.trays, self.parent.$rendered, self.$rendered);
			for (var i in self.events.sl) {
//				log(i, self.events.sl[i], self.events.fn[i].ev, self.events.fn[i].cb, self.$rendered);
				if (!(self.events.fn[i] instanceof Array)) self.events.fn[i] = [self.events.fn[i]];

				self.events.fn[i].each(function(n, obj) {if (obj != undefined && typeof obj.cb == "function") {
					if (obj.ev == '_process') obj.cb( self.$rendered.find( self.events.sl[i] ) );
					else self.$rendered.delegate(self.events.sl[i], obj.ev, obj.cb);
				}});
			}

			self.trigg('render:after');
			return self;
		};

		if (!f || f.has('render'))
		/**
		 *
		 * @param partial
		 */
		//TODO: rerender + partial rerender (without children)
		self.rerender = function(partial) {
			log(self.wo.widget_id + '.rerender');
//	    	$.tmplItem(self.$rendered).update();
//	    	self.$rendered = $('#'+self.wo.widget_id); // there is no id in new item!!!!!!!!! WTF!
			self.trigg('rerender:before');
			self.$rendered.html('').remove();
			self.render();
			self.trigg('rerender');
			self.update_data();
			self.format_data();
			self.trigg('rerender:after');
			return self
		};

		if (!f || f.has('render') || f.has('$'))
		/**
		 *
		 */
		self.$ = function(selector, context) {
			selector = self.events.sl[selector] || selector;

			if (typeof context == 'string') {
				context = self.$rendered.find(context);
			} else if (!(context instanceof jQuery)) {
				context = self.$rendered;
			}

			return context.find(selector);
		};

		if (!f || f.has('render'))
		/**
		 *
		 */
		self.formatters = {};

		if (!f || f.has('render'))
		self.format_data = function($els) {
			if (!$els || !$els.length) $els = self.$rendered.find('*[dtype]').not(self.trays_selector);
			$els.each(function(i, el) {
				var   $el = $(el)
					, dtype = $el.attr('dtype').replace(/\(.*\)/g, '')
					, dtype_params = ($el.attr('dtype').match(/\((.*)\)/) || ['', ''])[1].split(/,\s*/)
					;

				var formatter = u.find_in_parents(self, 'formatters.'+dtype, 'function');
				if (formatter) $el.set_val( formatter.apply(self, [$el.get_val(), $el].concat(dtype_params) ) );
			});
		};


		if (!f || f.has('render'))
		self.dlinkers = {};

		if (!f || f.has('render'))
		/**
		 *
		 */
		self.update_data = function($els, cb) {
			if (typeof $els == 'function') {
				cb = $els;
				$els = undefined;
			}

			if (!$els || !$els.length) $els = $('*[dlink]', self.$rendered).not(self.trays_selector);

			$els.each(function(i, el) {
				var dlink = $(el).attr('dlink');
				if (/^\=(\w+)(.*)?$/.test(dlink)) {
					var func = RegExp.$1;
					var param_string = RegExp.$2;

					var dlinker = u.find_in_parents(self, 'dlinkers.'+func, 'function');
					if (dlinker) $el.set_val( dlinker.apply(self, [$el, param_string] ) );

				} else {
					$(el).html( u.olink( self.wo.data, dlink, cb ) || '' );
//		    		$(el).effect("highlight", {color: '#FFFF00'}, 500);
				}
			});

			return self;
		};


		if (!f || f.has('render') || f.has('not_empty_data'))
		self.not_empty_data = function() {
			return !!u.object_keys(CM.s.d[self.wo.widget_id]).length;
		};


		/*** plugin *****************************************************************/

		if (!f || f.has('plugin'))
		/**
		 * include plugin
		 *
		 * @param plugin_name
		 * @param options
		 */
		self.use = function(plugin_name, options) {
			function do_use() {
//				log('all do_use:', self.wo.widget_id, plugin_name, CM.p[plugin_name]);
				CM.p[plugin_name].call(self, options);
				if (CM.p[plugin_name].prototype.settings['load_styles']) {
					self.css.push({ file: CM.p[plugin_name].prototype.settings['load_styles'], olink: 'plugins.res', stash: {module_name: plugin_name, silent: true} });
					CM.update_css('add', self);
				};
			};

			if (!CM.p[plugin_name]) {
				CM.gather({
					  link: {}
					, properties: [function() {return typeof CM.p[plugin_name] == 'function'}]
					, cb: do_use
					, once: function(link) {
						CM.load_plugin(plugin_name, function(loaded) {
//		    			    log('loaded: ', 'pl:' + plugin_name, CM.p[plugin_name]);
							CM.gather(link.gathering_id);
						});
					  }
				});
			} else if (typeof CM.p[plugin_name] == 'number') {
				CM.gather({link: CM.p[plugin_name], cb: do_use})
			} else if (typeof CM.p[plugin_name] == 'function') do_use();

			return self;
		};


		/*** setters ****************************************************************/

		if (!f || f.has('setters') || f.has('set_trays'))
		/**
		 * parse hash about self trays from template
		 * @param [context]
		 */
		self.set_trays = function(context) {
			var self = this; // self = widget
			if (!context) context = CM.s.w[self.wo.widget_name].tmpl[self.wo.template_name];
			var selectors = [];
			var rules = eval('(' + ($('script[type="text/set-trays"]', context).html() || 'undefined') + ')');
			if (rules) rules.each(function(i, rule) {
				for (var selector in rule) {
					self.trays.push({ selector: selector, capacity: rule[selector].length, types: rule[selector] });
					selectors.push(selector + ' *');
				}
			});
			self.trays_selector = selectors.join(', ');
			$('script[type="text/set-trays"]', context).remove();

			return self;
		};

		if (!f || f.has('setters') || f.has('set_events'))
		/**
		 * parse hash about active elements from template
		 * @param context
		 */
		self.set_events = function(context) {
			var self = this; // self = widget
			if (!context) context = CM.s.w[self.wo.widget_name].tmpl[self.wo.template_name];
			$.extend(self.events.sl, eval('(' + ($('script[type="text/set-events"]', context).html() || 'undefined') + ')'));
			$('script[type="text/set-events"]', context).remove();

			return self;
		};

		if (!f || f.has('setters') || f.has('set_css'))
		/**
		 * parse hash with css names from template
		 * @param context
		 */
		self.set_css = function(context) {
			var self = this; // self = widget
			if (!context) context = CM.s.w[self.wo.widget_name].tmpl[self.wo.template_name];
			var files = undefined;
			var html = $('script[type="text/set-css"]', context).html();
			try {
				files = eval('(' + (html || 'undefined') + ')');
			} catch(e) {
				if (e instanceof ReferenceError) files = html.match(/[\w\/\.]+\.css/g);
			}

			if (!files) return true;
//			log('CSS: ', self.wo.widget_id, files);
			if (!(files instanceof Array)) files = [files];
//			log('files: ', files);
			self.css = self.css.concat(files);
			CM.update_css('add', self);
			$('script[type="text/set-css"]', context).remove();

			return self;
		};


		/*** triggers ***************************************************************/

		if (!f || f.has('triggers') || f.has('trigg') || f.has('ear'))
		self.ear_triggers = {};            // {'ear_msg': cb(data, sender)}

		if (!f || f.has('triggers') || f.has('ear'))
		/**
		 *
		 * @param msg
		 * @param data
		 * @param cb
		 * @param sender
		 */
		self.ear = function(msg, data, cb, sender) {
			if (typeof msg == 'object' && arguments.length == 1) {
				data = msg.data || {};
				cb = msg.cb;
				sender = msg.sender;
				msg = msg.msg;
			}

//			if (typeof self.ear_triggers[msg] == 'function') self.ear_triggers[msg](data, sender, cb);
			self.trigg(msg, data, cb, sender);

			return self;
		};

		if (!f || f.has('triggers') || f.has('trigg'))
		/**
		 * fire "event" - call storaged function from self.ear_triggers
		 * @param trigger_name
		 */
		self.trigg = function(trigger_name, cb) {
			if (typeof cb == 'function' && arguments.length == 2) {
				// set trigger

				if (self.ear_triggers[trigger_name]) {

					// create array of cb if need
					if (typeof self.ear_triggers[trigger_name] == 'function') {
						self.ear_triggers[trigger_name] = [ self.ear_triggers[trigger_name] ];
					}

					self.ear_triggers[trigger_name].push(cb);
				} else {
					self.ear_triggers[trigger_name] = [ cb ];
				}

			} else if (cb === null && self.ear_triggers[trigger_name]) {
				// unbind function
				delete self.ear_triggers[trigger_name];

			} else if (self.ear_triggers[trigger_name]) {
				// run trigger

				var params = Array.prototype.slice.call(arguments, 1);
				var to_call = [ trigger_name ];

				if (cb !== false || !cb.has('only')) {
					to_call.unshift(trigger_name + ':before')
					to_call.push(trigger_name + ':after');
				}

				to_call.each(function(i, name) {
					// create array of triggers if need
					if (typeof self.ear_triggers[name] == 'function') self.ear_triggers[name] = [ self.ear_triggers[name] ];

					if (self.ear_triggers[name] && self.ear_triggers[name] instanceof Array) self.ear_triggers[name].each(function(i, cb) {
						var returned_params = undefined;
						if (typeof cb == 'function') returned_params = cb.apply(self, params);
						if (returned_params) params = returned_params;
					});
				});

			} else if (typeof self.ear_triggers[null] == 'function' && !(cb && cb.has && cb.has('silent'))) {
				// run default trigger
				self.ear_triggers[null].apply(self, arguments);
			}


			return self;
		};
		if (!f || f.has('triggers') || f.has('ear:null'))
		self.ear_triggers[null] = function(msg, data, sender, cb) {
//			u.dump(
//				  (self.wo ? self.wo.widget_name + '(' + self.wo.widget_id + ')' : self)
//				+ '.ear: '
//				, arguments
//			);
		};

		if (!f || f.has('triggers') || f.has('ear:update'))
		self.ear_triggers['update'] = function(data, sender, cb) {
			$.extend(true, self.wo.data, data);
//			self.update_data(function(link, res) {
//				if (link.match(/.*sum$/)) res = CM.curr(res);
//				return res;
//			});
			self.update_data();
			self.format_data();
			if (cb) cb();
		};

		if (!f || f.has('triggers') || f.has('ear:refresh'))
		self.ear_triggers['refresh'] = function(data, sender, cb) {
			CM.get_widget_data(self.wo.widget_id, function(new_widget_data) {
				CM.s.d[self.wo.widget_id] = new_widget_data;
				self.wo.data = new_widget_data;
				self.rerender();
				if (cb) cb();
			});
		};

		if (!f || f.has('triggers') || f.has('ear:reload'))
		self.ear_triggers['reload'] = function(data, sender, cb) {
			//TODO: reload widget

			var parent = self.parent;

			CM.get_wo(self.wo.widget_id, function(wo) {
				parent.children.append(wo);
				if (cb) cb();
			});

			self.unload();
			delete CM.s.w[self.wo.widget_name];
		};


		/*** eventers ***************************************************************/

		if (!f || f.has('events'))
		self.events = {sl: {}, fn: {}};

		if (!f || f.has('events') || f.has('set'))
		self.events.set = function(eventer, event_name, cb) {
			if (arguments.length == 2 && typeof event_name == 'function' && eventer.match(/^\w+\.\w+$/)) {
				cb = event_name;
				event_name = eventer.split(/\./)[0];
				eventer = eventer.split(/\./)[1];
			}


//			self.events.fn[eventer] =
//				self.events.fn[eventer]
//				? (self.events.fn[eventer] instanceof Array ? )
//				:
//				;
			if (eventer && event_name && cb) self.events.fn[eventer] = {ev: event_name, cb: cb};
		};


		/*** other ******************************************************************/


		if (!f || f.has('init'))
		/**
		 *
		 */
		self.init = function() {
			return self;
		};

		if (!f || f.has('done'))
		/**
		 * function to be called when the widget is ready, and his children
		 * must returns true
		 */
		//TODO: gathering widget with children
		self.done = function() {
			return true
		};

		if (!f || f.has('render') || f.has('stash') || f.has('stash_robber'))
		/**
		 * modify stash object for templater
		 * @param stash
		 */
		self.stash_robber = function(stash) {
//			return $.extend(true, stash, {})
			return stash;
		};

		if (!f || f.has('render') || f.has('stash') || f.has('get_stash'))
		self.get_stash = function() {
			var stash = CM.exstash(self.wo.data, {voc: self.wo.voc, img_prefix: u.t(CM.settings.urls.widget.img, CM.exstash({widget_name: self.wo.widget_name}))});
			if (self.stash_robber && typeof self.stash_robber == 'function') stash = self.stash_robber(stash);
			return stash;
		};

		if (!f || f.has('unload'))
		/**
		 * Unload widget
		 */
		self.unload = function() {
			self.trigg('onUnload:before', 'only silent');
			// unload children
			for (var widget_id in self.children) if (typeof self.children[widget_id] != "function") self.children[widget_id].unload();
			// clear widget div and remove it
			for (var tray_id = 1; tray_id < self.trays.length; tray_id++) $(self.trays[tray_id].selector, self.$rendered).html('');
			self.$rendered.remove();
			// release css
			CM.update_css('remove', self);

			self.trigg('onUnload', 'only silent');

			// delete
			delete self.parent.children[self.wo.widget_id];
			delete CM.s.c[self.wo.widget_id];
			delete CM.s.d[self.wo.widget_id];
			delete CM.s.o[self.wo.widget_id];
			self.trigg('onUnload:after', 'only silent');
		};


//		if (!f || f.has('navigation') || f.has('navigate'))
//		/**
//		 *
//		 * @param url
//		 */
//		self.navigate = function(url) { return false };
//
//		if (!f || f.has('navigation') || f.has('register_navigate'))
//		self.register_navigate = function() {
//			if (CM.s.q.navigator) self.navigate_queue_id = CM.s.q.navigator.push(self.navigate);
//			else log('Navigator not found');
//
//			return self;
//		};

		if (!f || f.has('ready'))
		/**
		 * 
		 */
		self.ready = function() {
			return self;
		};
		
		if (!f || f.has('attributes') || f.has('wo'))
		CM.s.o[self.wo.widget_id] = self.wo;

		if (arguments.callee.prototype.constructor.constructor_hook.length) arguments.callee.prototype.constructor.constructor_hook.each(function() { this.call(self) });

	};
	self.W.constructor_hook = [];
	/*** end of widget constructor ***/

	self.identify = function(type, field) {
		if (!type) return CM;
		if (!field) field = 'widget_name';

		var finded_widgets = [];

		for (var i in self.s.c) {
			if (self.s.c[i].wo[field] == type) finded_widgets.push(self.s.c[i]);
		}

		return finded_widgets;
	};

	/**
	 * Get wo
	 * @param {String} widget_id
	 * @param {Function} cb callback
	 */
	self.get_wo = function(widget_id, cb, params) {
		$.get_json({method: 'getObject', id: widget_id, type: 'widget', params: params || null}, cb);
	};

	/**
	 * Get wo.data
	 * @param {String} widget_id
	 * @param {Function} [cb] callback
	 * @param {Object} [params]
	 */
	self.get_widget_data = function(widget_id, cb, params) {
		$.get_json({method: 'getData', id: widget_id, type: 'widget', params: params || null}, cb);
	};

	/**
	 * Returns CM.stash extended by any other object. Does not change CM.stash.
	 * @example
	 * var stash = CM.exstash(widget_object);
	 * var url = u.t(url_template, stash);
	 */
	self.exstash = function() {
		var stash = {};
		$.extend(true, stash, CM.stash);
		for (var i = 0; i <= arguments.length; i++) $.extend(true, stash, arguments[i]);
		return stash;
	};

	/**
	 * Send log message to server
	 *
	 * @param code
	 * @param id
	 * @param msg
	 */
	self.log = function(code, id, msg) {
		$.get_json({method: 'log', data: u.args2obj(arguments)})
	};

	/**
	 * Load module
	 * @param module_name
	 * @param {Function} [cb]
	 */
	self.load_module = function(module_name, cb) {
		self.include(true, 'mod', module_name, cb);
	};

	/**
	 * Load plugin
	 * @param module_name
	 * @param {Function} [cb]
	 */
	self.load_plugin = function(module_name, template_name, cb) {
		self.include(false, 'plugins', module_name, template_name, cb);
	};

	self.update_css = function(action, widget, passed_olink, passed_stash_up) {
		if (!action || !widget) return false;

		widget.css.each(function(i, file) {
			var stash_up = passed_stash_up || {};
			var olink = passed_olink;

			if (typeof file != 'string') {
				$.extend(stash_up, file.stash, passed_stash_up);
				if (!olink) olink = file.olink;
				file = file.file;
			}

			// prepare path
			var path = file, exstash = CM.exstash({template_name: widget.wo.template_name, widget_name: widget.wo.widget_name, widget_id: widget.wo.widget_id}, stash_up);

			// global css
			if (CM.settings.re.global_css_tag.test(file)) path = [ 'css', RegExp.$1 ];
			// olink in filename
			else if (/\//.test(file)) {
				path = file.split(CM.settings.re.split_to_filename); // split to olink and filename, like: 'urls/widget/tmpl/some.css' => ["urls/widget/tmpl", "some.css"]
				if (!path[0]) path[0] = 'widget/css'; // for files like /some.css
				path[0] = path[0].replace(/\//g, '.');
			}
			// olink passed as params
			else if (olink) {
				path = [ olink, file ];
			}
			// link to widget
			else path = [ 'widget.css', file ];

			//now path is array [olink, filename]
			path[0] = u.t(u.olink(CM.settings.urls, path[0]), exstash);
			if (!/\/$/.test(path[0]) && !/^\//.test(path[1])) path[0] += '/';
			// now path[0] is string with full path to file and path[1] - file name only

			exstash.filename = path[1];
			var filepath = path.join('');
			var selector = 'link[href="' + filepath + '"]';

			if (action == 'add') {
				if (!CM.s.s[filepath]) CM.s.s[filepath] = {widgets: {}, linked_to: {}};

				CM.s.s[filepath].widgets[widget.wo.widget_name + '/' + widget.wo.template_name] = true;
				CM.s.s[filepath].linked_to[widget.wo.widget_id] = true;

				if (!$(selector).length) $('<link>').attr({href: filepath, type: 'text/css', rel: 'stylesheet'}).appendTo('head');
				else {
					if (!stash_up.silent && u.object_keys(CM.s.s[filepath].linked_to).length > 1) log('duplicate loading ' + filepath + ' in ' + u.object_keys(CM.s.s[filepath].widgets).map(function(e, i) {return e+'.html'}).join(', '));
					$(selector + '[disabled]').enable();
				}
			} else {

				delete CM.s.s[filepath].linked_to[widget.wo.widget_id];
				if (!u.object_keys(CM.s.s[filepath].linked_to).length) $(selector).disable();
			}
		});
	};

	self.wrap_template = function(template, wo) {
		return '<div'
				+ ' data-widget_name'   + '="' + wo.widget_name      + '"'
				+ ' data-template_name' + '="' + wo.template_name    + '"'
				+ ' class'              + '="' + 'w-'+wo.widget_name + '"'
				+ '>'
				+ template
				+ '</div>';
	};

	self.ver = function() {
		return self.settings.product_version
			? self.settings.product_version + ' (Alien-B: ' + self.settings.version + ')'
			: self.settings.version
			;
	};

	self.p = {
	};
	self.plugins = self.p;

//	self.W.apply(self, arguments);
})();

//CM.children = CM.s.o; // hack for keep children into not typical storage


window.onError = log;

/**
 * Widget loader
 *
 * @param {widget_object|widget_id} wo
 * @param {Object} parent Parent object
 */
CM.load = function(wo, parent, cb) {
//	log('load called for wo = ', wo, 'parent = ', parent);
	if (wo && ['string', 'number'].has(typeof wo) && !CM.s.c[wo]) { // if wo == widget_id
//		log('wo ' + wo + ' is widget_id, get_wo()');
		CM.get_wo(wo, function(json) {
			if (json.status != 'error') {
				if (!CM.s.o[json.widget_id]) CM.s.o[json.widget_id] = {};
				$.extend(true, CM.s.o[json.widget_id], json);

				CM.load(json, parent, cb)
			}
		});
		return true;
	} else if (CM.s.c[wo]) {
		log('WOed: ', wo, CM.s.c[wo].wo);
		wo = CM.s.c[wo].wo;
	}

	if (!CM.s.w[wo.widget_name]) CM.s.w[wo.widget_name] = {tmpl: {}, js: undefined};

	CM.gather({
		  link: {widget_id: wo.widget_id}
		, properties: [
				  function() { return !wo.need_data || !!CM.s.d[wo.widget_id] }
				, function() { return CM.s.w[wo.widget_name].js !== undefined && (wo.template_name === null || CM.s.w[wo.widget_name].tmpl[wo.template_name] !== undefined) }
//				  function() { log('gathering ', wo.widget_id, 'need_data = ', wo.need_data, 'data = ', CM.s.d[wo.widget_id], 'return: ', !wo.need_data || !!CM.s.d[wo.widget_id]);  return !wo.need_data || !!CM.s.d[wo.widget_id] }
//				, function() { u.dump('gathering ', wo.widget_id, '.w gathered = ', CM.s.w[wo.widget_name]); return CM.s.w[wo.widget_name].gathered }
		  ]
		, cb: function(w_link) {
//			log('gathered!', wo.widget_id);
			// create widget instance
			CM.s.w[wo.widget_name].js.prototype = new CM.W();
//			log('create widget cb: ', (parent.wo && parent.wo.widget_id) || parent);
			var widget = parent.children[wo.widget_id] = new CM.s.w[wo.widget_name].js(wo);
			widget.parent = parent;
			if (CM.settings.required_plugins) {
				if (!(CM.settings.required_plugins instanceof Array)) CM.settings.required_plugins = CM.settings.required_plugins.qw();
				CM.settings.required_plugins.each(function(i, name) {
//					ok(widget.wo.widget_id, name);
					widget.use(name)
				})
			}

			// cache object
			CM.s.c[wo.widget_id] = widget;

//			// widget.init();
			if (cb && typeof cb == 'function') cb(widget);
		}
		, once: function(w_link) {
//			log('gather load start: ', wo.widget_id);

			// get wo.data
			if (!!wo.data) CM.s.d[wo.widget_id] = wo.data;
			else if (!CM.s.d[wo.widget_id] && wo.need_data)
				CM.get_widget_data(wo.widget_id, function(data) {
//  				log('loading: ', wo.widget_id, 'data loaded: ', data);
					CM.s.d[wo.widget_id] = data;
					wo.data = data;
//	    			if (data.voc == null) data.voc = {};
					if (!w_link.gathered) CM.gather(w_link.gathering_id);
				});

			var stash = CM.exstash(wo);


			// load files
			if (CM.s.w[wo.widget_name].gathered && !CM.s.w[wo.widget_name].tmpl[wo.template_name]) CM.s.w[wo.widget_name].gathered = false;
			if (CM.s.w[wo.widget_name] && !( CM.s.w[wo.widget_name].gathered || CM.s.w[wo.widget_name].gathering_id )) {
				CM.gather({
					  link: CM.s.w[wo.widget_name]
					, properties: [ 'js', 'link.tmpl["' + wo.template_name + '"]']
//					, cb: function() {log('gathered! ', wo.widget_name)}
					, once: function(f_link) {
						// get js
						if (!CM.s.w[wo.widget_name].js)
							$.get(u.t(CM.settings.urls.widget.js, stash)).complete(function(code) {
//								log('get JS: ', wo.widget_name);
								var tmp_function;
								if (code.status != 404) {
									// addons preloading
									if (code.responseText.match(CM.settings.re.includes)) {
										var tmp_array = []; // [include_text, directive(use or include), type, name]; use 'use' for create constructor or 'include' for object
										var re = CM.settings.re.includes;
										var voc = {'plugin': 'plugins', 'module': 'mod'};
										while (tmp_array = re.exec(code.responseText)) {
											tmp_array[2] = voc[tmp_array[2]] || tmp_array[2];

											var mark = tmp_array[2] + ':' + tmp_array[3];
											code.responseText = code.responseText.replace(tmp_array[0], '');
											re.lastIndex = re.lastIndex - tmp_array[0].length;
											CM.gather({
												  link: f_link.gathering_id
												, properties: mark
											});
											(function(mark) {CM.include(tmp_array[1] != 'use', tmp_array[2], tmp_array[3], function(l) {
												f_link[mark] = true;
												CM.gather(f_link.gathering_id)
											})})(mark);

										}
									}

									// create widget constructor
									CM.s.w[wo.widget_name].js = eval('tmp_function = ' + code.responseText);
								} else {
									log('Loading error: ', u.t(CM.settings.urls.widget.js, stash));
								}
								if (!f_link.gathered) CM.gather(f_link.gathering_id);
							});

						// get template
						if (!wo.template_name) wo.template_name = wo.widget_name;
						if (!CM.s.w[wo.widget_name].tmpl[wo.template_name])
							$.get(u.t(CM.settings.urls.widget.tmpl, stash), function(html) {
//								log('get HTML: ', wo.widget_name);
//								ok(wo);
//								CM.s.w[wo.widget_name].tmpl[wo.template_name] = '<div id="' + wo.widget_id + '">' + html + '</div>';

								wo.sub_template_prefix = wo.widget_name + '-' + wo.template_name;
								html = html.replace(/(\$sub\_template)\-/gim, wo.sub_template_prefix + '-');

								// process sub_tmpl
								html = CM.wrap_template(html, wo);

								var ex = u.extract_tag(html, 'script', {type: 'text/sub_tmpl'});
								CM.s.w[wo.widget_name].tmpl[wo.template_name] = ex.html;
								ex.tags.each(function(i, tmpl) {
									$.template(wo.sub_template_prefix + '-' + $(tmpl).attr('name'), $(tmpl).html());
								});
								$.template(wo.sub_template_prefix, ex.html);

								
//								log(wo.widget_name, wo.template_name, 'sub_tmpl count: ', $('script[type="text/sub_tmpl"]', CM.s.w[wo.widget_name].tmpl[wo.template_name]).length);

//								$('script[type="text/sub_tmpl"]', CM.s.w[wo.widget_name].tmpl[wo.template_name]).each(function(i, tmpl) {
//									$.template(wo.widget_name + '-' + wo.template_name + '-' + $(tmpl).attr('name'), tmpl);
//								});
////								CM.s.w[wo.widget_name].tmpl[wo.template_name].replace(/<script.*sub_tmpl.*>.*<\/script>/gim, '');

								if (!f_link.gathered) CM.gather(f_link.gathering_id);
							});
					  }
				});
			}

		}
	});
};


/**
 * Load addon (plugin, module, etc)
 * @param {Boolean} construct If true, then create object, else leave constructor
 * @param {String} type (mod | plugins)
 * @param {String} module_name
 * @param {Function} [cb]
 */
CM.include = function(construct, type, module_name, template_name, cb) {
//	u.dump('include start: ', arguments);
	var self = CM;
	if (typeof template_name == 'function' && !cb) {
		cb = template_name;
		template_name = undefined;
	}
	if (!self[type]) self[type] = {};

	var js_url, tmpl_url, res_url, gather_id, olink;

	if (/\//.test(module_name)) {
		olink = module_name.split(CM.settings.re.split_to_filename);
		module_name = olink[1];
		olink[0] = olink[0].replace(/\//g, '.');
	}
	else olink = [type];

	olink = u.olink(CM.settings.urls, olink[0]);
	if (olink) {
		if (typeof olink == 'string') js_url = olink;
		else {
			js_url = olink.js;
			tmpl_url = olink.tmpl;
			res_url = olink.res;
		}
	}
	else js_url = CM.settings.urls.modules;

//	if (CM.settings.urls[type]) {
//		js_url = CM.settings.urls[type].js;
//		tmpl_url = CM.settings.urls[type].tmpl;
//		res_url = CM.settings.urls[type].res;
//	}
//	else js_url = CM.settings.urls.modules;

	function load_tmpl(template_name) {
		if (template_name == null || typeof template_name != 'string') template_name = module_name;
//			log('include: ', module_name, tmpl_url, template_name);
		$.get(u.t(tmpl_url, CM.exstash({module_name: module_name, template_name: template_name})))
			.complete(function(jqXHR) {
//					log(gather_id, jqXHR);
				u.get_gather(gather_id)['templates'][template_name] = u.get_gather(gather_id)['tmpl'] = jqXHR.status != 404 ? jqXHR.responseText : '';
				CM.gather(gather_id);
			});
	}

	if (!self[type][module_name]) {
		var addon = {settings: {}, templates: {}};
		gather_id = CM.gather({
			link: addon
			, properties: 'js' + (tmpl_url && template_name ? ' tmpl' : '')
			, cb: function(link) {
//					log('loaded module in [' + type + ']: ', module_name, link);
				var tmp_function;
				try {
					eval('tmp_function = ' + link.js);
					tmp_function.prototype.settings = link.settings;
					tmp_function.prototype.templates = link.templates;
					if (link.tmpl) tmp_function.prototype.tmpl = link.tmpl;
					if (res_url) tmp_function.prototype.urls = {res: u.t(res_url, {module_name: module_name, include_type: type})};
					self[type][module_name] = construct ? new (tmp_function)(CM) : tmp_function;
				} catch(e) { log('Load module [' + type + '].' + module_name + ' error: ', e) }
				if (cb && typeof cb == 'function') cb(self[type][module_name]);
			}
		});

		// init placeholder
		self[type][module_name] = gather_id;

		// load js
		$.get(u.t(js_url, CM.exstash({module_name: module_name}))).complete(function(jqXHR) {
			u.get_gather(gather_id)['js'] = jqXHR.status != 404 ? jqXHR.responseText : '';
			if (jqXHR.status == 404) log('Module "' + module_name + '" not found');
			else if (jqXHR.responseText.match(CM.settings.re.plugin_settings)) {
				var tmp_array = [];
				while (tmp_array = CM.settings.re.plugin_settings.exec(jqXHR.responseText)) {
					addon.settings[tmp_array[1]] = tmp_array[2].repair_types();
				}
				if (addon.settings['load_template']) {
					CM.gather(gather_id, 'tmpl');
					load_tmpl(addon.settings['load_template']);
//						log(gather_id, CM.s.q.gather[gather_id]);
				}
			}
			CM.gather(gather_id);
		});

		// load template
		if (tmpl_url && template_name) load_tmpl(template_name);
	} else if (typeof self[type][module_name] == "number") {
//			log('called include for: ', type, module_name, self[type][module_name]);
		CM.gather({link: self[type][module_name], cb: cb});
//		} else if (template_name && !self[type][module_name].prototype.templates[template_name] && tmpl_url) {
//			//TODO: load more that one template for one plugin
//			load_tmpl(template_name);
	} else if (cb && typeof cb == 'function') {
		cb(self[type][module_name]);
	}
};


/**
 * Objects observer
 * Use it like function, not like object instance
 *
 * @this CM
 * @param {Object|Number} link Observed object or object.gathering_id, or settings object with link.link inside
 * @param {Array|String} properties List of properties that must exist in the observed object. Here you can set or add properties
 * @param {Function} cb Function to be executed when the object is fully formed. Also you can set or add callbacks
 * @param {Function} once Function that may be called only once, when gather is creating
 * @param {Function} every Function that will be called every time
 * @return {Number} gathering_id If it's new object to observe, return it's number in queue
 */
CM.s.q['gather'] = [];
CM.gather = function(link, properties, cb, once, every) {
//	console.debug('>>>>>>>> call with: ', link, properties, cb);
//	if (arguments.length == 1) log('gather call with: ', link, CM.s.q['gather'][link]);
	var queue = CM.s.q['gather'];
	if (!arguments.length || (arguments.length == 1 && link == undefined)) { // check all
//		for (var i = 0; i < queue.length; i++) if (queue[i]) log('checkall['+i+']: ', queue[i].link);
		for (var i = 0; i < queue.length; i++) if (queue[i]) CM.gather(i);
		return true;
	}

	if (arguments.length == 1 && link.link) {
		properties = link.properties;
		cb = link.cb;
		once = link.once;
		every = link.every;
		link = link.link;
	}

	var gathering_id = link.gathering_id;

	if (properties && typeof properties == 'string') properties = properties.qw();
	if (cb && !(cb instanceof Array)) cb = [cb];
	if (once && once == 'every') once = every;
	if (once && !(once instanceof Array)) once = [once];
	if (every && !(every instanceof Array)) every = [every];

//	console.log('properties: ', properties, 'cb: ', cb);

	if (typeof link == 'number') {
//		log('process number link');
		if (queue[link]) {
			gathering_id = link;
			var gather_obj = queue[gathering_id];
			link = gather_obj.link;

			if (properties != undefined) gather_obj.properties = gather_obj.properties.concat(properties);
			properties = gather_obj.properties;

			if (cb != undefined) gather_obj.cb = gather_obj.cb ? gather_obj.cb.concat(cb) : cb;
			cb = gather_obj.cb;

			if (every != undefined) gather_obj.every = gather_obj.every.concat(every);
			every = gather_obj.every;
		} else {
			return false
		}
	}

//	log('name = ' + (link ? (link.name || link) : 'no link,') + ' [' + gathering_id + ']');

	delete link.gathered;
//	gathering_id = gathering_id || link.gathering_id;

//	console.log('gathering_id = ', gathering_id);

	var run = true;
	for (var i = 0; i < properties.length; i++) {
		switch (typeof properties[i]) {
			case 'object':
				run = !properties[i].gathering_id || properties[i].gathered;
				break;
			case 'function':
				run = !!properties[i](link);
				break;
			case 'string':
				if (properties[i].match(/\./)) {
					run = !!eval(properties[i]);
					break;
				}
			case 'number':
				run = link[properties[i]] != undefined;
				break;
		}
//		log('gather check: ', properties[i], run);
		if (!run) break;
	}

//	log('run = ' + run);
	if (run) {
//		log('close gather');
		delete link.gathering_id;
		link.gathered = true;
		if (gathering_id != undefined) delete queue[gathering_id];
		if (cb) cb.each(function(n, item) { item(link) });
//		log('gathering_id after delete = ' + link.gathering_id);
//		CM.s.q['gather'] = queue.slice(0, gathering_id).concat( queue.slice(gathering_id + 1) );
		CM.gather();
	} else if (gathering_id == undefined) {
		link.gathering_id = queue.push({link: link, properties: properties, cb: cb, every: every}) - 1;
//		log('new gather created, id = ' + link.gathering_id);
		if (once) once.each(function() { this(link) });
	} else {
		if (every) every.each(function() { this(link) });
	}

//	log('<<<<<<<< gather');
	return link.gathering_id;
};



/*** start ***/ // call it before all but after settings if you want to use plugins in CM.root
CM.start = function(settings) {
	$.extend(true, CM.settings, settings);

	CM.W(CM, 'ear trigg ear:null');
	CM.ear_triggers[null] = function(msg, data) { u.dump('CM.ear( ', arguments, ' )') };

	// root widget with default settings

	CM.s.d['root'] = {};
	CM.s.w['root'] = {gathered: true, tmpl: {'root': ''}, js: function(wo) {
		var self = this;
		CM.W.apply(self);
		$.extend(true, self.wo, wo);
	}};
	CM.load({
		template_name: null
	  , widget_name: 'root'
	  , widget_id: 'root'
	  , widget_size_type: 'root'
	}, CM, function(widget) {
		widget.$rendered = $(document);
	});
	CM.root = CM.children.root;
	CM.root.parent = null;
	delete CM.children;

	CM.root.set_trays();
	CM.root.set_css();
	CM.root.set_events();
};