var Clarifai = require('./clarifai_node');
var config = require('./config.json');
var util = require('util');

Clarifai.initAPI(config.client_id, config.client_secret);
var video = null;
var url = null;
var id = null;

module.exports = function (lib, http_response) {
	lib.request({
		method: 'GET',
		path: '/me/videos?sort=date&direction=asc&fields=uri,embed,files&per_page=3'
	}, function (err, res) {
		var promises = [];
		for (var i = 0; i < res.data.length; i++) {
			if (res.data[i].files) {
				url = res.data[i].files[0].link_secure;
				promises.push(clarifai(url, res.data[i]));
				console.log('add promise');
			}
		}
		Promise.all(promises)
			.then(function (responses) {
				console.log('then');
				for(var i = 0; i < responses.length; i++) {
					video = responses[i].video;
					classes = responses[i].res.results[0].result.tag.classes[0];
					http_response.write(video.uri + ' ');
					http_response.write(classes.join(','));
					http_response.write('<br />' + video.embed.html);
				}
				console.log('end');
				http_response.end();
			})
			.catch(function (err) {
				console.log(err);
			});
	});
}

function clarifai(url, vid) {
	return new Promise(function (resolve, reject) {
		Clarifai.tagURL(url, vid.uri, function (err, res) {
console.log('clarifiai response');
console.log(err);
			if (err) {
				reject(err);
			} else {
				resolve({video: vid, res: res});
			}	
		});
	});
}
