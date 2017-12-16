// Quickfolio
const fluidb = require('fluidb');
var db = new fluidb();
const request = require('request');

let coins = Object.keys(db.portfolio);

getPrices = (coins) => {
    request('https://bittrex.com/Api/v2.0/pub/currencies/GetBTCPrice', function(error, response, body) {
        body = JSON.parse(body);
        let btcPrice = body.result.bpi.USD.rate_float;
        allCoins = coins.map(data => {
            return new Promise((res, rej) => {
                request('https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-' + data.toLowerCase(), function(error, response, body) {
                    if (!body.includes("Error: 500")) {
                        body = JSON.parse(body);
                        db.portfolio[data].name = data;
                        if (data == "BTC") {
                            db.portfolio[data].usd = btcPrice;
                            db.portfolio[data].timestamp = Date.now();
                            res(db.portfolio[data]);
                        } else if (body.message != "INVALID_MARKET") {
                            db.portfolio[data].usd = (body.result[0].Last * btcPrice).toFixed(2);
                            db.portfolio[data].last = body.result[0].Last.toFixed(8);
                            db.portfolio[data].change = (((body.result[0].Last / body.result[0].PrevDay) - 1) * 100).toFixed(2)
                            db.portfolio[data].timestamp = Date.now();
                            res(db.portfolio[data]);
                        }
                    } else {
                        console.log("Error Fetching Prices")
                    }
                });
            })
        })

        Promise.all(allCoins).then(values => {
            let usdValue = 0;
            let btcValue = 0;
            let allChange = 0;
            values.sort(function(a, b) {
                // Compare the 2 dates
                if (a.usd * a.qty > b.usd * b.qty) return -1;
                if (b.usd * b.qty > a.usd * a.qty) return 1;
                return 0;
            }).forEach(values => {
                if (values.name == "BTC") {
                    if (process.argv[2] == "full") {
                        console.log("BTC Price: $" + values.usd + "\n----------");
                    }
                    usdValue += (values.qty * values.usd);
                    btcValue += parseFloat(values.qty);
                } else {
                    if (process.argv[2] == "full") {
                        console.log(values.name + " / Price: " + values.last + " / 24H Change: " + values.change + "%")
                    }
                    usdValue += (values.qty * values.usd);
                    btcValue += values.qty * values.last;
                    allChange += (values.change * (values.qty * values.last));
                }
            })
            console.log("Portfolio Value: " + btcValue.toFixed(8) + " BTC / $" + (usdValue / 1000).toFixed(2) + "K" + " / Change: " + (allChange / btcValue).toFixed(2) + "%");
        })
    })
}


getPrices(coins);