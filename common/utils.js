var utils = {};
var sha1 = require('sha1');
var request = require('request');
var qs = require('querystring');
var fs = require('fs');

//检查微信签名认证中间件
utils.sign = function (config){
	var that = this;
	return function(req, res, next){
		config = config || {};
		var q = req.query;
	  var token = that.getFileToken().token;
	  var signature = q.signature; //微信加密签名
		var nonce = q.nonce; //随机数
		var timestamp = q.timestamp; //时间戳
		var echostr = q.echostr; //随机字符串
		/*
		 	1）将token、timestamp、nonce三个参数进行字典序排序
			2）将三个参数字符串拼接成一个字符串进行sha1加密
			3）开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
		*/
		var str = [token, timestamp, nonce].sort().join('');
		var sha = sha1(str);
		if (req.method == 'GET') {

			if (sha == signature) {
				res.send(echostr+'')
			}else{
				res.send('err');
			}
		}
		else if(req.method == 'POST'){
			if (sha != signature) {
				return;
			}
			next();
		}
	}
};
utils.getTicket(req, res) = function (config){
	var that = this;
     return function(req, res, next){
     let noncestr = Math.random().toString(36).substr(2, 15);
     let ts = parseInt(new Date().getTime() / 1000) + '';
     let url = req.url;
     let str = 'jsapi_ticket=' + that.getFileTicket() + '&noncestr=' + noncestr + '&timestamp='+ ts +'&url=' + url;
     console.info(str);
     shaObj = new jsSHA(str, 'TEXT');
     signature = shaObj.getHash('SHA-1', 'HEX');

     res.json(
     	{
                  appId: config.wechat.appID,
                  timestamp: ts,
                  nonceStr: noncestr,
                  signature: signature,
                  jsApiList: [
                      'checkJsApi',
                      'onMenuShareTimeline',
                      'onMenuShareAppMessage',
                      'onMenuShareQQ',
                      'onMenuShareWeibo',
                      'hideMenuItems',
                      'chooseImage'
                  ]
              }
         );
    };
};

utils.saveTicket = function (config,access_token){
let wxGetTicketBaseUrl = config.wechat.prefix + ticket/getticket?+'access_token='+access_token+'&type=jsapi'; 
 let options = {
    method: 'GET',
    url: wxGetTicketBaseUrl
  }; 

    return new Promise((resolve, reject) => {
    request(options, function (err, res, body) {
      if (res) {
        resolve(body);
      } else {
        reject(err);
        console.info(res);
      }
    });
  })

}；
utils.accessToken = function(config){
let queryParams = {
    'grant_type': 'client_credential',
    'appid': config.wechat.appID,
    'secret': config.wechat.appSecret
  };

  let wxGetAccessTokenBaseUrl = config.wechat.prefix + 'token?'+qs.stringify(queryParams);
  let options = {
    method: 'GET',
    url: wxGetAccessTokenBaseUrl
  };
   console.info(res);
  return new Promise((resolve, reject) => {
    request(options, function (err, res, body) {
      if (res) {
        resolve(JSON.parse(body));
      } else {
        reject(err);
        console.info(res);
      }
    });
  })
};

utils.saveToken = function (config) {
	var that = this;
  this.accessToken(config).then(res => {
    let token = res['access_token'];
    fs.writeFile('./token', token, function (err) {
      that.saveTicket(config,token).then(_res =>{
      	         fs.writeFile('./ticket', _res, function (err) {

                 });
      });
    });
  })
};

utils.refreshToken = function (config) {
  this.saveToken(config);
  var that = this;
  setInterval(function () {
    that.saveToken(config);
  }, 7000*1000);
};

utils.getFileToken = function(){
	return fs.readFileSync('./token').toString();
};

utils.getFileTicket= function(){
	return fs.readFileSync('./ticket').toString();
};

module.exports = utils;