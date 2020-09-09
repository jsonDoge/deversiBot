const fetch = require('node-fetch');
const { orderbookUrl } = require('./config');

async function main () {
  const res = await fetch(orderbookUrl);
  if (res.status !== 200) {
    console.error('Failed to reach orderbook api status', res.status);
    return;
  }
  const orders = await res.json();
  const asks = orders.filter((o) => o[2] < 0);
  const bids = orders.filter((o) => o[2] > 0);
  
  console.info('bids: ', bids);
  console.info('asks: ', asks);
}

main();