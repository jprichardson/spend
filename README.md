Spend
=====

A JavaScript component to create simple Bitcoin / Testnet transactions for integration testing with
the actual network. Can be used in Node.js or the browser (via Browserify).


Install
-------

    npm i --save spend


Usage
-----

### spend(fromWIF, toAddress, amount, [changeAddress], callback)

- `fromWIF`: Private key with matching address that contains funds. Should be base58 check encoded `string`.
- `toAddress`: Recipient address. Should be base58 encoded `string`.
- `amount`: Amount in **satoshis**. Should be an integer. Either `number` or `string`.
- `changeAddress`: Optional change address. If not specified, address calculated from `fromWIF` will be used.
- `callback`: Callback with result. Signature: `(err, txId, rawTx)`. Where `txId` is a `string` representing
the transaction ID and `rawTx` is the transaction serialized as a `string`.


### Common Blockchain

Common Blockchain is a unified way to access a blockchain via an API provider. i.e. it provides the same methods and
normalizes results no matter who the API provider is.

You'll need to bring your own [Common Blockchain](https://github.com/common-blockchain/common-blockchain) provider.
Here's a list: https://github.com/common-blockchain/common-blockchain/issues/21


**Example:**

```js
var Blockchain = require('cb-insight') // npm i --save cb-insight
var spend = require('spend')

// set common blockchain provider
spend.blockchain = new Blockchain('https://test-insight.bitpay.com')

var fromWIF = '...'
var toAddress = '...'
var amountSatoshis = 500000

spend(fromWIF, toAddress, amountSatoshis, function (err, txId) {
  // use txId to track transaction
  console.log(txId)
})
```

### Limitations

- fixed fee
- bitcoin/testnet only at the moment
- simplified outputs (may change to allow additional like `OP_RETURN`)
- merges all UTXOs


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

