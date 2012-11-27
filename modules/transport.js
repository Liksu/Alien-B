/**
 * Created by Peter Bortchagovsky.
 * 23.09.11 0:01
 */

function(CM) {
	var self = this;
	self.run = false;
	self.settings = {
		count: 1
	  , start_polling_delay: 750  // ms
	  , timeout: 15*60000         // ms
	  , start_delay: 2500         // ms
	};
	self.queue = CM.s.q['pollings'] = {};

	self.not = function(stat) {
		if (stat != undefined) self.run = !!stat;
		else self.run = !self.run;
		
		if (!self.run) {
			for (var i in self.queue) if (self.queue[i].readyState == 1) self.queue[i].abort();
		} else {
			var delay = 0;
			for (var i = 0; i < self.settings.count; i++) {
				delay += Math.round((Math.random()*self.settings.start_polling_delay)-0.5);
				setTimeout(self.conveyor, delay);
			}
		}
	};

	self.conveyor = function() {
		var data = {};
		var jqxhr = $.ajax({
			url: CM.settings.urls.events + 'connect/' + CM.instance_id
		  , data: u.object_to_json(data)
		  , async: true
		  , timeout: self.settings.timeout
		  , type: 'post'
		  , dataType: 'json'
		  , success: function(json, textStatus, jqXHR) {
				if (self.data_robber && typeof self.data_robber == "function") json = self.data_robber(json);
				if (json.events) {
//					log(json.events);
					json.events.each(function(i, msg) {
						if (msg.recipient && CM.s.c[msg.recipient]) CM.s.c[msg.recipient].ear(msg.message_type, msg.data);
						else CM.ear('server_said_to_somebody', msg);
					});
				} else CM.ear('server_said', json);
			}
		  , error: function(e, jqxhr, settings, exception) {
				CM.ear('get_data_error', {e: e, jqxhr: jqxhr, settings: settings, exception: exception});
			}
		  , complete: function(jqXHR, textStatus) {
				delete self.queue[jqxhr.id];
				if (self.run) self.conveyor();
			}
		});

		do { jqxhr.id = ''.rand(12) } while ( self.queue[jqxhr.id] );
		self.queue[jqxhr.id] = jqxhr;
	};


	// run pollings
	setTimeout(function() { self.not() }, self.settings.start_delay);

};
