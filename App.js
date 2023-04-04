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
        let date_ob = new Date();

        let date = date_ob.getFullYear() + "-" + ("0" + (date_ob.getMonth() + 1)).slice(-2) + "-" + ("0" + date_ob.getDate()).slice(-2);
        let time = (date_ob.getHours() + ":" + date_ob.getMinutes())
        let next_job_flag = false;

        if(data.games.length > 0) {
          data.games.forEach((element, index) => {
            console.log("Game #" + (index + 1))
            console.log(element.teams.home.name + " vs " + element.teams.away.name)
            let starttime_ob = new Date(element.startTime)

            if (starttime_ob.getTime() > date_ob.getTime() && !next_job_flag) {
              const schedule_string = `${starttime_ob.getMinutes()} ${starttime_ob.getHours()} ${starttime_ob.getDate()} ${starttime_ob.getMonth() + 1} *`;
              const job = schedule.scheduleJob(schedule_string, GetDataAndSaveToSQL);
              next_job_flag = true;
              console.log("Next Job Scheduled for: " + starttime_ob.toLocaleString());
            }

          });
        }
        if (!next_job_flag) {
          const schedule_string = `0 0 ${date_ob.getDate() + 1} ${date_ob.getMonth() + 1} *`
          const job = schedule.scheduleJob(schedule_string, GetDataAndSaveToSQL);
          console.log("Next Check Scheduled for midnight!");
        }
        console.log("")
      
        if(data.hasOwnProperty("sets")) {
          if(data.sets[0].players.length === 0) console.log("No more picks")
          else {
            var options = [];
            data.sets.forEach((element, setnum) => {
              console.log("Set #" + (setnum + 1))
              if(element.players.length > 0) element.players.forEach((element, optionnum) => {
                console.log("Option #" + (optionnum + 1));
                // console.log(element)
                console.log(element.firstName + " " + element.lastName)
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
                let record_count = 0
                options.forEach((element) => {
                  var sqlInsert = `INSERT INTO Options (setnumber, FirstName, LastName, choiceDate, choiceTime) 
                                  VALUES (${element.setnumber}, "${element.FirstName}", "${element.LastName}", "${element.choiceDate}", "${element.choiceTime}")`
                  con.query(sqlInsert, (err, result) => {
                    if (err) throw err;
                    else record_count++;
                  });
                });
                if(record_count) console.log(`${record_count} record${(record_count === 1) ? "" : "s"} inserted`);
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

GetDataAndSaveToSQL();

const httpServer = require("http").createServer(requestListener);
httpServer.listen(8000);
console.log("Now listening on port 8000");
