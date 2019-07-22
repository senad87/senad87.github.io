let connection;
let editor;

$(function () {
    disableStartButton();
    connection = connectToServer();

    $('.js-start-search-btn').on('click', onStartSearchClick);
    $('.js-stop-search-btn').on('click', stopSearch);

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/dawn");
    let JavaScriptMode = ace.require("ace/mode/javascript").Mode;
    editor.session.setMode(new JavaScriptMode());
    editor.renderer.setShowGutter(false);
});


function onStartSearchClick() {
    startSpinner();
    clearResults();
    console.log(editor.getValue());
    if (!connection) {
        connection = connectToServer();
    }

    // let query = createQuery();
    let query = getQueryFromEditor();

    // start search
    if (query.length > 0) {
        const message = {
            type: 'start-search',
            query: query
        };
        sendToServer(message);

    }
}

function stopSearch() {
    enableStartButton();
    sendToServer({
        type: 'stop-search'
    });
}


function sendToServer(message) {
    connection.send(JSON.stringify((message)));
}

function startSpinner() {
    $('.js-start-search-btn').html('Please wait ...');
    disableStartButton();
}

function disableStartButton() {
    $('.js-start-search-btn').attr('disabled', 'disabled');
}

function enableStartButton() {
    $('.js-start-search-btn').html('Search');
    $('.js-start-search-btn').removeAttr('disabled');
}


function createQuery() {
    let query = [];

    $('.js-input').each(function (index) {
        const inputValue = formatInput($(this).val());
        const outputValue = $('.js-output-' + (index + 1)).val();

        if (inputValue && outputValue) {
            query.push({
                input: inputValue,
                output: str2Expr(outputValue)
            });
        }

    });
    console.log(query);
    return query;
}

function formatInput(value) {
    const args = removeSpaces(value).split(';');
    return args.map(function (arg) {
        return str2Expr(arg);
    });
}

function removeSpaces(e) {
    return e.replace(/\s+/g, "");
}

function connectToServer() {

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    const connection = createConnection();

    connection.onopen = function () {
        // connection is opened and ready to use
        enableStartButton();
    };

    connection.onclose = function () {
        console.log('connection just close!');
    };

    connection.onerror = function (error) {
        // an error occurred when sending/receiving data
    };

    connection.onmessage = function (message) {
        const jsonMessage = JSON.parse(message.data);

        if (jsonMessage.type === 'result') {
            onResult(jsonMessage.func)
        }

        if (jsonMessage.type === 'end') {
            onEnd();
        }
    };

    return connection;
}

function onResult(func) {

    $('.results').append('\n', js_beautify(func, {indent_size: 2, space_in_empty_paren: true}), '\n');
    Prism.highlightAll();
}

function onEnd() {
    enableStartButton();
    console.log('End reached');
}


function clearResults() {
    $('.results').empty();
}


function str2Expr(str) {
    if (isQuoted(str)) {
        return str.slice(1, -1);
    }

    let re = /^[\+\-]?[0-9\.]+,[ ]*\ ?[\+\-]?[0-9\.]+$/;
    let json;
    str = (str.match(re) ? `[${str}]` : str);

    try {
        JSON.parse(str);
        json = str;
    } catch (e) {
        json = str.replace(/([\$\w]+)\s*:/g, function (_, $1) {
            return "\"" + $1 + "\":";
        }).replace(/'([^']+)'/g, function (_, $1) {
            return "\"" + $1 + "\"";
        });
    }

    try {
        return JSON.parse(json);
    } catch (e) {
        return json;
    }
}

function isQuoted(arg) {
    const first = arg[0];
    const last = arg[arg.length - 1];
    return isQuote(first) && isQuote(last);
}

function isQuote(str) {
    return str === '"' || str === "'";
}

function createConnection() {
    if (isLocal()) {
        return new WebSocket('ws://localhost:5000');
    } else {
        return new WebSocket('wss://zito-alf.herokuapp.com');
    }
}


function isLocal() {
    return window.location.href.includes('localhost');
}

function getQueryFromEditor() {
    eval(editor.getValue());
    return query;
}



