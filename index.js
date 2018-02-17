/*@flow*/
/*
 * You may redistribute this program and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const UDP = require('dgram');
const Bencode = require('bencode');
const Crypto = require('crypto');
const Fs = require('fs');
const nThen = require('nthen');
const Saferphore = require('saferphore');

const DEFAULT_TIMEOUT = 10000;

const sendmsg = function (sock, addr, port, msg, txid, callback) {
    const to = setTimeout(function () {
        callback(new Error("timeout after " + sock.timeout + "ms"));
        delete sock.handlers[txid];
    }, sock.timeout);
    sock.handlers[txid] = {
        callback: callback,
        timeout: to
    };

    sock._.send(msg, 0, msg.length, port, addr, function(err, bytes) {
        if (err) {
            clearTimeout(to);
            delete sock.handlers[txid];
            callback(err);
        }
    });
};

const callFunc = function (sock, addr, port, pass, func, args, callback) {
    const cookieTxid = String(sock.counter++);
    const cookieMsg = new Buffer(Bencode.encode({'q':'cookie','txid':cookieTxid}));
    sendmsg(sock, addr, port, cookieMsg, cookieTxid, function (err, ret) {
        if (err) { callback(err); return; }
        if (!ret) { throw new Error(); }
        const cookie = ret.cookie;
        if (typeof(cookie) !== 'string') { throw new Error("invalid cookie in [" + ret + "]"); }
        const json /*:Object*/ = {
            txid: String(sock.counter++),
            q: func,
            args: {}
        };
        Object.keys(args).forEach(function (arg) {
            json.args[arg] = args[arg];
        });
        if (pass) {
            json.aq = json.q;
            json.q = 'auth';

            json.cookie = cookie;
            json.hash = Crypto.createHash('sha256').update(pass + cookie).digest('hex');
            json.hash = Crypto.createHash('sha256').update(Bencode.encode(json)).digest('hex');
        }
        sendmsg(sock, addr, port, new Buffer(Bencode.encode(json)), json.txid, callback);
    });
};

const getArgs = function (func) {
    const rArgs = [];
    Object.keys(func).forEach(function (name) {
        if (func[name].required === 1) {
            rArgs.push({ name: name, type: func[name].type, required: true });
        }
    });
    // be sure that the arguments are always in the same order
    rArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0; });
    const oArgs = [];
    Object.keys(func).forEach(function (name) {
        if (func[name].required === 0) {
            oArgs.push({ name: name, type: func[name].type, required: false });
        }
    });
    oArgs.sort(function (a,b) { a = a.name; b = b.name; return (a !== b) ? (a < b) ? 1 : -1 : 0; });
    rArgs.push.apply(rArgs, oArgs);
    return rArgs;
};

const makeFunctionDescription = function (funcName, func) {
    const args = getArgs(func);
    const outArgs = [];
    args.forEach(function (arg) {
        outArgs.push( ((arg.required) ? 'required ' : '') + arg.type + ' ' + arg.name );
    });
    return funcName + "(" + outArgs.join(', ') + ")";
};

const compatibleType = function (typeName, obj) {
    switch (typeName) {
        case 'Int': return (typeof(obj) === 'number' && Math.floor(obj) === obj);
        case 'String': return (typeof(obj) === 'string');
        case 'Dict': return (typeof(obj) === 'object');
        case 'List': return Array.isArray(obj);
        default: throw new Error();
    }
};

const makeFunction = function (sock, addr, port, pass, funcName, func) {
    const args = getArgs(func);
    return function () {
        let i;
        const argsOut = {};
        for (i = 0; i < arguments.length-1; i++) {
            const arg = arguments[i];
            if (!args[i].required && (arg === null || arg === undefined)) { continue; }
            if (!compatibleType(args[i].type, arg)) {
                throw new Error("argument [" + i + "] ([" + arguments[i] + "]) [" +
                                args[i].type + " " + args[i].name + "]" +
                                " is of type [" + typeof(arg) + "] which is not compatible with " +
                                "required type " + args[i].type);
            }
            argsOut[args[i].name] = arg;
        }
        if (args.length > i && args[i].required) {
            throw new Error("argument [" + i + "] [" + args[i].type + " " + args[i].name + "] is " +
                            "required and is not specified");
        }

        const callback = arguments[arguments.length-1];
        if (typeof(callback) !== 'function') {
            throw new Error("callback is unspecified");
        }

        sock.semaphore.take(function (returnAfter) {
            callFunc(sock, addr, port, pass, funcName, argsOut, returnAfter(callback));
        });
    };
};

const getFunctions = function (sock, addr, port, pass, callback) {
    const funcs = {};
    nThen(function (waitFor) {
        const next = function (i) {
            callFunc(sock, addr, port, pass, 'Admin_availableFunctions', {page:i},
                waitFor(function (err, ret) {
                    if (err) { throw err; }
                    Object.keys(ret.availableFunctions).forEach(function (funcName) {
                        funcs[funcName] = ret.availableFunctions[funcName];
                    });
                    if (Object.keys(ret.availableFunctions).length > 0) {
                        next(i+1);
                    }
                })
            );
        };
        next(0);

    }).nThen(function (waitFor) {
        const funcDescriptions = [];
        const cjdns = {};
        Object.keys(funcs).forEach(function (name) {
            cjdns[name] = makeFunction(sock, addr, port, pass, name, funcs[name]);
            funcDescriptions.push(makeFunctionDescription(name, funcs[name]));
        });
        cjdns.functions = function (cb) { cb(undefined, funcDescriptions); };
        callback(cjdns);
    });
};

const connect0 = (addr, port, pass, usingCjdnsadmin, callback) => {
    const sock = {
        _: UDP.createSocket((addr.indexOf(':') !== -1) ? 'udp6' : 'udp4'),
        semaphore: Saferphore.create(4),
        handlers: {},
        counter: Math.floor(Math.random() * 4000000000),
        defaultHandler: undefined,
        timeout: DEFAULT_TIMEOUT
    };
    sock._.on('message', function (msg) {
        const response = Bencode.decode(msg, 'utf8');
        if (!response.txid) {
            throw new Error("Response [" + msg + "] with no txid");
        }
        const handler = sock.handlers[response.txid];
        if (!handler) {
            if (sock.defaultHandler) {
                sock.defaultHandler(undefined, response);
            }
            return;
        }
        clearTimeout(handler.timeout);
        delete sock.handlers[response.txid];
        handler.callback(undefined, response);
    });

    if (usingCjdnsadmin !== '') {
        usingCjdnsadmin = " using cjdnsadmin file at [" + usingCjdnsadmin + "]";
    }
    nThen(function (waitFor) {
        sock.timeout = 1000;
        callFunc(sock, addr, port, pass, 'ping', {}, waitFor(function (err, ret) {
            sock.timeout = DEFAULT_TIMEOUT;
            if (err) {
                sock._.close();
                waitFor.abort();
                const msg = "Could not find cjdns (" + addr + ":" + port + ")" + usingCjdnsadmin +
                    " see: https://github.com/cjdelisle/cjdnsadmin#connecting";
                return void callback({ message: msg, code: 'ENOENT' });
            }
            //console.log("got pong! [" + JSON.stringify(ret) + "]");
        }));
    }).nThen(function (waitFor) {
        if (pass === null) { return; }
        callFunc(sock, addr, port, pass, 'AuthorizedPasswords_list', {}, waitFor(function (err, ret) {
            if (err) { throw err; }
            if (ret.error) {
                sock._.close();
                waitFor.abort();
                const msg = "Could not authenticate with cjdns (" + addr + ":" + port + ")" +
                    usingCjdnsadmin +
                    " see: https://github.com/cjdelisle/cjdnsadmin#authentication-issues";
                return void callback({ message: msg, code: 'EPERM' });
            }
            //console.log("got pong! [" + JSON.stringify(ret) + "]");
        }));
    }).nThen(function (waitFor) {
        getFunctions(sock, addr, port, pass, function (cjdns) {
            cjdns.disconnect = function () { sock._.close(); };
            cjdns.setDefaultHandler = function (handler) { sock.defaultHandler = handler; };
            // $FlowFixMe not in object literal complaint
            Object.defineProperty(cjdns, 'timeout', {
                get: () => { return sock.timeout; },
                set: (x) => { sock.timeout = x; }
            });
            cjdns._ = sock;
            callback(undefined, cjdns);
        });
    });
};

/*::
export type Cjdnsadmin_Opts_t = {
    addr?: string,
    port?: number,
    password?: string,
    cjdnsadminPath?: string
};
export type Cjdnsadmin_Error_t = {
    message: string,
    code: 'ENOENT'|'EPERM'
};
*/

module.exports.connect = function (
    callback /*:(?Cjdnsadmin_Error_t, ?Object)=>void*/,
    _opts /*:?Cjdnsadmin_Opts_t*/
) {
    const opts = _opts || {};
    let cjdnsAdmin = {
        addr: opts.addr || '127.0.0.1',
        port: opts.port || 11234,
        password: opts.password || (opts.anon) ? null : 'NONE'
    };
    if (!process.env.HOME) { throw new Error(); }
    const path = opts.cjdnsadminPath || process.env.HOME + '/.cjdnsadmin';
    let usingCjdnsadmin = '';
    nThen(function (waitFor) {
        if ((opts.addr || opts.port || opts.password) && !opts.cjdnsadminPath) { return; }
        Fs.readFile(path, waitFor(function (err, ret) {
            if (err && err.code !== 'ENOENT') { throw err; }
            if (!err) {
                cjdnsAdmin = JSON.parse(String(ret));
                usingCjdnsadmin = path;
            }
        }));
    }).nThen(function (waitFor) {
        connect0(cjdnsAdmin.addr, cjdnsAdmin.port, cjdnsAdmin.password, usingCjdnsadmin, callback);
    });
};