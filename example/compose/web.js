var http = require('http');
var ports = require('seaport').connect(7000, { secret : 'beep boop' });

var server = http.createServer(function (req, res) {
    res.end('hello cruel world\n');
});

ports.service('web.localhost', function (port, ready) {
    server.listen(port, ready);
});
