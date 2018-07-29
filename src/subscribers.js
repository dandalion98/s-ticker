var _ = require('lodash'),
    log = require('tracer').colorConsole();

class AssetSubscriberMap {
    constructor() {
        this.tickerSubscriberMap = {}
    }

    updateSubscriber(socket, tickers) {
        log.info("updating subscriber: " + socket.id)

        this.removeSubscriber(socket)

        let newTickers = []
        for (let ticker of tickers) {
            if (!this.tickerSubscriberMap[ticker]) {
                this.tickerSubscriberMap[ticker] = []
                newTickers.push(ticker)
            }

            this.tickerSubscriberMap[ticker].push(socket)
        }
        this.dump()
        return newTickers
    }

    dump() {
        let o = {}
        for (let t in this.tickerSubscriberMap) {
            o[t] = []
            for (let s of this.tickerSubscriberMap[t]) {
                o[t].push(s.id)
            }
        }
        console.dir(o)
    }

    cleanUnusedTickers() {
        let unusedTickers = []
        for (let ticker in this.tickerSubscriberMap) {
            let subscribers = this.tickerSubscriberMap[ticker]
            if (!subscribers.length) {
                unusedTickers.push(ticker)
                delete this.tickerSubscriberMap[ticker]
            }
        }
        return unusedTickers
    }

    removeSubscriber(socket) {
        log.info("removing subscriber: " + socket.id)
        let removedTickers = []
        for (let ticker in this.tickerSubscriberMap) {
            let subscribers = this.tickerSubscriberMap[ticker]
            var index = subscribers.indexOf(socket);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        }
        // console.dir(this.tickerSubscriberMap)
        return removedTickers
    }

    onTradePriceChange(ticker, price) {
        let subscribers = this.tickerSubscriberMap[ticker]
        if (!subscribers) {
            return
        }

        for (let s of subscribers) {
            s.emit("priceChange", { type: "lastTrade", price: price, ticker: ticker });
        }
    }

    onClosePriceChange(ticker, price) {
        let subscribers = this.tickerSubscriberMap[ticker]
        if (!subscribers) {
            return
        }

        for (let s of subscribers) {
            s.emit("priceChange", { type: "lastClose", price: price, ticker: ticker });
        }
    }
}

module.exports.AssetSubscriberMap = AssetSubscriberMap