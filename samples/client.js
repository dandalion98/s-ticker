var _ = require('lodash'),
    io = require('socket.io-client'),
    path = require('path'),
    config = require('../config/config'),
    log = require('tracer').colorConsole();

async function main() {
    let url = "http://localhost:" + config.port
    log.info("Connecting to: " + url)

    let socket = io(url);

    socket.on('subscribe', (data) => {
        console.log("got subscr")
        console.dir(data)
    });

    socket.on('priceChange', (data) => {
        console.log("got priceChange")
        console.dir(data)
    });

    socket.on('reconnect', function () {
        console.log('io reconnecting');
    });

    let tickers = ["CNY-GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX"]
    socket.emit('subscribe', { tickers: tickers });
}

main()