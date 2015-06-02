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

function nullDataOutput (data) {
  return scripts.nullDataOutput(data)
}

function sign (tx, index, keyPair) {
  var prevOutScript = scripts.pubKeyHashOutput(keyPair.publicHash)
  var hash = tx.hashForSignature(index, prevOutScript, Transaction.SIGHASH_ALL)
  var signature = ecdsa.serializeSig(ecdsa.sign(new Buffer(hash), keyPair.privateKey))
  signature.push(Transaction.SIGHASH_ALL)
  tx.setInputScript(index, Script.fromChunks([new Buffer(signature), keyPair.publicKey]))
}

function Spender () {
  if (!(this instanceof Spender)) return new Spender()
}

Spender.prototype.from = function (fromWIF) {
  assert(fromWIF, 'specify "fromWIF"')
  this.fromWIF = fromWIF
}

Spender.prototype.blockchain = function (chain) {
  this.chain = chain
  return this
}

Spender.prototype.to = function (toAddress) {
  this.to = toAddress
  return this
}

Spender.prototype.satoshis = function (satoshis) {
  this.amountSatoshis = satoshis
  return this
}

Spender.prototype.change = function (changeAddress) {
  this.changeAddress = changeAddress
  return this
}

Spender.prototype.data = function (data) {
  this.data = data
  return this
}

Spender.prototype.spend = function (callback) {
  assert(this.to, 'specify "to" address')
  assert(this.amountSatoshis, 'specify "satoshis"')
  assert(this.chain, 'specify "blockchain"')

  var key = CoinKey.fromWif(this.fromWIF)
  var amount = parseInt(this.amountSatoshis, 10)
  var changeAddress = this.changeAddress || key.publicAddress
  var toAddress = this.to
  var data = this.data
  var chain = this.chain

  this.chain.addresses.unspents(key.publicAddress, function (err, utxos) {
    if (err) return callback(err)

    var balance = utxos.reduce(function (amount, unspent) {
      return unspent.value + amount
    }, 0)

    if (amount > (balance - FEE)) {
      return callback(new Error("Address doesn't contain enough money to send."))
    }

    var change = balance - amount - FEE
    var tx = new Transaction()
    tx.addOutput(addressToScript(toAddress), amount)

    if (change > 0) {
      tx.addOutput(addressToScript(changeAddress), change)
    }

    if (data) {
      tx.addOutput(nullDataOutput(data), 0)
    }

    utxos.forEach(function (unspent) {
      tx.addInput(unspent.txId, unspent.vout)
    })

    tx.ins.forEach(function (input, index) {
      sign(tx, index, key)
    })

    var rawTx = tx.toHex()
    var txId = tx.getId().toString('hex')
    chain.transactions.propagate(rawTx, function (err) {
      if (err) return callback(err)
      callback(null, txId, rawTx)
    })
  })
}

module.exports = Spender
