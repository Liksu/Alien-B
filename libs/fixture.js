// RTFM:
// http://api.jquery.com/jQuery.ajaxPrefilter/
// http://api.jquery.com/extending-ajax/

var Fixture = new function() {

	var fixtures = [];
	var self = this

	/**
	  url: строка|регексп, func: функция
	*/
	this.add = function(url, func) {
		fixtures.push({url: url, func: func});
	}

	this.enabled = true;

	function findFixture(url) {
		for(var i=0; i<fixtures.length; i++) {
			var fixtureUrl = fixtures[i].url;
			if (fixtureUrl.test && fixtureUrl.test(url) || fixtureUrl == url) {
				return fixtures[i];
			}
		}
	}

	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {

		if(!self.enabled){
			return;
		}

		var fixture = findFixture(options.url);
		if (!fixture) return;

		// add the fixture datatype so our fixture transport handles it
		options.dataTypes.unshift("fixture");
		options.fixture = fixture;
	});

	$.ajaxTransport("fixture", function(options, originalOptions, jqXHR) {

		// remove the fixture from the datatype
		options.dataTypes.shift();

		//we'll return the result of the next data type
		var result = options.fixture.func(options, originalOptions, jqXHR);
		var delay = result && result.delay || 1000;

		var timerId;

		return {

			send: function( headers, callback ) {

				// callback after a timeout
				timerId = setTimeout(function() {
					callback.apply(null, result );
				}, delay );
			},

			abort: function() {
				clearTimeout(timerId)
			}
		};

	});


}

/**
 * Function for simplest addition of fixture
 * @copyright Peter Bortchagovsky
 * @require utils::rand
 */
Fixture.short = function(uri, data, delay, status) {
	if (status == undefined) status = 200;
	if (delay == undefined) delay = (10).rand() + 2;
	Fixture.add(uri, function() {
		log('Fixture called for ' + arguments[1].url);
		var response = [status, 'success', {json: typeof data == 'function' ? data.apply(this, arguments) : data}];
		response.delay = delay;
    
		return response;
	});
}