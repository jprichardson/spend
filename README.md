Spender
=====

forked from [jprichardson/spend](https://github.com/jprichardson/spend)

A JavaScript component to create simple Bitcoin / Testnet transactions for integration testing with
the actual network. Can be used in Node.js or the browser (via Browserify).

Install
-------

    npm i --save spender

### Common Blockchain

Common Blockchain is a unified way to access a blockchain via an API provider. i.e. it provides the same methods and
normalizes results no matter who the API provider is.

You'll need to bring your own [Common Blockchain](https://github.com/common-blockchain/common-blockchain) provider.
Here's a list: https://github.com/common-blockchain/common-blockchain/issues/21


**Example:**

```js
var Blockchain = require('cb-blockr')
var Spender = require('spender')
new Spender('testnet')   // network name ('bitcoin' or 'testnet')
  .blockchain(new Blockchain('testnet')) // common-blockchain provider
  .from(privateWif)      // string or bitcoinjs-lib's ECKey
  .to(toAddress)         // string or bitcoinjs-lib's Address
  .satoshis(amount)      // int satoshis
  .fee(fee)              // int satoshis
  .change(changeAddress) // optional
  .data(data)            // optional (OP_RETURN)
  .execute(callback)     // calls back with (err, Transaction, utxosUsed)
```

### Limitations

- bitcoin/testnet only at the moment
- simplified outputs

Bitcoin Testnet Faucets
-----------------------

You'll want some Bitcoin Testnet coins to test your applications. You can get them from any
of the following faucets:

- http://tpfaucet.appspot.com/
- http://faucet.luis.im/
- http://testnet.bitcoin.peercoinfaucet.com/
- https://testnet.coinfaucet.eu/en/
- http://faucet.haskoin.com/


Test Spending
-------------

Wanna test spending these coins? Checkout the [Coinbolt Cat Shop](https://www.coinbolt.com/catshop/) to
test your bitcoin applications by buying fake cats that share economic wisdom.


License
-------

MIT
