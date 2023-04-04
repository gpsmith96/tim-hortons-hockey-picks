const license = require('./License.js');

class TimsApi {
  ACCESS_TOKEN = "";
  ID_TOKEN = "";
  EMAIL = "";

  connect() {
    return new Promise((resolve, reject) => {
      this.GetBearerToken()
        .then((data) => {
          this.ACCESS_TOKEN = data.AuthenticationResult.AccessToken;
          this.ID_TOKEN = data.AuthenticationResult.IdToken;
          this.GetEmail()
            .then((data) => {
              this.EMAIL = data.UserAttributes[1].Value;
              console.log("Connected to Tims API!");
              resolve();
        })});
    });
  }

  GetBearerToken() {
    const url = 'https://cognito-idp.us-east-1.amazonaws.com/';
    const params = {
      method: "POST", 
      headers: {
              'content-type': 'application/x-amz-json-1.1',
              'accept': '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'cache-control': 'max-age=0',
              'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
              'x-amz-user-agent': 'aws-amplify/0.1.x js'
                }, 
      body: JSON.stringify({
        'ClientId': license.CLIENT_ID,
        'AuthFlow': 'REFRESH_TOKEN_AUTH',
        'AuthParameters': {
            'REFRESH_TOKEN': license.REFRESH_TOKEN,
            'DEVICE_KEY': ""
        }})};
    return fetch(url, params).then((response) => response.json())
  }

  GetEmail() {
    const url = 'https://cognito-idp.us-east-1.amazonaws.com/';
    const params = {
      method: "POST", 
      headers: {
              'authority': 'cognito-idp.us-east-1.amazonaws.com',
              'accept': '*/*',
              'accept-language': 'en-CA,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6',
              'cache-control': 'max-age=0',
              'content-type': 'application/x-amz-json-1.1',
              'origin': 'https://timhortons.ca',
              'referer': 'https://timhortons.ca/',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'cross-site',
              'user-agent': license.USER_AGENT,
              'x-amz-target': 'AWSCognitoIdentityProviderService.GetUser',
              'x-amz-user-agent': 'aws-amplify/5.0.4 js',
              'x-requested-with': 'digital.rbi.timhortons'
              }, 
      body: JSON.stringify({
              'AccessToken': this.ACCESS_TOKEN
          })};
    return fetch(url, params).then((response) => response.json())
  }


  GetGamesAndPlayers() {
    const url = 'https://px-api.rbi.digital/hockeyprod/picks';
    const params = {
      method: "GET", 
      headers: {
              'authority': 'px-api.rbi.digital',
              'accept': 'application/json, text/plain, */*',
              'x-cognito-id': license.USER_ID,
              'authorization': 'Bearer ' + this.ID_TOKEN,
              'user-agent': license.USER_AGENT,
              'origin': 'https://timhortons.ca',
              'x-requested-with': 'digital.rbi.timhortons',
              'sec-fetch-site': 'cross-site',
              'sec-fetch-mode': 'cors',
              'sec-fetch-dest': 'empty',
              'referer': 'https://timhortons.ca/',
              'accept-language': 'en-CA,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6',
              'if-none-match': 'W/"70c-oHT3ZjjXihnpscGzW7Bm92wKG4w"'
              }};
    return fetch(url, params).then((response) => response.json())
  }

  GetPickHistory() {
    const url = 'https://px-api.rbi.digital/hockeyprod/picks/history';
    const params = {
      method: "GET", 
      headers: {
              'authority': 'px-api.rbi.digital',
              'accept': 'application/json, text/plain, */*',
              'x-cognito-id': license.USER_ID,
              'authorization': 'Bearer ' + this.ID_TOKEN,
              'user-agent': license.USER_AGENT,
              'origin': 'https://timhortons.ca',
              'x-requested-with': 'digital.rbi.timhortons',
              'sec-fetch-site': 'cross-site',
              'sec-fetch-mode': 'cors',
              'sec-fetch-dest': 'empty',
              'referer': 'https://timhortons.ca/',
              'accept-language': 'en-CA,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6',
              'if-none-match': 'W/"70c-oHT3ZjjXihnpscGzW7Bm92wKG4w"'
              }};
    return fetch(url, params).then((response) => response.json())
  }

  SubmitPicks(picks) {
    [player1_id, player2_id, player3_id] = picks
    const url = 'https://px-api.rbi.digital/hockeyprod/picks';
    const params = {
      method: "POST", 
      headers: {
              'authority': 'px-api.rbi.digital',
              'accept': 'application/json, text/plain, */*',
              'x-cognito-id': license.USER_ID,
              'authorization': 'Bearer ' + this.ID_TOKEN,
              'user-agent': license.USER_AGENT,
              'content-type': 'application/json',
              'origin': 'https://timhortons.ca',
              'x-requested-with': 'digital.rbi.timhortons',
              'sec-fetch-site': 'cross-site',
              'sec-fetch-mode': 'cors',
              'sec-fetch-dest': 'empty',
              'referer': 'https://timhortons.ca/',
              'accept-language': 'en-CA,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6'
              }, 
      body: JSON.stringify({
            'picks': [
                {
                    'setId': '1',
                    'playerId': player1_id
                },
                {
                    'setId': '2',
                    'playerId': player2_id
                },
                {
                    'setId': '3',
                    'playerId': player3_id
                }
            ]
        })};
    return fetch(url, params).then((response) => response.json())

  }
}

module.exports = TimsApi;