var test = require('tap').test;
var mountie = require('../');
var request = require('request');
var seaport = require('seaport');
var http = require('http');

var port = {
    sea : Math.floor(Math.random() * 5e4 + 1e4),
    web : Math.floor(Math.random() * 5e4 + 1e4),
};

var ports = seaport.createServer({ secret : 'beep boop' });
ports.listen(port.sea);

var server = mountie(ports);
server.listen(port.web);

var p0 = seaport.connect(port.sea, { secret : 'beep boop' });
var p1 = seaport.connect(port.sea, { secret : 'beep boop' });

var server0 = http.createServer(function (req, res) {
    res.end('hello cruel world\n');
});

var server1 = http.createServer(function (req, res) {
    res.end('boop\n');
});

p0.service('web.localhost', function (port, ready) {
    server0.listen(port, ready);
});

p1.service('web.localhost', { mount : '/beep' }, function (port, ready) {
    server1.listen(port, ready);
});

test('compose', function (t) {
    t.on('end', function () {
        ports.close();
        p0.close();
        p1.close();
        server.close();
        server0.close();
        server1.close();
    });
    
    setTimeout(function () {
        t.end();
    }, 1000);
}); 
