$(function () {

  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;


  // var connection = new WebSocket('ws://localhost:5000');

  var connection = new WebSocket('wss://zito-alf.herokuapp.com');

  connection.onopen = function () {
    // connection is opened and ready to use



      const query = [
          {
              input: ['_'],
              output: ' '
          },

          {
              input: ['s_a'],
              output: 's a'
          },
      ];

    // start search
    connection.send(JSON.stringify(query));

  };

  connection.onerror = function (error) {
    // an error occurred when sending/receiving data
  };

  connection.onmessage = function (message) {
    // try to decode json (I assume that each message
    // from server is json)
    //   console.log('Od Servera', message);
    try {
      const json = JSON.parse(message.data);
      console.log(json.func);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
        message.data);
      return;
    }
    // handle incoming message
  };
});