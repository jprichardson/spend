var assert = require('assert')
var CoinKey = require('coinkey')
var cs = require('coinstring')
var ecdsa = require('ecdsa')
var scripts = require('cointx').scripts
var Script = require('cointx').Script
var Transaction = require('cointx').Transaction

// fixed for now
var FEE = 10000 // 100 bits

function addressToScript (address) {
  var pubKeyHash = cs.decode(address).slice(1)
  return scripts.pubKeyHashOutput(new Buffer(pubKeyHash, 'hex'))
}

function sign (tx, index, keyPair) {
  var prevOutScript = scripts.pubKeyHashOutput(keyPair.publicHash)
  var hash = tx.hashForSignature(index, prevOutScript, Transaction.SIGHASH_ALL)
  var signature = ecdsa.serializeSig(ecdsa.sign(new Buffer(hash), keyPair.privateKey))
  signature.push(Transaction.SIGHASH_ALL)
  tx.setInputScript(index, Script.fromChunks([new Buffer(signature), keyPair.publicKey]))
}

function createTx (fromWIF, toAddress, amountSatoshis, changeAddress, callback) {
  var key = CoinKey.fromWif(fromWIF)
  var blockchain = spend.blockchain
  assert(blockchain, 'spend.blockchain not set. Did you forget to?')
  var amount = parseInt(amountSatoshis, 10)

  if (typeof changeAddress === 'function') {
    callback = changeAddress
    changeAddress = key.publicAddress
  }

  blockchain.addresses.unspents(key.publicAddress, function (err, utxos) {
    if (err) return callback(err)

    var balance = utxos.reduce(function (amount, unspent) {
      return unspent.value + amount
    }, 0)

    if (amount > (balance - FEE)) {
      return callback(new Error('Address doesn\'t contain enough money to send.'))
    }

    var change = balance - amount - FEE
    var tx = new Transaction()
    tx.addOutput(addressToScript(toAddress), amount)

    if (change > 0) {
      tx.addOutput(addressToScript(changeAddress), change)
    }

    utxos.forEach(function (unspent) {
      tx.addInput(unspent.txId, unspent.vout)
    })

    tx.ins.forEach(function (input, index) {
      sign(tx, index, key)
    })

    callback(null, tx.toBuffer().toString('hex'))
  })
}

function spend (/* arguments, see createTx */) {
  var args = [].slice.call(arguments)
  var callback = args[args.length - 1]

  // overwrite old callback
  args[args.length - 1] = function (err, rawTx) {
    if (err) return callback(err)
    spend.blockchain.transactions.propagate(rawTx, callback)
  }

  createTx.apply(spend, args)
}

spend.blockchain = null
spend.createTx = createTx

module.exports = spend
