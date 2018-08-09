'use strict';

var _ = require('lodash'),
    path = require('path'),
    log = require('tracer').colorConsole(),
    colors = require("colors"),
    queryLog = require('tracer').colorConsole({
        methods: ["info"],
        filters: [colors.grey]
    }),
    moment = require('moment'),
    express = require('express'),
    config = require('./config/config'),
    StellarSdk = require('stellar-sdk'),
    AssetSubscriberMap = require("./src/subscribers").AssetSubscriberMap,
    AssetPriceMonitor = require("./src/monitor").AssetPriceMonitor,
    util = require('util');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let lastTradeId;
var server = new StellarSdk.Server(config.stellarServer);

let assetSubscriberMap = new AssetSubscriberMap()
let assetMonitorMap = {}

async function main() {

}

main()

function stopUnusedMonitors() {
    let unusedTickers = assetSubscriberMap.cleanUnusedTickers()
    for (let unusedTicker of unusedTickers) {
        console.log("unused ticker: "+ unusedTicker)
        let monitor = assetMonitorMap[unusedTicker]
        if (!monitor) {
            continue
        }

        console.log("stopping monitor")        
        monitor.stop()
        delete assetMonitorMap[unusedTicker];
    }
}

function handleConnection(socket) {
    socket.on('subscribe', function (msg) {
        log.info("update subscriber: " + socket.id)
        console.dir(msg)
        let newTickers = assetSubscriberMap.updateSubscriber(socket, msg.tickers)
        
        for (let newTicker of newTickers) {
            if (!assetMonitorMap[newTicker]) {
                log.info("creating new monitor for: " + newTickers)
                let monitor = new AssetPriceMonitor(newTicker, server, config)
                monitor.onTradePriceChange = (ticker, price, change) => assetSubscriberMap.onTradePriceChange(ticker, price, change)
                monitor.onClosePriceChange = (ticker, price) => assetSubscriberMap.onClosePriceChange(ticker, price)
                assetMonitorMap[newTicker] = monitor
                monitor.start()                
            }
        }

        // log.info("sending info")
        for (let ticker of msg.tickers) {
            // log.info('checking ' + ticker)
            let monitor = assetMonitorMap[ticker]
            if (!monitor) {
                log.error("Can't find monitor for ticker: " + ticker)
                continue
            }

            if (monitor.lastClosePrice != undefined) {
                socket.emit("priceChange", { type: "lastClose", price: monitor.lastClosePrice, ticker: ticker });
            }

            if (monitor.lastTradePrice) {
                socket.emit("priceChange", { type: "lastTrade", price: monitor.lastTradePrice, ticker: ticker, change: monitor.lastTradePriceChange});
            }
        }

        stopUnusedMonitors()
    });

    socket.on('disconnect', function () {
        assetSubscriberMap.removeSubscriber(socket)
        stopUnusedMonitors()
    });
}

io.on('connection', function (socket) {
    console.log('a user connected: id=' + socket.id);
    handleConnection(socket)
});

http.listen(config.port, function () {
    console.log(`listening on *:${config.port}`);
});

async function checkHealth(request, response) {
    response.json({ status: "ok" })
}

app.route('')
    .get(checkHealth)

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});