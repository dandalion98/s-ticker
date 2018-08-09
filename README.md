# stellar-ticker

A pub sub service that publishes the last close price, latest trade price and price change for any set of Stellar assets. 

Supports multiple clients and all Stellar assets. Each client may subscribe for a different set of interested Stellar assets.

Stellar Ticker was designed to make efficient calls to Horizon. A single active monitor will be created per asset, as needed (dictated by active subscribers).

A sample client is provided to show usage.

## Configuration
Default configuration stored in *config/env/default.js*
To override default configuration, create *config/env/development.js* or *config/env/production.js*, respectively for dev or prod environment.

#### Configuration Options
*stellarServer* - Address to the Horizon server used to obtain asset info.

*port* - Listening port for the server.

*pollIntervalSeconds* - Time period for polling each asset for which there are subscribers.

## Installation
*npm install*

## Usage
#### To Run Server in Dev Mode
*gulp*

#### To Run Server in Production Mode
*gulp prod*

#### To Run Sample Client
*gulp sample*

## Docker Image
Dockerfile is provided for building a Docker image for this service.

*docker build .*
