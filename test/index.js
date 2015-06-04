var assert = require('assert')
// var Blockchain = require('cb-insight')
var fixtures = require('./fixtures')
var Spender = require('../')

/* global describe, it */

describe('spend', function () {
  it('should create and submit Bitcoin testnet transaction', function (done) {
    var f0 = fixtures.valid[0]
    // stub this out
    new Spender('testnet')
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
      .execute(function (err, tx, utxos) {
        assert.ifError(err)
        assert.equal(tx.toHex(), f0.tx)
        assert.equal(tx.getId().toString('hex'), f0.txId)
        assert.deepEqual(utxos, f0.utxos.slice(0, 1))
        done()
      })
  })
})
