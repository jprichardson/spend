var assert = require('assert')
// var Blockchain = require('cb-insight')
var fixtures = require('./fixtures')
var Spender = require('../')

/* global describe, it */

describe('spend', function () {
  it('should create and submit Bitcoin testnet transaction', function (done) {
    var f0 = fixtures.valid[0]
    // stub this out
    new Spender()
      .from(f0.senderWIF)
      .to(f0.receiver, f0.amount)
      .data(new Buffer('big spender'))
      .blockchain({
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
      })
      .spend(function (err, txId, rawTx) {
        assert.ifError(err)
        assert.equal(rawTx, f0.tx)
        assert.equal(txId, f0.txId)
        done()
      })
  })
})
