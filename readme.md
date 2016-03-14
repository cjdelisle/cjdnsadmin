# Cjdnsadmin - Admin API connector for talking to cjdns engine

Functions are created at runtime by probing the cjdns engine, all functions are asynchronous,
calling `functions()` will give you a list of functions which are available with (very) basic
description.

```javascript
const Cjdnsadmin = require('cjdnsadmin');

Cjdnsadmin.connectWithAdminInfo((cjdns) => {
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

# cexec bash tool to execute calls to cjdns

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
