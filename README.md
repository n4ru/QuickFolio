# QuickFolio

A quick and dirty blockfolio clone written in node.

### Setup

`npm install`, then create a `coin.json` file and input your coins using this JSON template:

```
{
    "portfolio": {
        "BTC": {
            "qty": 1
        },
        "ETH": {
            "qty": 5
        },
        "LTC": {
            "qty": 10
        }
    }
}
```

### Arguments

Running with no arguments (`node quick`) will give you your total BTC holdings, USD holdings, and 24h BTC change. Running with `node quick full` will also displays individual coin prices, percent holdings, and 24h change. Running with `node quick full-hide` will display all individual coin values as well, but hide the total portfolio value at the end. 

**NOTE:** Only coins on Bittrex are currently supported.