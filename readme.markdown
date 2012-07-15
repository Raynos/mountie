# mountie

Compose many web server processes into cohesive applications by mounting web
services registered with [seaport](https://github.com/substack/seaport) at
mount paths.

# example

First write a mountie hub:

``` js
var mountie = require('mountie');
var seaport = require('seaport');

var ports = seaport.createServer({ secret : 'beep boop' });
ports.listen(7000);

var server = mountie(ports);
server.listen(80);
```

Next write web servers that register themselves to listen on hostnames:

``` js
var http = require('http');
var ports = require('seaport').connect(7000, { secret : 'beep boop' });

var server = http.createServer(function (req, res) {
    res.end('hello cruel world\n');
});

ports.service('web.localhost', function (port, ready) {
    server.listen(port, ready);
});
```

and additional web servers can sit at specific mount points
(or on entirely different host names):

``` js
var http = require('http');
var ports = require('seaport').connect(7000, { secret : 'beep boop' });

var server = http.createServer(function (req, res) {
    res.end('boop\n');
});

ports.service('web.localhost', { mount : '/beep' }, function (port, ready) {
    server.listen(port, ready);
});
```

Then spin up all the processes (in any order) and everything should just work!

```
$ curl http://localhost/
hello cruel world
```

```
$ curl http://localhost/beep
boop
```

```
$ curl http://localhost/xyz
hello cruel world
```

Attach as many web servers as you want! Just register them with seaport
and mountie will figure everything out dynamically at runtime.

# methods

``` js
var mountie = require('mountie')
```

## var server = mountie(ports, opts)

Create a new [bouncy](https://github.com/substack/bouncy) instance `server` that
you can `.listen()` on. The server object is extended with the methods
documented below.

`ports` must be a seaport server object created with
`seaport.createServer()` or with [pier](https://github.com/substack/node-pier),
not a handle created with `seaport.connect()`.

You can specify an `opts.prefix` to control how the naming for web services in
seaport works. By default, `opts.prefix` is `'web'`.

When an incoming request comes in, mountie first searches for mounted routes,
then for services registered as `opts.prefix + '.' + req.headers.host`
and a `mount` field, then for services without a mount field but a matching
host prefix.

All other `opts` are passed directly to
[bouncy](https://github.com/substack/bouncy).

## server.mount(opts, cb)

Attach additional custom logic for handling mounts to be run before handling
entries from seaport. The options in `opts` control the matching and when a
request matches, `cb(req, bounce)` fires with the request object `req` and the
[bouncy bounce() function](https://github.com/substack/bouncy#bouncestream-opts).

When `opts` is a function, it will be used as a comparison function that
should return true or false if the `req` object passed into it matches.

When `opts` is not an object it will be interpreted as the `opts.path` value.

When `opts.path` is a regexp, matching is determined by `.test(req.url)`.

When `opts.path` is a string, matching is determined by whether the `opts.path`
is a path prefix of the `req.url`.

You can use `opts.method` to add an additional restriction on the http method.

# install

With [npm](http://npmjs.org) do:

```
npm install mountie
```

# license

MIT
