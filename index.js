const fetch = require('node-fetch');
const { orderbookUrl } = require('./config');

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

async function main () {
  const res = await fetch(orderbookUrl);
  if (res.status !== 200) {
    console.error('Failed to reach orderbook api status', res.status);
    return;
  }
  const orders = await res.json();
  const { highestBid, lowestAsk } = getSpreadMargins(orders);

  console.info('highest bid: ', highestBid);
  console.info('lowest ask: ', lowestAsk);
}

main();

module.exports = {
  _getSpreadMargins: getSpreadMargins,
};