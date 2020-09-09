const { expect } = require('chai');
const BigNumber = require('bignumber.js');

const { _getSpreadMargins, _getPlacementRange } = require('../index');

describe('bot', function () {
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

  describe('getPlacementRange', function () {
    it('should be within the provided percentage in bigNumbers', function () {
      const orderRange = 8;
      const bestValue = 10;

      const { high, low } = _getPlacementRange(bestValue, orderRange);
      expect(high.toFixed()).to.equal('10.4');
      expect(low.toFixed()).to.equal('9.61538461538461538462');
    });

    it('should not cross provided upper boundary', function () {
      const orderRange = 50;
      const bestValue = 10;
      const upperBoundary = BigNumber(11);

      const { high } = _getPlacementRange(bestValue, orderRange, { upper: upperBoundary });
      expect(high.toFixed()).to.equal(upperBoundary.toFixed());
    });

    it('should not cross provided lower boundary', function () {
      const orderRange = 50;
      const bestValue = 10;
      const lowerBoundary = BigNumber(9);

      const { low } = _getPlacementRange(bestValue, orderRange, { lower: lowerBoundary });
      expect(low.toFixed()).to.equal(lowerBoundary.toFixed());
    });
  });
});