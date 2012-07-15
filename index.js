var pick = require('deck').pick;
var isRegExp = require('is').is.regexp;

var bouncy = require('bouncy');
var merge = require('merge');

module.exports = function (ports, opts) {
    if (!opts) opts = {};
    
    var server = bouncy(opts, function (req, bounce) {
        for (var i = 0; i < hooks.length; i++) {
            if (hooks[i].cmp(req)) {
                return hooks[i].cb(req, bounce);
            }
        }
        
        handler(ports, opts, req, bounce);
    });
    
    var hooks = [];
    
    server.mount = function (params, cb) {
        if (typeof params === 'string' || isRegExp(params)) {
            params = { path : params };
        }
        
        var cmp = function (req) {
            if (typeof params === 'function') {
                return params(req);
            }
            
            if (isRegExp(params.path)) {
                return params.path.test(req.url);
            }
            
            var u = req.url.slice(0, params.path.length);
            var c = req.url.charAt(params.path.length);
            return u === params.path && (c === '' || /[\/;?]/.test(c));
        };
        
        hooks.push({ cmp : cmp, cb : cb });
    };
    
    return server;
};
 
function handler (ports, opts, req, bounce) {
    function error (code, msg) {
        var res = bounce.respond();
        res.writeHead(code, { 'content-type' : 'text/plain' })
        res.end(msg + '\r\n');
    }
    
    var host = req.headers.host || '';
    var subdomain = host.split('.').slice(0,-2).join('.');
    
    req.on('error', function () { req.socket.destroy() });
    req.socket.on('error', function () { req.socket.destroy() });
    
    var ps = ports.query('web.' + subdomain);
    var mounts = ps.filter(function (p) {
        if (typeof p.mount !== 'string') return false;
        
        var c = req.url.charAt(p.mount.length);
        return p.mount === req.url.slice(0, p.mount.length) && (
            /[?\/;]$/.test(p.mount) || c === '' || /[?\/;]/.test(c)
        );
    });
    var webservers = ps.filter(function (p) { return !p.mount });
    
    var stream;
    if (mounts.length) {
        var m = pick(mounts);
        stream = bounce(merge({
            path : req.url.slice(m.mount.length).replace(/^\/*/, '/')
        }, m))
    }
    else if (webservers.length) {
        stream = bounce(pick(webservers))
    }
    else {
        return error(404, 'no matching services are running');
    }
    
    stream.on('error', function () {
        stream.destroy();
        req.socket.destroy();
    });
}
