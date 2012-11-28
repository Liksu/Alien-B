/**
 * Dummy responses for debug without api server
 * Created by Peter Bortchagovsky.
 */

Fixture.short(/^\/events\/connect/, function() {
	return {
		status: 'ok'
		, events: [{
			message_type: 'update'
			, recipient: 'hello_world'
			, data: { time: u.getDT() }
		}]
	}}, 5000);

Fixture.short(/^\/events\/register/, {
		status: 'ok'
		, agentId: u.uid()
	});

Fixture.short('/api/getSettings', {
		lang: 'ru'
		, theme: 'default'
		, curr: 'UAH'
	});


Fixture.short('/api/getObject', function() {
	var json = {};

	switch (arguments[1].data.id) {
		case 'hello_world':
			json = {
				widget_id: 'hello_world'
				, widget_name: 'hello_world'
				, template_name: 'main'
				, need_data: false
				, draw_if_null: true
				, children: []
				, data: {}
				, tray: 1
				, trays: []
				, voc: { title: 'Demo page' }
			};
			break;
		default:
			json = {
				children: [['hello_world']]
			};
	};
	return json;
});
