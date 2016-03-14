# cjdnskeys - tools for working with cjdns keys

```javascript
const Cjdnskeys = require('cjdnskeys');

Cjdnskeys.keyPair() /*
{ privateKey: '378813dfecc62185ffab4d00030b55f50b54e515bfcea8b41f2bd1c2511bae03',
  publicKey: 'qgkjd0stfvk9r3j28s4gh8rgslbgx2r5xgxzxkgm5vdxqwn8xsu0.k',
  ip6: 'fcf5:c1ec:be67:9ad5:1f6c:f31b:5d74:37b0' } */

Cjdnskeys.privateToPublic("378813dfecc62185ffab4d00030b55f50b54e515bfcea8b41f2bd1c2511bae03")
// "qgkjd0stfvk9r3j28s4gh8rgslbgx2r5xgxzxkgm5vdxqwn8xsu0.k"

Cjdnskeys.publicToIp6("qgkjd0stfvk9r3j28s4gh8rgslbgx2r5xgxzxkgm5vdxqwn8xsu0.k")
// "fcf5:c1ec:be67:9ad5:1f6c:f31b:5d74:37b0"

Cjdnskeys.validate("378813dfecc62185ffab4d00030b55f50b54e515bfcea8b41f2bd1c2511bae03") // true
Cjdnskeys.validate("qgkjd0stfvk9r3j28s4gh8rgslbgx2r5xgxzxkgm5vdxqwn8xsu0.k") // true
Cjdnskeys.validate("fcf5:c1ec:be67:9ad5:1f6c:f31b:5d74:37b0") // true

```
