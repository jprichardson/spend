var assert = require('assert')
var Blockchain = require('cb-insight')
var simpleSend = require('../')

/* global describe, it */

describe('simpleSend', function () {
  it('should create and submit Bitcoin testnet transaction', function (done) {
    simpleSend.blockchain = new Blockchain('https://test-insight.bitpay.com')

    var fromWIF = 'cNEJZUkLHcnjvxBN2EfBxZjN3LwQK3r6N2NJLzMguYo5fkRNDesd'
    // 'cT7ec4UxtwgDbQJT3nANfr84M5V38wWq7YtSwrFbGEzaSAHzNtyi'
    var toAddress = 'mwgbiF9YcWQ6DCGTC7LkWp1g9c4b3C7VPq'
    var amountSatoshis = 20000

    simpleSend.simpleTx(fromWIF, toAddress, amountSatoshis, function (err, rawTx) {
      assert.ifError(err)
      console.log(rawTx)
    })
  })
})
