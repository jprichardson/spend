var assert = require('assert')
var Blockchain = require('cb-insight')
var spend = require('../')

/* global describe, it */

describe('spend', function () {
  it('should create and submit Bitcoin testnet transaction', function (done) {
    spend.blockchain = new Blockchain('https://test-insight.bitpay.com')

    var fromWIF = 'cNEJZUkLHcnjvxBN2EfBxZjN3LwQK3r6N2NJLzMguYo5fkRNDesd'
    // 'cT7ec4UxtwgDbQJT3nANfr84M5V38wWq7YtSwrFbGEzaSAHzNtyi'
    var toAddress = 'mwgbiF9YcWQ6DCGTC7LkWp1g9c4b3C7VPq'
    var amountSatoshis = 20000

    spend.createTx(fromWIF, toAddress, amountSatoshis, function (err, rawTx) {
      assert.ifError(err)
      assert.equal(rawTx, f0.tx)
      done()
    })
  })
})
