let connection;
let editor;
let resultsCount = 0;
const maxResultsToShow = 30;

$(function() {
  disableStartButton();
  connection = connectToServer();

  $(".js-start-search-btn").on("click", onStartSearchClick);
  $(".js-stop-search-btn").on("click", stopSearch);
  $(".format-query").on("click", handleFormatButtonClick);

  editor = ace.edit("editor");
  editor.setTheme("ace/theme/dawn");
  let JavaScriptMode = ace.require("ace/mode/javascript").Mode;
  editor.session.setMode(new JavaScriptMode());
  editor.renderer.setShowGutter(false);
  editor.on("change", onEditorContentChange);
  document.getElementById("editor").style.fontSize = "14px";
  setDefaultEditorContent();
});

function onStartSearchClick() {
  resultsCount = 0;

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
      type: "start-search",
      query: query
    };
    sendToServer(message);
  }
}

function stopSearch() {
  enableStartButton();
  sendToServer({
    type: "stop-search"
  });
}

function sendToServer(message) {
  connection.send(JSON.stringify(message));
}

function startSpinner() {
  $(".js-start-search-btn").html("Please wait ...");
  disableStartButton();
}

function disableStartButton() {
  $(".js-start-search-btn").attr("disabled", "disabled");
}

function enableStartButton() {
  $(".js-start-search-btn").html("Search");
  $(".js-start-search-btn").removeAttr("disabled");
}

function createQuery() {
  let query = [];

  $(".js-input").each(function(index) {
    const inputValue = formatInput($(this).val());
    const outputValue = $(".js-output-" + (index + 1)).val();

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
  const args = removeSpaces(value).split(";");
  return args.map(function(arg) {
    return str2Expr(arg);
  });
}

function removeSpaces(e) {
  return e.replace(/\s+/g, "");
}

function connectToServer() {
  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;

  let connection = createConnection();

  connection.onopen = function() {
    // connection is opened and ready to use
    enableStartButton();
  };

  connection.onclose = function() {
    connection = createConnection();
    console.log("connection just close, reconnecting");
  };

  connection.onerror = function(error) {
    // an error occurred when sending/receiving data
  };

  connection.onmessage = function(message) {
    const jsonMessage = JSON.parse(message.data);

    if (jsonMessage.type === "result") {
      onResult(jsonMessage.func);
    }

    if (jsonMessage.type === "end") {
      onEnd();
    }
  };

  return connection;
}

function onResult(func) {
  if (resultsCount <= maxResultsToShow) {
    $(".results").append(
      "\n",
      js_beautify(func, { indent_size: 2, space_in_empty_paren: true }),
      "\n"
    );
    Prism.highlightAll();
  } else {
    stopSearch();
  }

  resultsCount = resultsCount + 1;
}

function onEnd() {
  enableStartButton();
  console.log("End reached");
}

function clearResults() {
  $(".results").empty();
}

function str2Expr(str) {
  if (isQuoted(str)) {
    return str.slice(1, -1);
  }

  let re = /^[\+\-]?[0-9\.]+,[ ]*\ ?[\+\-]?[0-9\.]+$/;
  let json;
  str = str.match(re) ? `[${str}]` : str;

  try {
    JSON.parse(str);
    json = str;
  } catch (e) {
    json = str
      .replace(/([\$\w]+)\s*:/g, function(_, $1) {
        return '"' + $1 + '":';
      })
      .replace(/'([^']+)'/g, function(_, $1) {
        return '"' + $1 + '"';
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
  // if (isLocal()) {
  return new WebSocket("ws://" + window.location.hostname + ":5000");
  // } else {
  //     return new WebSocket('wss://212.115.110.118:5000');
  // }
}

function isLocal() {
  return window.location.href.includes("localhost");
}

function getQueryFromEditor() {
  let ret;
  eval(editor.getValue());
  try {
    ret = query;
  } catch (e) {
    alert("Invalid query.");
    location.reload();
  }
  return ret;
}

function handleFormatButtonClick() {
  editor.setValue(beautifyCode(editor.getValue()));
}

function beautifyCode(code) {
  return js_beautify(code, {
    // Collapse curly brackets
    "brace_style": "collapse",

    // Break chained method calls across subsequent lines
    "break_chained_methods": true,

    // End output with newline
    "end_with_newline": true,

    // Evaluate code
    "eval_code": false,

    // Indentation character
    "indent_char": " ",

    // Initial indentation level
    "indent_level": 0,

    // Indentation character size
    "indent_size": 2,

    // Indent with tabs, overrides 'indent_size' and 'indent_char'
    "indent_with_tabs": false,

    // Enable jslint-stricter mode
    "jslint_happy": false,

    // Preserve array indentation
    "keep_array_indentation": false,

    // Preserve function indentation
    "keep_function_indentation": false,

    // Number of line-breaks to be preserved in one chunk
    "max_preserve_newlines": 10,

    // Preserve newlines
    "preserve_newlines": true,

    // Add a space before an anonymous function's parentheses, i.e. function ()
    "space_after_anon_function": true,

    // Add a space before the conditional statement i.e. 'if (true)'
    "space_before_conditional": true,

    // Add padding spaces within empty parentheses i.e. 'f( )'
    "space_in_empty_paren": false,

    // Add padding spaces within parentheses i.e. 'f( a, b )'
    "space_in_paren": false,

    // Decode printable characters encoded in xNN notation
    "unescape_strings": false,

    // Wrap lines at next opportunity after N characters
    "wrap_line_length": 0
});
}

function saveEditorContent() {
  localStorage.setItem("editorContent", editor.getValue());
}

function getSavedEditorContent() {
  return localStorage.getItem("editorContent");
}

function onEditorContentChange() {
  saveEditorContent(editor.getValue());
}

function setDefaultEditorContent() {
  let savedContent = getSavedEditorContent();
  if (savedContent === undefined) {
    editor.setValue(`var query = [
            {
              input: ['foo.txt'],
              output: 'foo'
            },
            {
              input: ['path/name.txt'],
              output: 'name'
            }
          ];`);
  } else {
    editor.setValue(savedContent);
  }
}
