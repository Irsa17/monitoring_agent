const request = require('request');
const fs = require('fs');
const ping = require ("net-ping");
const recursive = require("recursive-readdir");

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const urlMongo = "mongodb://172.19.1.2:27017/";
const urlMongoTwitter = "mongodb://172.19.1.3:27017/";
const urlMongoNews = "mongodb://172.19.1.3:27017/";

var app_port = 7777;
var express = require("express");
var app = express();
app.listen(app_port);

var portscanner = require('portscanner')
var getIP = require('ipware')().get_ip;
console.log("Run Using Port %s...", app_port);

var this_ip = '192.168.1.188';
var api_es = 'localhost:3737';

//v-10
var mongo_parameter = { useNewUrlParser: true, useUnifiedTopology: true }

try{
  MongoClient.connect(urlMongo, mongo_parameter, async function(err, mdb){
      // if(err) throw err;
      db = mdb;
  });
}catch(e){
  // console.log(e);
}
try{
  MongoClient.connect(urlMongoTwitter, mongo_parameter, async function(err, mdb){
      // if(err) throw err;
      dbtwitter = mdb;
  });
}catch(e){
  // console.log(e);
}

try{
  MongoClient.connect(urlMongoNews, mongo_parameter, async function(err, mdb){
      // if(err) throw err;
      dbnews = mdb;
  });
}catch(e){
  // console.log(e);
}
app.get("/", function(req, response){
  console.log(new Date(), "request data from "+ getIP(req).clientIp);
  response.send("mnt :)");
});

app.get("/elasticsearch", async function(req, response){
  try{

    var data = {};

    var options = {
      url:'http://'+api_es+'/api/search',
      form: {
        "query": "content:*",
        "source": "news",
        "max" : 1,
        "range": today()+" - "+today()
      }
    }

    var data_api = await check_api(options);
    var json = JSON.parse(data_api);
    if(json.data[0]){
      data.news = new Date(json.data[0].datetime_ms).toLocaleString();
    }

    var options = {
      url:'http://'+api_es+'/api/search',
      form: {
        "query": "content:*",
        "source": "twitter",
        "max" : 1,
        "range": today()+" - "+today()
      }
    }

    var data_api = await check_api(options);
    var json = JSON.parse(data_api);
    if(json.data[0]){
      data.twitter = new Date(json.data[0].datetime_ms).toLocaleString();
    }

    var options = {
      url:'http://'+api_es+'/api/search',
      form: {
        "query": "content:*",
        "source": "youtube",
        "max" : 1,
        "range": today()+" - "+today()
      }
    }

    var data_api = await check_api(options);
    var json = JSON.parse(data_api);
    if(json.data[0]){
      data.youtube = new Date(json.data[0].datetime_ms).toLocaleString();
    }

    var options = {
      url:'http://'+api_es+'/api/search',
      form: {
        "query": "content:*",
        "source": "instagram",
        "max" : 1,
        "range": today()+" - "+today()
      }
    }

    var data_api = await check_api(options);
    var json = JSON.parse(data_api);
    if(json.data[0]){
      data.instagram = new Date(json.data[0].datetime_ms).toLocaleString();
    }

    var options = {
      url:'http://'+api_es+'/api/search',
      form: {
        "query": "content:*",
        "source": "facebook",
        "max" : 1,
        "range": today()+" - "+today()
      }
    }

    var data_api = await check_api(options);
    var json = JSON.parse(data_api);
    if(json.data[0]){
      data.facebook = new Date(json.data[0].datetime_ms).toLocaleString();
    }

    data.status = 1;
    console.log(new Date(), "success request data elasticsearch from "+ getIP(req).clientIp);
    response.send(data);
  }catch(e){
    console.log(e);
    console.log(new Date(), "error request data elasticsearch from "+ getIP(req).clientIp);

    var json = {};
        json.status = 0;
    response.send(json);
  }
});

app.get("/mongodb", async function(req, response){
  try {

  var data = {};

  data.now = new Date().toLocaleString();

  const data_news = await dbnews.db("kazee_news").collection("news").find({},
      {
              "limit": 1,
              "sort": {
                  "_id": -1
              }
            }).toArray();
  data.news = new Date(data_news[0].datetime_ms).toLocaleString();

  const data_twitter = await dbtwitter.db("kazee_twitter").collection("tweet").find({},
      {
              "limit": 1,
              "sort": {
                  "_id": -1
              }
            }).toArray();
  data.twitter = new Date(data_twitter[0].datetime_ms).toLocaleString();

  const data_youtube = await db.db("kazee_youtube_tmp").collection("video").find({},
      {
              "limit": 1,
              "sort": {
                  "_id": -1
              }
            }).toArray();
  data.youtube = new Date(data_youtube[0].datetime_ms).toLocaleString();

  const data_instagram = await db.db("kazee_instagram_tmp").collection("post").find({},
      {
              "limit": 1,
              "sort": {
                  "_id": -1
              }
            }).toArray();
  data.instagram = new Date(data_instagram[0].datetime_ms).toLocaleString();

  const data_facebook = await db.db("kazee_facebook_tmp").collection("feed").find({},
      {
              "limit": 1,
              "sort": {
                  "_id": -1
              }
            }).toArray();
  data.facebook = new Date(data_facebook[0].datetime_ms).toLocaleString();

  data.status = 1;
    console.log(new Date(), "success request data mongodb from "+ getIP(req).clientIp);
  response.send(data);

  }catch(e){
    // console.log(e);
    console.log(new Date(), "error request data mongodb from "+ getIP(req).clientIp);

    var json = {};
        json.status = 0;
    response.send(json);
  }
});

app.get("/port", async function(req, response){
  try{

  var all = require('./config.json');

  var ret_on = [];
  var ret_off = [];
  for(var x=0; x<all.length; x++){
    var obj = all[x];

    for (var prop in obj){
        for (var xxx in obj[prop]){
            var desc = obj[prop][xxx];
            var port = xxx;
            var ip = prop;

            var arr_push = {};
            if (ip=='localhost') {
              arr_push.ip=this_ip;
            }else{
              arr_push.ip = ip;
            }
            arr_push.port = port;
            arr_push.desc = desc;

            var check = await check_port(port, ip);
            if(check == "open"){
              arr_push.status = check;
              ret_on.push(arr_push);
            }else{
              arr_push.status = check;
              ret_off.push(arr_push);
            }
        }
    }
  }

  var ret = {};
  ret.off = ret_off;
  ret.on = ret_on;

  // data.status = 1;

  console.log(new Date(), "success request data port from "+ getIP(req).clientIp,"|ouput:", JSON.stringify(ret) );
  response.send(ret);
  }
  catch(e){
    console.log(e);
    console.log(new Date(), "error request data port from "+ getIP(req).clientIp);

    var json = {};
        json.status = 0;
    response.send(json);
  }
});

app.get("/error/news", async function(req, response){
  recursive("", function (err, files) {
    console.log(files);
  });

  response.send(":)");
});

app.get("/error/news-detail", async function(req, response){
  response.send(":)");
});

function check_port(port, ip){
  return new Promise(function(resolve, reject){
    portscanner.checkPortStatus(port, ip, function(error, port) {
      return resolve(port);
    })
  });
};

function check_api(options){
  return new Promise(function(resolve, reject){
    request.post(options, function(err, httpResponse, body){
      return resolve(body);
    });
  });
};

function check_ping(port){
  return new Promise(function(resolve, reject){
    ping.createSession().pingHost (port, function (error, target) {
      if(error){
        return resolve("off");
      }else{
        return resolve("on");
      }
    });
  });
};

function today() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
}

function last_day(diff) {
    var d = new Date();
        d.setDate(d.getDate()-diff);

    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
}