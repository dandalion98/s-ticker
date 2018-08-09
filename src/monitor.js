var _ = require('lodash'),
    log = require('tracer').colorConsole(),
    moment = require('moment'),
    StellarSdk = require('stellar-sdk');

class AssetPriceMonitor {
    constructor(ticker, stellarServer) {
        this.ticker = ticker
        this.stellarServer = stellarServer

        let temp = ticker.split("-")
        this.code = temp[0]
        this.issuer = temp[1]
        this.asset = new StellarSdk.Asset(this.code, this.issuer)
        this.lastCloseDate = moment().startOf("day")
    }

    async getLastClosePrice() {
        let today = moment().startOf("day")
        log.info(`getting last close price for ${this.asset.code} for ${today}`)

        var trades = this.stellarServer.tradeAggregation(this.asset, StellarSdk.Asset.native(), Date.now() - 432000 * 1000, Date.now(), 86400000).limit(5).order('desc')
        let data = await trades.call()
        // console.dir(data)
        let records = data.records

        for (let record of records) {
            if (record.close) {
                log.info("got last close: " + this.lastClosePrice)

                if (this.lastClosePrice != +record.close) {
                    this.lastClosePrice = +record.close
                    this.onClosePriceChange(this.ticker, this.lastClosePrice)
                }
                break
            }
        }

        this.lastCloseDate = today
    }

    async getLastTradePrice() {
        log.info(`getting last trade price for ${this.asset.code}`)
        var trades = this.stellarServer.trades().forAssetPair(this.asset, StellarSdk.Asset.native()).order("desc")
        trades = await trades.call()
        let records = trades.records
        if (records.length > 0) {
            let latest = records[0]
            let price = latest.price.n / latest.price.d
            if (price != this.lastTradePrice) {
                this.lastTradePrice = price

                if (this.lastClosePrice) {
                    this.lastTradePriceChange = (this.lastTradePrice - this.lastClosePrice) / this.lastClosePrice
                    this.lastTradePriceChange = this.lastTradePriceChange.toFixed(2)
                }

                this.onTradePriceChange(this.ticker, this.lastTradePrice, this.lastTradePriceChange)
            }
        }
    }

    async listenTrades() {
        log.info(`listenint to trades for ${this.asset.code}`)
        this.tradesStream = this.stellarServer.trades().forAssetPair(this.asset, StellarSdk.Asset.native()).order("desc").stream({
            onmessage: function (records) {
                log.info("streamed records")
                console.dir(records)
                // if (records.length > 0) {
                //     let latest = records[0]
                //     let price = latest.price.n / latest.price.d
                //     if (price != this.lastTradePrice) {
                //         this.lastTradePrice = price
                //         this.onTradePriceChange(this.ticker, this.lastTradePrice)
                //     }
                // }
            }
        });
    }

    async check() {
        let today = moment().startOf("day")
        if (undefined == this.lastClosePrice || today > this.lastCloseDate) {
            await this.getLastClosePrice()
        }

        await this.getLastTradePrice()

        this.scheduleCheck()
    }

    scheduleCheck() {
        let self = this
        this.timer = setTimeout(function () {
            self.check()
        }, 30 * 1000)
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    async start() {
        // this.listenTrades()
        await this.check()
    }
}

module.exports.AssetPriceMonitor = AssetPriceMonitor