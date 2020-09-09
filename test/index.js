const { expect } = require('chai');

const { _getSpreadMargins } = require('../index');

describe('getSpreadMargins', function () {
  it('should throw if no asks', function () {
    const orders = [[0, 3, 1], [0, 5, 1], [0, 4, 1]];

    expect(() => _getSpreadMargins(orders)).to.throw('No asks');
  });

  it('should throw if no bids', function () {
    const orders = [[0, 3, -1], [0, 5, -1], [0, 4, -1]];

    expect(() => _getSpreadMargins(orders)).to.throw('No bids');
  });

  it('should return highest bid value in mixed value array', function () {
    const orders = [[0, 1, 1], [0, 3, 1], [0, 2, 1], [0, 6, -1]];

    const { highestBid } = _getSpreadMargins(orders);
    expect(highestBid).to.equal(3);
  });

  it('should return lowest ask value in mixed value array', function () {
    const orders = [[0, 3, -1], [0, 5, -1], [0, 4, -1], [0, 2, 1]];

    const { lowestAsk } = _getSpreadMargins(orders);
    expect(lowestAsk).to.equal(3);
  });
});