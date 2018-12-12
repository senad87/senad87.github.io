$(function () {

  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;

  // var connection = new WebSocket('ws://127.0.0.1:1337');
  // var connection = new WebSocket('ws://localhost:5000');
  var connection = new WebSocket('wss://zito-alf.herokuapp.com');

  connection.onopen = function () {
    // connection is opened and ready to use

    // start search
    connection.send('upaljen');

  };

  connection.onerror = function (error) {
    // an error occurred when sending/receiving data
  };

  connection.onmessage = function (message) {
    // try to decode json (I assume that each message
    // from server is json)
    try {
      var json = JSON.parse(message.data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
        message.data);
      return;
    }
    // handle incoming message
  };
});