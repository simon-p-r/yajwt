# yajwt 

[![Greenkeeper badge](https://badges.greenkeeper.io/simon-p-r/yajwt.svg)](https://greenkeeper.io/)
[![build status](https://travis-ci.org/simon-p-r/yajwt.svg?branch=master)](https://travis-ci.org/simon-p-r/yajwt)
[![Current Version](https://img.shields.io/npm/v/yajwt.svg?maxAge=1000)](https://www.npmjs.org/package/yajwt)
[![dependency Status](https://img.shields.io/david/simon-p-r/yajwt.svg?maxAge=1000)](https://david-dm.org/simon-p-r/yajwt)
[![devDependency Status](https://img.shields.io/david/dev/simon-p-r/yajwt.svg?maxAge=1000)](https://david-dm.org/simon-p-r/yajwt)
[![Coveralls](https://img.shields.io/coveralls/simon-p-r/yajwt.svg?maxAge=1000)](https://coveralls.io/github/simon-p-r/yajwt)

An implementation of [JSON Web Tokens](https://tools.ietf.org/html/rfc7519).

This was developed against `draft-ietf-oauth-json-web-token-08`. It makes use of [node-jws](https://github.com/brianloveswords/node-jws) and has heavily used [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) module as inspiration

# Install

```bash
$ npm install yajwt
```

# Usage

### jwt.sign(options, [callback])

(Asynchronous) Callback has err, JWT string signature

### jwt.signSync(options)
(Synchronous) Returns an object with an error(on failure) and token property (on success)


`options`:

* `header` object with following properties
  * `alg` default: `RS256`
  * `typ` default 'JWT', this is only accepted value for this property
* `payload`: object with the following properties
  * `aud`: string - audience of token
  * `exp`: number ms since EPOCH or a string describing a time duration added to seconds since EPOCH [rauchg/ms](https://github.com/rauchg/ms.js). Eg: `60`, `"2 days"`, `"10h"`, `"7d"` or Moment formats types ['DD-MM-YYYY', 'DD-MM-YY', 'DD/MM/YYYY', 'DD/MM/YY']
  * `iat`: same as above, defaults to the time payload is signed.  If duration is used the value is added to Date.now()
  * `iss`: string -  issuer of token
  * `jti`: string - unique identity of token
  * `nbf`: same as exp
  * `sub`: string - describing subject of token
* `privateKey`: string or buffer of private key to sign token

All timestamp related fields if a number are coerced into seconds from ms.




Additional custom header properties can be provided via the `header` object.


Example

```js

const jwt = require('yajwt');

// read key for signing
const key = fs.readFileSync('private.pem');  
const signed = jwt.signSync({ header: { alg: 'HS256' }, payload: {aud: 'private'}, privateKey: key });
console.log(signed.token); /// prints JWT string


// sign asynchronously
jwt.sign({ header: { alg: 'HS256' }, payload: {aud: 'private'}, privateKey: key }, (err, token) => {
  console.log(err, token);
});
```

### jwt.verify(options, callback)

(Asynchronous) Callback has err, decoded JWT signature

### jwt.verifySync(options)

(Synchronous) Returns true or false depending on whether token can be verified as valid



`options`

* `algorithms` default: RS256.
* `signature` json string to verify
* `publicKey`: is a string or buffer containing either the secret for HMAC algorithms, or the PEM
encoded public key for RSA and ECDSA.


```js
// verify a token asymmetric
const publicKey = fs.readFileSync('public.pem');  // get public key

const valid = jwt.verifySync(token, publicKey);
console.log(valid) // true

// verify a token symmetric
jwt.verify({signature: jsonString, algorithm: 'HS256',  publicKey: publicKey}, (err, decoded) => {
  console.log(err) // null
  console.log(decoded) // decoded token meaning payload verified
});
```

Todo

* improve error handling for missing callback on async funcs
