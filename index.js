var assert = require('assert')
var dezalgo = require('dezalgo')
var bitcoin = require('bitcoinjs-lib')
var noop = function() {}

// fixed for now
var FEE = 10000 // 100 bits

function Spender (network) {
  if (!(this instanceof Spender)) return new Spender()

  this.network = typeof network === 'string' ? bitcoin.networks[network] : network
  assert(this.network, 'specify "network"')
  this.sends = []
}

Spender.prototype.from = function (key) {
  assert(key, 'specify "key"')
  this.key = typeof key === 'string' ? bitcoin.ECKey.fromWIF(key) : key
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
  this.changeAddress = typeof changeAddress === 'string' ?
    changeAddress :
    changeAddress.toString()

  return this
}

Spender.prototype.data = function (data) {
  this.data = data
  return this
}

Spender.prototype.fee = function(satoshis) {
  this.feeAmount = satoshis
  return this
}

Spender.prototype.build = function(cb) {
  var self = this

  assert(this.to.length, 'specify "to"')
  assert(this.network, 'specify "net"')
  assert(this.chain, 'specify "blockchain"')

  cb = dezalgo(cb || noop)
  if (this._building) {
    return cb(new Error('build can only be called once'))
  }

  this._building = true
  var key = this.key
  var amount = this.sends.reduce(function(sum, send) {
    return sum + send.amount
  }, 0)

  var fee = this.feeAmount || FEE
  var myAddr = key.pub.getAddress(this.network).toString()
  var changeAddress = this.changeAddress || myAddr
  var sends = this.sends
  var data = this.data
  var chain = this.chain

  this.chain.addresses.unspents(myAddr, function (err, utxos) {
    if (err) return cb(err)

    utxos.forEach(function(u) {
      u.value = Number(u.value)
      if (parseInt(u.value) !== u.value) {
        // cb-blockr, i'm looking for you
        u.value = u.value * 1e8
      }
    })

    var needed = amount + fee
    var collected = 0
    utxos = utxos.sort(function(a, b) {
        return b.value - a.value
      })
      .filter(function(u) {
        if (collected < needed) {
          collected += u.value
          return true
        }
      })

    if (needed > collected) {
      return cb(new Error("Address doesn't contain enough money to send."))
    }

    var change = collected - needed
    var tx = new bitcoin.TransactionBuilder()
    sends.forEach(function(send) {
      tx.addOutput(send.to, send.amount)
    })

    if (change > 0) {
      tx.addOutput(changeAddress, change)
    }

    if (data) {
      tx.addOutput(bitcoin.scripts.nullDataOutput(data), 0)
    }

    utxos.forEach(function (unspent) {
      tx.addInput(unspent.txId, unspent.vout)
    })

    for (var i = 0; i < utxos.length; i++) {
      tx.sign(i, key)
    }

    tx = tx.build()

    delete self._building
    self.tx = tx
    self.usedUnspents = utxos
    cb(null, tx, utxos)
  })
}

Spender.prototype.execute = function (cb) {
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
    cb(err, self.tx, self.usedUnspents)
  })
}

module.exports = Spender
