# Cjdnsadmin - Admin API connector for talking to cjdns engine

Functions are created at runtime by probing the cjdns engine, all functions are asynchronous,
calling `functions()` will give you a list of functions which are available with (very) basic
description.

```javascript
const Cjdnsadmin = require('cjdnsadmin');

Cjdnsadmin.connect((err, cjdns) => {
    if (err) {
        console.error(err.message);
        return;
    }

    // print all available functions, this depends on your cjdns engine
    cjdns.functions((err, funcs) => (console.log(funcs))) });

    // Get the cjdns engine's pid number
    cjdns.Core_pid((err, resp) => (console.log("cjdns pid number is: " + resp.pid)));

    // Get the amount of memory currently in use
    cjdns.Allocator_bytesAllocated((err, resp) => (console.log("cjdns is currently using: " + resp.bytes + " bytes of memory")))

    // When you are done, in order that the process will not hang.
    cjdns.disconnect();
});
```

## cexec bash tool to execute calls to cjdns

```bash
notgay:cjdnsadmin user$ cexec 'Allocator_bytesAllocated()'
{
  "bytes": 734744,
  "txid": "844065990"
}
notgay:cjdnsadmin user$
```

To print all options, pass no arguments (same as `cjdns.functions()`)

```bash
notgay:cjdnsadmin user$ ./cexec.js
Usage: ./tools/cexec 'ping()' ## For example to send a ping request
List of available RPC requests with parameters is as follows:
[
  "AdminLog_logMany(required Int count)",
  "AdminLog_subscribe(Int line, String level, String file)",
  "AdminLog_subscriptions()",
  "AdminLog_unsubscribe(required String streamId)",
  "Admin_asyncEnabled()",
  "Admin_availableFunctions(Int page)",
  "RouteGen_getLocalPrefixes(Int page, Int ip6)",
  "RouteGen_getPrefixes(Int page, Int ip6)",
  "RouteGen_addException(required String route)",
  "RouteGen_addLocalPrefix(required String route)",
  "RouteGen_addPrefix(required String route)",
  "RouteGen_getExceptions(Int page, Int ip6)",
  "RouteGen_getGeneratedRoutes(Int page, Int ip6)",
  "RouteGen_removeException(required String route)",
  "RouteGen_removeLocalPrefix(required String route)",
  "RouteGen_removePrefix(required String route)",
  "ETHInterface_new(required String bindDevice)",
  "InterfaceController_disconnectPeer(required String pubkey)",
  "InterfaceController_peerStats(Int page)",
  "InterfaceController_resetPeering(String pubkey)",
  "RouteGen_commit(required String tunName)",
  "SwitchPinger_ping(required String path, Int timeout, Int keyPing, String data)",
  "UDPInterface_beginConnection(required String publicKey, required String address, String password, String login, Int interfaceNumber)",
  "UDPInterface_new(String bindAddress)",
  "AuthorizedPasswords_add(required String password, String user, String ipv6)",
  "AuthorizedPasswords_list()",
  "AuthorizedPasswords_remove(required String user)",
  "ETHInterface_beacon(Int state, Int interfaceNumber)",
  "ETHInterface_beginConnection(required String publicKey, required String macAddress, String password, String login, Int interfaceNumber)",
  "ETHInterface_listDevices()",
  "Security_nofiles()",
  "ping()",
  "IpTunnel_allowConnection(required String publicKeyOfAuthorizedNode, Int ip6Prefix, Int ip6Alloc, String ip6Address, Int ip4Prefix, Int ip4Alloc, String ip4Address)",
  "Security_checkPermissions()",
  "Security_chroot(required String root)",
  "Security_getUser(String user)",
  "Security_noforks()",
  "Security_seccomp()",
  "Security_setUser(required Int uid, required Int keepNetAdmin, Int gid)",
  "Security_setupComplete()",
  "Allocator_bytesAllocated()",
  "Allocator_snapshot(Int includeAllocations)",
  "IpTunnel_connectTo(required String publicKeyOfNodeToConnectTo)",
  "IpTunnel_listConnections()",
  "IpTunnel_removeConnection(required Int connection)",
  "IpTunnel_showConnection(required Int connection)",
  "SessionManager_getHandles(Int page)",
  "SessionManager_sessionStats(required Int handle)",
  "Core_exit()",
  "Core_initTunnel(String desiredTunName)",
  "Core_pid()",
  "NodeStore_dumpTable(required Int page)",
  "NodeStore_getLink(required Int linkNum, String parent)",
  "NodeStore_getRouteLabel(required String pathToParent, required String pathParentToChild)",
  "NodeStore_nodeForAddr(String ip)",
  "memory()",
  "Janitor_dumpRumorMill(required Int page, required String mill)",
  "RouterModule_findNode(required String target, required String nodeToQuery, Int timeout)",
  "RouterModule_getPeers(required String path, Int timeout, String nearbyPath)",
  "RouterModule_lookup(required String address)",
  "RouterModule_nextHop(required String target, required String nodeToQuery, Int timeout)",
  "RouterModule_pingNode(required String path, Int timeout)",
  "SearchRunner_search(required String ipv6, Int maxRequests)",
  "SearchRunner_showActiveSearch(required Int number)"
]
notgay:cjdnsadmin user$
```

## How it works and debugging

This library connects to the cjdns engine which has a UDP admin socket. Some of the RPC calls on this
socket are unauthenticated, so anyone who can message the socket can call them, other RPC calls require
a password to auth. The default port is 11234 and the default password in the cjdroute.conf file is
"NONE". The default bind address is 127.0.0.1 so anyone with shell on the machine to make any call.

You can change the port and password in the cjdroute.conf file under the "admin" section, however if
you do this, you must also create a file in your home directory called `.cjdnsadmin` which contains
the addr, port and password.

For example:

```bash
echo '{"addr": "127.0.0.1", "port": 11234, "password": "super secret password"}' > ~/.cjdnsadmin
```

### Connecting

If you have issues connecting, you might see a message like this:

```
Could not find cjdns node at 127.0.0.1:11235 using cjdnsadmin file at [/Users/user/.cjdnsadmin] see: https://github.com/cjdelisle/cjdnsadmin#connecting
```

#### Is your cjdns node running?

Check if your cjdns process is running by using `ps -ef | grep cjdroute`

```
$ ps -ef | grep cjdroute
    0 97868 24483   0 Sun03PM ttys000    0:00.03 sudo ./cjdroute
    0 97869 97868   0 Sun03PM ttys000    0:00.01 ./cjdroute
    0 97870 97869   0 Sun03PM ttys000  196:33.08 /Users/user/wrk/cjdns/cjdroute core /tmp client-core-zm0mlw5s4wg6r1h5s2x3zgqbs1grfn
  501 11624 59620   0  5:58PM ttys002    0:00.00 grep cjdroute
$
```

Here the process that says `cjdroute core` is the one, if you only see a line with "grep" then it's
not running and you should (re)start it.

#### Is the port correct?

1. Have you changed the port in the cjdroute.conf file ?
  * Check the "admin" section of the cjdroute.conf file to make sure the port is `11234` and the bind
  address is `127.0.0.1`.
2. Is there a `.cjdnsadmin` file ?
  * In the example error above, it shows there is one (`using cjdnsadmin file at [/Users/user/.cjdnsadmin]`)
  * If there is a file, make sure that it contains the same port that is specified in the cjdroute.conf
  * If everything is default, try just renaming the file so it will not be used, see if that fixes the problem

```
node ./cexec.js
Could not find cjdns (127.0.0.1:11235) using cjdnsadmin file at [/Users/user/.cjdnsadmin] see: https://github.com/cjdelisle/cjdnsadmin#connecting
$ mv ~/.cjdnsadmin ~/_unused_.cjdnsadmin
$ node ./cexec.js
Usage: ./tools/cexec 'ping()' ## For example to send a ping request
List of available RPC requests with parameters is as follows:
[
  "AdminLog_logMany(required Int count)",
  "AdminLog_subscribe(Int line, String level, String file)",
....
```

### Authentication Issues

If you are not able to authenticate, you might see a message like the following:

```
Could not authenticate with cjdns (127.0.0.1:11234) using cjdnsadmin file at [/Users/user/.cjdnsadmin] see: https://github.com/cjdelisle/cjdnsadmin#authentication-issues
```

#### Do you have a .cjdnsadmin file with wrong information ?

If the error message says `using cjdnsadmin file at [<path>.cjdnsadmin]` like the example, try renaming
that file so it will not be used. For example:

```
mv ~/.cjdnsadmin ~/_unused_.cjdnsadmin
```

Then try again.

#### Have you changed the default password (or is your cjdroute.conf very old) ?

Very old versions of cjdroute used randomized default admin passwords, new versions use NONE as the
default password always. Check the "admin" section of your `cjdroute.conf` file to see if the password
is something other than `"NONE"`. If it is, make sure you have a `.cjdnsadmin` file which contains the
same password.

