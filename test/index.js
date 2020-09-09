const { expect } = require('chai');
const BigNumber = require('bignumber.js');

const {
  _getSpreadMargins,
  _getPlacementRange,
  _getBidOrderAmounts,
  _getAskOrderAmounts,
  _checkClosedPositions
} = require('../index.js');

// silence console
console.info = () => { };

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

  describe('getBidOrderAmounts', function () {
    it('should return equally divided usd amount for the bid', function () {
      const orderPrice = 500;
      const accountUsd = 1000;
      const activeBids = 5;
      const allowedActiveBids = 7;

      const { inputUsdAmount } = _getBidOrderAmounts(orderPrice, accountUsd, activeBids, allowedActiveBids);
      expect(inputUsdAmount.toFixed()).to.equal('500');
    });

    it('should return equally rounded down usd portion if number is indivisible', function () {
      const orderPrice = 500;
      const accountUsd = 1000;
      const activeBids = 5;
      const allowedActiveBids = 8;

      const { inputUsdAmount } = _getBidOrderAmounts(orderPrice, accountUsd, activeBids, allowedActiveBids);
      expect(inputUsdAmount.toFixed()).to.equal('333.33');
    });

    it('should return correctly converted eth from equally divided usd', function () {
      const orderPrice = 500;
      const accountUsd = 1000;
      const activeBids = 5;
      const allowedActiveBids = 7;

      const { outputEthAmount } = _getBidOrderAmounts(orderPrice, accountUsd, activeBids, allowedActiveBids);
      expect(outputEthAmount.toFixed()).to.equal('1');
    });
  });

  describe('getAskOrderAmounts', function () {
    it('should return equally divided eth amount for the ask', function () {
      const orderPrice = 500;
      const accountEth = 1;
      const activeAsks = 5;
      const allowedActiveAsks = 7;

      const { inputEthAmount } = _getAskOrderAmounts(orderPrice, accountEth, activeAsks, allowedActiveAsks);
      expect(inputEthAmount.toFixed()).to.equal('0.5');
    });

    it('should return equally rounded down eth portion if number is indivisible', function () {
      const orderPrice = 500;
      const accountEth = 1;
      const activeAsks = 5;
      const allowedActiveAsks = 8;

      const { inputEthAmount } = _getAskOrderAmounts(orderPrice, accountEth, activeAsks, allowedActiveAsks);
      const expected = BigNumber(1).dividedBy(3).dp(18, BigNumber.HALF_DOWN);
      expect(inputEthAmount.toFixed()).to.equal(expected.toFixed());
    });

    it('should return correctly converted usd from equally divided eth', function () {
      const orderPrice = 500;
      const accountEth = 1;
      const activeAsks = 5;
      const allowedActiveAsks = 7;

      const { outputUsdAmount } = _getAskOrderAmounts(orderPrice, accountEth, activeAsks, allowedActiveAsks);
      expect(outputUsdAmount.toFixed()).to.equal('250');
    });
  });

  describe('checkClosedPositions', function () {
    it('should close bids above highest bid', function () {
      const highestBid = 300;
      const lowestAsk = 310;
      const activeOrders = {
        bids: [
          { orderPrice: BigNumber(301), inputUsdAmount: BigNumber(2), outputEthAmount: BigNumber(1) },
        ],
        asks: []
      };

      _checkClosedPositions(activeOrders, highestBid, lowestAsk);
      expect(activeOrders.bids.length).to.equal(0);
    });

    it('should not close bids below or equal to the highest bid', function () {
      const highestBid = 300;
      const lowestAsk = 310;
      const activeOrders = {
        bids: [
          { orderPrice: BigNumber(300), inputUsdAmount: BigNumber(2), outputEthAmount: BigNumber(1) },
        ],
        asks: []
      };

      _checkClosedPositions(activeOrders, highestBid, lowestAsk);
      expect(activeOrders.bids.length).to.equal(1);
    });

    it('should close asks below the lowest ask', function () {
      const highestBid = 300;
      const lowestAsk = 310;
      const activeOrders = {
        bids: [],
        asks: [
          { orderPrice: BigNumber(300), outputUsdAmount: BigNumber(2), inputEthAmount: BigNumber(1) },
        ]
      };

      _checkClosedPositions(activeOrders, highestBid, lowestAsk);
      expect(activeOrders.asks.length).to.equal(0);
    });

    it('should not close asks above or equal to the lowest ask', function () {
      const highestBid = 300;
      const lowestAsk = 310;
      const activeOrders = {
        bids: [],
        asks: [
          { orderPrice: BigNumber(310), outputUsdAmount: BigNumber(2), inputEthAmount: BigNumber(1) },
        ]
      };

      _checkClosedPositions(activeOrders, highestBid, lowestAsk);
      expect(activeOrders.asks.length).to.equal(1);
    });

    it('should return eth amount of closed bid orders', function () {
      const highestBid = 300;
      const lowestAsk = 310;
      const activeOrders = {
        bids: [
          { orderPrice: BigNumber(310), inputUsdAmount: BigNumber(2), outputEthAmount: BigNumber(1) },
        ],
        asks: []
      };

      const aquiredAssets = _checkClosedPositions(activeOrders, highestBid, lowestAsk);
      expect(aquiredAssets.eth.toString()).to.equal('1');
      expect(aquiredAssets.usd.toString()).to.equal('0');
    });

    it('should return usd amount of closed ask orders', function () {
      const highestBid = 300;
      const lowestAsk = 310;
      const activeOrders = {
        bids: [],
        asks: [
          { orderPrice: BigNumber(300), outputUsdAmount: BigNumber(2), inputEthAmount: BigNumber(1) },
        ]
      };

      const aquiredAssets = _checkClosedPositions(activeOrders, highestBid, lowestAsk);
      expect(aquiredAssets.eth.toString()).to.equal('0');
      expect(aquiredAssets.usd.toString()).to.equal('2');
    });
  });
});