#!/usr/bin/env node
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
const Cjdns = require('./index');
const nThen = require('nthen');

let cjdns;
nThen(function (waitFor) {
    Cjdns.connect(waitFor(function (err, c) {
        if (err) {
            console.error(err.message);
            waitFor.abort();
        }
        cjdns = c;
    }));
}).nThen(function (waitFor) {
    let code;
    if (process.argv[process.argv.length-1].indexOf('cexec') !== -1) {
        code = 'functions(cb)';
        console.log("Usage: ./tools/cexec 'ping()' ## For example to send a ping request");
        console.log("List of available RPC requests with parameters is as follows:");
    } else {
        code = process.argv[process.argv.length-1].replace(/\).*$/, ',cb);');
        code = code.replace('(,cb);', '(cb);');
    }
    //jshint -W054
    const fn = new Function('x', 'cb', 'x.' + code);
    // $FlowFixMe "no arguments are expected by new Function()"  horseshit
    fn(cjdns, function (err, ret) {
        if (err) { throw err; }
        console.log(JSON.stringify(ret, null, '  '));
        cjdns.disconnect();
    });
});
