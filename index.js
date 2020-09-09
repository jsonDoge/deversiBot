const fetch = require('node-fetch');
const BigNumber = require('bignumber.js');
const {
  orderbookUrl,
  orderRange,
  account,
  allowedActiveOrders,
} = require('./config');

let activeOrders = {
  bids: [],
  asks: [],
};

function getSpreadMargins(orders) {
  let asks = [];
  let bids = [];
  orders.forEach((o) => {
    if (o[2] < 0) { asks.push(o); return; }
    bids.push(o);
  });

  if (bids.length === 0) {
    throw new Error('No bids');
  }

  if (asks.length === 0) {
    throw new Error('No asks');
  }

  const highestBid = bids.reduce((h, bid) => h = bid[1] > h ? bid[1] : h, bids[0][1]);
  const lowestAsk = asks.reduce((l, ask) => l = ask[1] < l ? ask[1] : l, asks[0][1]);

  return { highestBid, lowestAsk };
}

function getPlacementRange(bestValue, percentRange, boundaries = {}) {
  const percentageMultiplier = BigNumber(1).plus(percentRange / 2 / 100);
  let high = BigNumber(bestValue).times(percentageMultiplier);
  let low = BigNumber(bestValue).dividedBy(percentageMultiplier);

  high = boundaries.upper && high.isGreaterThan(boundaries.upper) ? boundaries.upper : high;
  low = boundaries.lower && low.isLessThan(boundaries.lower) ? boundaries.lower : low;
  return { low, high };
}

function getOrderPrice(placementRange) {
  const rangeSpread = placementRange.high.minus(placementRange.low);
  return BigNumber.random().times(rangeSpread).plus(placementRange.low);
}

function getBidOrderAmounts(orderPrice, accountUsd, activeBids, maxBids) {
  const bidUsdAmount = BigNumber(accountUsd).dividedBy(maxBids - activeBids);
  const bidEthAmount = BigNumber(bidUsdAmount / orderPrice);
  return { bidUsdAmount, bidEthAmount };
}

function getAskOrderAmounts(orderPrice, accountEth, activeAsks, maxAsks) {
  const askEthAmount = BigNumber(accountEth).dividedBy(maxAsks - activeAsks);
  const askUsdAmount = BigNumber(askEthAmount * orderPrice);
  return { askUsdAmount, askEthAmount };
}

async function main() {
  const res = await fetch(orderbookUrl);
  if (res.status !== 200) {
    console.error('Failed to reach orderbook api status', res.status);
    return;
  }
  const orders = await res.json();
  const { highestBid, lowestAsk } = getSpreadMargins(orders);

  console.info('highest bid: ', highestBid);
  console.info('lowest ask: ', lowestAsk);

  const spreadMiddle = BigNumber(highestBid + lowestAsk).dividedBy(2);

  const bidPlacementRange = getPlacementRange(highestBid, orderRange, { upper: spreadMiddle });
  const askPlacementRange = getPlacementRange(lowestAsk, orderRange, { lower: spreadMiddle });

  console.info(`bid placement boundaries: ${bidPlacementRange.high.toFixed()} ${bidPlacementRange.low.toFixed()}`);
  console.info(`ask placement boundaries: ${askPlacementRange.high.toFixed()} ${askPlacementRange.low.toFixed()}`);

  const activeBids = activeOrders.bids.length;
  if (activeBids < allowedActiveOrders) {
    for (let i = 0; i < allowedActiveOrders - activeBids; i++) {
      const orderPrice = getOrderPrice(bidPlacementRange);
      const { bidUsdAmount, bidEthAmount } = getBidOrderAmounts(
        orderPrice, account.usd, activeOrders.bids.length, allowedActiveOrders
      );
      activeOrders.bids.push({ orderPrice, usdAmount: bidUsdAmount, ethAmount: bidEthAmount });
      account.usd -= bidUsdAmount;

      console.info(`BID PLACED @${orderPrice} ${bidEthAmount}`);
    }
  }

  const activeAsks = activeOrders.asks.length;
  if (activeAsks < allowedActiveOrders) {
    for (let i = 0; i < allowedActiveOrders - activeAsks; i++) {
      const orderPrice = getOrderPrice(askPlacementRange);
      const { askUsdAmount, askEthAmount } = getAskOrderAmounts(
        orderPrice, account.eth, activeOrders.asks.length, allowedActiveOrders
      );
      activeOrders.asks.push({ orderPrice, usdAmount: askUsdAmount, ethAmount: askEthAmount });
      account.eth -= askEthAmount;

      console.info(`ASK PLACED @${orderPrice} ${askEthAmount}`);
    }
  }
}

if (process.env.NODE_ENV === 'dev') {
  main();
}

module.exports = {
  _getSpreadMargins: getSpreadMargins,
  _getPlacementRange: getPlacementRange,
  _getBidOrderAmounts: getBidOrderAmounts,
  _getAskOrderAmounts: getAskOrderAmounts,
};