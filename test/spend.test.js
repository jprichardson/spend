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

    // internal method, allows us to peek at rawtx
    spend.createTx(f0.senderWIF, f0.receiver, f0.amount, function (err, tx) {
      assert.ifError(err)
      assert.equal(tx.toHex(), f0.tx)

      // do it again, but make sure other logic works
      spend(f0.senderWIF, f0.receiver, f0.amount, function (err, txId) {
        assert.ifError(err)
        assert.equal(txId, f0.txId)
        done()
      })
    })
  })
})
