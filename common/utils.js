var utils = {};
var sha1 = require('sha1');
var request = require('request');
var qs = require('querystring');
var fs = require('fs');

//检查微信签名认证中间件
utils.sign = function (config){
	return function(req, res, next){
		config = config || {};
		var q = req.query;
	  var token = this.getFileToken().token;
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

utils.accessToken = function(config){
let queryParams = {
    'grant_type': 'client_credential',
    'appid': config.appId,
    'secret': config.appSecret
  };

  let wxGetAccessTokenBaseUrl = config.prefix + 'token?'+qs.stringify(queryParams);
  let options = {
    method: 'GET',
    url: wxGetAccessTokenBaseUrl
  };
  return new Promise((resolve, reject) => {
    request(options, function (err, res, body) {
      if (res) {
        resolve(JSON.parse(body));
      } else {
        reject(err);
      }
    });
  })
};

utils.saveToken = function (config) {
  this.accessToken(config).then(res => {
    let token = res['access_token'];
    fs.writeFile('./token', token, function (err) {
      
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

module.exports = utils;