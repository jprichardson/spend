var assert = require('assert')
// var Blockchain = require('cb-insight')
var fixtures = require('./fixtures')
var spend = require('../')

/* global describe, it */

describe('spend', function () {
  it('should create and submit Bitcoin testnet transaction', function (done) {
    var f0 = fixtures.valid[0]
    // stub this out
    spend.blockchain = {
      addresses: {
        unspents: function (addresses, callback) {
          callback(null, f0.utxos)
        }
      },
      transactions: {
        propagate: function (rawTx, callback) {
          callback()
        }
      }
    }

    spend(f0.senderWIF, f0.receiver, f0.amount, function (err, txId, rawTx) {
      assert.ifError(err)
      assert.equal(rawTx, f0.tx)
      assert.equal(txId, f0.txId)
      done()
    })
  })
})
