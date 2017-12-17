// Quickfolio
const fluidb = require('fluidb');
var db = new fluidb('coins');
const request = require('request');
var colors = require('colors')

getPrices = (coins) => {
    request('https://api.coinmarketcap.com/v1/ticker/bitcoin/', function(error, response, body) {
        body = JSON.parse(body);
        db.portfolio.BTC.change = body[0].percent_change_24h;
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
                                db.portfolio[data].usd = btcPrice.toFixed(2);
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
                values.forEach(values => {
                    usdValue += (values.qty * values.usd);
                    if (values.name == "BTC") {
                        btcValue += parseFloat(values.qty);
                    } else {
                        btcValue += values.qty * values.last;
                        values.btcQty = values.qty * values.last;
                    }
                })
                console.log("Coin  /    Price   / Holdings / 24h Change")
                values.sort(function(a, b) {
                    // Compare the 2 dates
                    if (a.usd * a.qty > b.usd * b.qty) return -1;
                    if (b.usd * b.qty > a.usd * a.qty) return 1;
                    return 0;
                }).forEach(values => {
                    values.change = Number(values.change).toFixed(2)
                    let changeColor = null;
                    if (values.change > 0) {
                        values.change = "+" + values.change
                    } else {}
                    if (Math.abs(values.change < 10)) {
                        values.change = values.change.toString()[0] + "0" + Math.abs(values.change).toFixed(2)
                    }
                    values.change += "%";
                    if (values.change[0] == "+") {
                        changeColor = values.change.green
                    } else {
                        changeColor = values.change.red
                    }
                    if (values.name == "BTC") {
                        if (process.argv[2] == "full" || process.argv[2] == "full-hide") {
                            console.log("BTC   / $" + parseFloat(values.usd).toFixed(8 - parseInt(values.usd).toString().length) + " /  " + (values.qty / btcValue * 100).toFixed(2) + "%  / " + changeColor);
                        }
                    } else {
                        if (process.argv[2] == "full" || process.argv[2] == "full-hide") {
                            if ((values.btcQty / btcValue * 100).toFixed(2) < 10) {
                                console.log(values.name + "   / " + values.last + " /  0" + (values.btcQty / btcValue * 100).toFixed(2) + "%  / " + changeColor)

                            } else {
                                console.log(values.name + "   / " + values.last + " /  " + (values.btcQty / btcValue * 100).toFixed(2) + "%  / " + changeColor)
                            }
                        }
                    }
                })
                values.forEach(values => {
                    values.change = values.change.slice(0, -1);
                    if (values.name != "BTC") {
                        allChange += (values.change * (values.btcQty / btcValue));
                    }
                });
                console.log("----------")
                let portChange = (allChange / btcValue).toFixed(2);
                let usdVal = (usdValue / 1000).toFixed(2);
                if (Math.abs(portChange) < 10) {
                    portChange = "0" + Math.abs(portChange).toFixed(2);
                }
                if (portChange > 0) {
                    portChange = "+" + portChange + "%"
                    portChange = portChange.green
                }
                if (portChange < 0) {
                    portChange = "-" + portChange + "%"
                    portChange = portChange.red
                }
                if (process.argv[2] == "full-hide") {
                    console.log("Total /        HIDDEN         / " + portChange);
                } else {
                    console.log("Total / " + btcValue.toFixed(8) + " / $" + usdVal + "K" + " / " + portChange);
                }
            })
        })
    })
}

if (JSON.stringify(db) == "{}") {
    db.portfolio = {
        "BTC": {
            "qty": 0
        },
        "LTC": {
            "qty": 0
        }
    }
    console.log("No coins were found. Please check and edit the coins.json file to add coins to your portfolio.")
} else {
    let coins = Object.keys(db.portfolio);
    getPrices(coins);
}