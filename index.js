const fetch = require('node-fetch');
const { orderbookUrl } = require('./config');

async function main () {
  const res = await fetch(orderbookUrl);
  if (res.status !== 200) {
    console.error('Failed to reach orderbook api status', res.status);
    return;
  }
  const orders = await res.json();
  let asks = [];
  let bids = [];
  orders.forEach((o) => {
    if (o[2] < 0) { asks.push(o); return; }
    bids.push(o);
  });
  
  console.info('bids: ', bids);
  console.info('asks: ', asks);
}

main();