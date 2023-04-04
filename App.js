const mysql = require('mysql');
const moment = require('moment');
const jstz = require('jstz');
const TimsAPI = require('./TimsAPI.js');
const util = require('util');
const schedule = require('node-schedule');

const timezone = jstz.determine();

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Mechanical2019",
  database: 'testing'
});

const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("acknowledge");
};
var API = new TimsAPI;

con.connect[util.promisify.custom] = () => {
  return new Promise((resolve, reject) => {
    con.connect((err) =>{
      if (err) reject(err)
      else resolve()
    });
  });
};

const sqlConnect = util.promisify(con.connect);

function GetDataAndSaveToSQL () {
  const sqlConnectPromise = sqlConnect()
  const APIConnectPromise = API.connect()

  Promise.all([sqlConnectPromise, APIConnectPromise])
  .then((values) => {
      API.GetGamesAndPlayers()
      .then((data) => {

        data.games.forEach((element, index) => {
          console.log("Game #" + (index + 1))
          console.log(element.teams.home.name + " vs " + element.teams.away.name)
          let starttime = new Date(element.startTime).toLocaleDateString(
            'en',
            {
              hour: "numeric", 
              minute: "numeric",
              hour12: false,
              timeZone: 'utc'
            });
          console.log(starttime)
        })
        console.log("")
      
        if(data.hasOwnProperty("sets")) {
          if(data.sets[0].players.length === 0) console.log("No more picks")
          else {
            var options = [];
            let date_ob = new Date();
            // var date_ob_utc = new Date(Date.UTC(date_ob.getUTCFullYear(), date_ob.getUTCMonth(),
            //                 date_ob.getUTCDate(), date_ob.getUTCHours(),
            //                 date_ob.getUTCMinutes(), date_ob.getUTCSeconds()));

            let date = date_ob.getFullYear() + "-" + ("0" + (date_ob.getMonth() + 1)).slice(-2) + "-" + ("0" + date_ob.getDate()).slice(-2);
            let time = (date_ob.getUTCHours() + ":" + date_ob.getUTCMinutes())
            console.log(date)
            console.log(time)
            data.sets.forEach((element, setnum) => {
            console.log("Set #" + (setnum + 1))
            if(element.players.length > 0) element.players.forEach((element, optionnum) => {
              console.log("Option #" + (optionnum + 1));
              // console.log(element)
              console.log(element.firstName + " " + element.lastName)

              // var sqlInsert = `INSERT INTO Options (setnumber, FirstName, LastName, choiceDate, choiceTime) 
              //                 VALUES (${setnum}, "${element.firstName}", "${element.lastName}", "${date}", "${time}")`
              // con.query(sqlInsert, (err, result) => {
              //   if (err) throw err;
              //   console.log("1 record inserted");
              // });
              options.push({
                setnumber : setnum,
                FirstName : element.firstName,
                LastName : element.lastName,
                choiceDate : date,
                choiceTime : time
              });
              });
            });
            var sqlSelect = `SELECT setnumber, FirstName, LastName FROM Options WHERE Options.choiceDate = "${date}"`
            con.query(sqlSelect, (err, result) => {
              if (err) throw err;
              let doesSetMatch = false;
              if (result.length > 0) {
                doesSetMatch = true;
                options.forEach((element) => {
                  var matches = result.filter((resultElement) => {
                    return (element.FirstName == resultElement.FirstName && 
                             element.LastName == resultElement.LastName && 
                            element.setnumber == resultElement.setnumber);
                  });
                  if(matches.length === 0) doesSetMatch = false;
                });
              }
              if (!doesSetMatch){
                options.forEach((element) => {
                  var sqlInsert = `INSERT INTO Options (setnumber, FirstName, LastName, choiceDate, choiceTime) 
                                  VALUES (${element.setnumber}, "${element.FirstName}", "${element.LastName}", "${element.choiceDate}", "${element.choiceTime}")`
                  con.query(sqlInsert, (err, result) => {
                    if (err) throw err;
                    console.log("1 record inserted");
                  });
                });
              }
            });
          }
        }
      
        if(data.hasOwnProperty("picks")) data.picks.forEach((element, index) => {
          console.log("Pick #" + (index + 1))
          console.log(element.player.firstName + " " + element.player.lastName)
        });
      });
  });
}

const everyHalfHour = new schedule.RecurrenceRule();
everyHalfHour.minute = [0, 30];
everyHalfHour.second = 0;

const job = schedule.scheduleJob(everyHalfHour, () => {
  GetDataAndSaveToSQL();
});

GetDataAndSaveToSQL();

const httpServer = require("http").createServer(requestListener);
httpServer.listen(8000);
console.log("Now listening on port 8000");
