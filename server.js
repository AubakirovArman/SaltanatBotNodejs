var app = require('express')();
var http=require('http').Server(app);
var io =require('socket.io')(http);
const { SSL_OP_SINGLE_DH_USE } = require('constants');
const Binance = require( 'node-binance-api' );
const binanceClass = require('./binancespot').default;
const binance = new Binance();
let telegram=require('./telegrammclass')

var teleg =new telegram();
// настройка 

teleg.status="вкл"
teleg.id="id you teltegramm"
teleg.token="token bot telegramm "

// настройка бинанс api для реальной биржы
binance.options({
    'APIKEY':'you api key binance',
    'APISECRET':'you api secret binance',
    reconnect: true ,
  });
// все что ниже трогать нельзя )))

// общая библиотека где есть текущие цены и фильтры
teleg.url="https://api.telegram.org/bot"+teleg.token;
global.ticker = {};
global.ticker.spot = {};
global.ticker.futures = {};
global.ticker.futuresDapi = {};
global.stat={}
global.stat["por"]=1
global.balance = {};
global.balance.spot = {};
global.balance.futures = {};
global.balance.futuresDapi = {};

// exchange info

global.filters={}

global.filters.spot={}
global.filters.futures={}
global.filters.futuresDapi={}





//   загзурка фильтра  для спот  в global а также ежедневная обновление значений


async function loadExchangeInfo(){
	binance.exchangeInfo(function(error, data) {
		let minimums = {};
		if (error==null){
			for ( let obj of data.symbols ) {
				let filters = {status: obj.status};
				filters.baseAsset=obj.baseAsset
				filters.quoteAsset=obj.quoteAsset
				for ( let filter of obj.filters ) {
		
		
					if ( filter.filterType == "MIN_NOTIONAL" ) {
						filters.minNotional = filter.minNotional;
					} else if ( filter.filterType == "PRICE_FILTER" ) {
						filters.minPrice = filter.minPrice;
						filters.maxPrice = filter.maxPrice;
						filters.tickSize = filter.tickSize;
					} else if ( filter.filterType == "LOT_SIZE" ) {
						filters.stepSize = filter.stepSize;
						filters.minQty = filter.minQty;
						filters.maxQty = filter.maxQty;
					}
				}
		
		
				//filters.baseAssetPrecision = obj.baseAssetPrecision;
				//filters.quoteAssetPrecision = obj.quoteAssetPrecision;
				filters.orderTypes = obj.orderTypes;
				filters.icebergAllowed = obj.icebergAllowed;
				minimums[obj.symbol] = filters;
			}
			global.filters.spot=minimums
		}else{
			console.log(error)
		}
	}); 

	let r= await binance.futuresExchangeInfo()
	let minimums = {};
	for (let obj of r.symbols){
		let filters = {status: obj.status};
		filters.baseAsset=obj.baseAsset
		filters.quoteAsset=obj.quoteAsset
		for ( let filter of obj.filters ) {


			if ( filter.filterType == "MIN_NOTIONAL" ) {
				filters.minNotional = filter.minNotional;
			} else if ( filter.filterType == "PRICE_FILTER" ) {
				filters.minPrice = filter.minPrice;
				filters.maxPrice = filter.maxPrice;
				filters.tickSize = filter.tickSize;
			} else if ( filter.filterType == "LOT_SIZE" ) {
				filters.stepSize = filter.stepSize;
				filters.minQty = filter.minQty;
				filters.maxQty = filter.maxQty;
			}
		}


		filters.orderTypes = obj.orderTypes;
		filters.icebergAllowed = obj.icebergAllowed;
		minimums[obj.symbol] = filters;
	}
	global.filters.futures=minimums

	r= await binance.deliveryExchangeInfo()
	minimums = {};
	for (let obj of r.symbols){
		let filters = {status: obj.status};
		filters.baseAsset=obj.baseAsset
		filters.quoteAsset=obj.quoteAsset
		filters.contractSize=obj.contractSize
		for ( let filter of obj.filters ) {


			if ( filter.filterType == "MIN_NOTIONAL" ) {
				filters.minNotional = filter.minNotional;
			} else if ( filter.filterType == "PRICE_FILTER" ) {
				filters.minPrice = filter.minPrice;
				filters.maxPrice = filter.maxPrice;
				filters.tickSize = filter.tickSize;
			} else if ( filter.filterType == "LOT_SIZE" ) {
				filters.stepSize = filter.stepSize;
				filters.minQty = filter.minQty;
				filters.maxQty = filter.maxQty;
			}
		}


		filters.orderTypes = obj.orderTypes;
		filters.icebergAllowed = obj.icebergAllowed;
		minimums[obj.symbol] = filters;
	}
	global.filters.futuresDapi=minimums

}

loadExchangeInfo();
setInterval( () => {
	loadExchangeInfo();
}, 86400000 );
// загрузка цены в global обновление значения в режиме онлайн
binance.websockets.bookTickers(obj => {
    global.ticker.spot[obj.symbol] = obj;
} );

function sum(obj) {
	return Object.keys(obj).reduce((sum,key)=>sum+parseFloat(obj[key]||0),0);
  }


binance.futuresBookTickerStream( obj => {
    global.ticker.futures[obj.symbol] = obj;

} );

binance.deliveryBookTickerStream( obj => {
    global.ticker.futuresDapi[obj.symbol] = obj;

} );





io.sockets.on('connection',function(socket){
	io.sockets.emit('spotTicker',{spotTicker:global.ticker.spot.BNBUSDT})
	io.sockets.emit('futuresTickerDapi',{futuresTickerDapi:global.ticker.futuresDapi.BNBUSD_210625})

	io.sockets.emit('futuresTicker',{futuresTicker:global.ticker.futures.BNBUSDT})

	io.sockets.emit('spotBalance',{spotBalance:global.balance.spot})


	io.sockets.emit('fapiBalance',{fapiBalance:global.balance.futures})

	io.sockets.emit('dapiBalance',{dapiBalance:global.balance.futuresDapi})


	socket.on('disconnect',function(){
		io.sockets.emit('spotTicker',{spotTicker:"ss"})
		console.log('disconnect')
	})
})




// route
app.get('/',function(req,res){
	res.render('pages/index',{
		tagline:'sad'
	})
});
app.set('view engine', 'ejs');

// первичная загрузка баланса



let stat=0
async function loadbalance(){

	let r = await binance.deliveryBalance();
	for (el in r){
		global.balance.futuresDapi[r[el].asset]=r[el]
	}
	r = await binance.futuresBalance();
	for (el in r){
		global.balance.futures[r[el].asset]=r[el]
	}




	binance.balance((error, balances) => {
		if ( error ) {
			console.info(balances)
			console.info(error)
			teleg.text=teleg.text+JSON.stringify(balances)+"\n вам нужно перезапустит node js"
			stat=1
		}else{
			global.balance.spot =balances

			console.log('load balance')
			s=2;
		}
	});



}



loadbalance()

// userDeliveryData
// userFutureData
binance.websockets.userDeliveryData(false,
(bal)=>{
	for (el in bal.updateData.balances){
		global.balance.futuresDapi[bal.updateData.balances[el].asset].balance=bal.updateData.balances[el].walletBalance
		global.balance.futuresDapi[bal.updateData.balances[el].asset].crossWalletBalance=bal.updateData.balances[el].crossWalletBalance
	}
},
false,
false
)


binance.websockets.userFutureData(
	false,
	(bal)=>{
		for (el in bal.updateData.balances){
			global.balance.futures[bal.updateData.balances[el].asset].balance=bal.updateData.balances[el].walletBalance
			global.balance.futures[bal.updateData.balances[el].asset].crossWalletBalance=bal.updateData.balances[el].crossWalletBalance
		}
	},
	false,
		false
);

binance.websockets.userData((bal)=>{

	for (el in bal.B){
		global.balance.spot[bal.B[el].a].available=bal.B[el].f
		global.balance.spot[bal.B[el].a].onOrder=bal.B[el].l
	}
},
false,
false,
false
)




///////////////////////////////////
















// index page
var port=80





app.post('/id', function(req, res) {
    let tagline =req.hostname
    const binancelogica = require('./binancelogica')
    let r=''
    req.on('data', chunk => {
       r = `${chunk}`
	   console.log(r)
      })
    req.on('end', () => {
        let logica = binancelogica(r,global);
		console.log(logica)
    })

	res.jsonp({'good':"done"})
});

// about page
app.get('/about', function(req, res) {
    res.render('pages/about');
});

http.listen(port,function(){
console.log(port+' is the magic port');
});





teleg.text="Saltanat Bot на node js запущен"
teleg.telegramSendText()





module.exports.binance=binance; 
module.exports.teleg=teleg; 
