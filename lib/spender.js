var assert = require('assert')
var dezalgo = require('dezalgo')
var CoinKey = require('coinkey')
var cs = require('coinstring')
var ecdsa = require('ecdsa')
var scripts = require('cointx').scripts
var Script = require('cointx').Script
var Transaction = require('cointx').Transaction
var noop = function() {}

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

  this.sends = []
}

Spender.prototype.from = function (fromWIF) {
  assert(fromWIF, 'specify "fromWIF"')
  this.fromWIF = fromWIF
  return this
}

Spender.prototype.blockchain = function (chain) {
  this.chain = chain
  return this
}

Spender.prototype.to = function (toAddress, satoshis) {
  assert(toAddress, 'specify "toAddress"')
  assert(satoshis, 'specify "satoshis"')

  this.sends.push({
    to: toAddress,
    amount: satoshis
  })

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

Spender.prototype.build = function(cb) {
  var self = this

  assert(this.to.length, 'specify "to"')
  assert(this.chain, 'specify "blockchain"')

  cb = dezalgo(cb || noop)
  if (this._building) {
    return cb(new Error('build can only be called once'))
  }

  this._building = true
  var key = CoinKey.fromWif(this.fromWIF)
  var amount = this.sends.reduce(function(sum, send) {
    return sum + send.amount
  }, 0)

  var changeAddress = this.changeAddress || key.publicAddress
  var sends = this.sends
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
    sends.forEach(function(send) {
      tx.addOutput(addressToScript(send.to), send.amount)
    })

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

    delete self._building
    self.tx = tx
    cb(null, tx)
  })
}

Spender.prototype.spend = function (cb) {
  var self = this
  cb = dezalgo(cb || noop)

  if (this._spending) {
    return cb(new Error('spend can only be called once'))
  }

  this._spending = true
  if (this.tx) return this._spend()

  if (this._building) throw new Error('still building')

  this.build(function(err) {
    if (err) return cb(err)

    self._spend(cb)
  })
}

Spender.prototype._spend = function (cb) {
  var self = this
  this.chain.transactions.propagate(this.tx.toHex(), function (err) {
    cb(err, self.tx)
  })
}

module.exports = Spender
