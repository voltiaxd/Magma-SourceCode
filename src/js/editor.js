let totalRecords = 0;
let displayedRecords = 0;
let recordsToRetrieve = 50;
let queryResults;
document.querySelector("#query-results").addEventListener("scroll", async function () {
  const element = document.querySelector("#query-results");
  const scrollPosition = element.clientHeight + element.scrollTop;
  const pageHeight = element.scrollHeight;
  const threshold = 200;

  if (scrollPosition + threshold >= pageHeight && displayedRecords < totalRecords) {
    displayedRecords += recordsToRetrieve;
    document.querySelector("#showedRecordsText").textContent = `Showed records: ${displayedRecords}`;
    updateTable(displayedRecords - recordsToRetrieve, displayedRecords);
  }
});

function updateTable(start, end) {

  const tbody = document.querySelector("#query-results table tbody");
  const keys = Object.keys(queryResults[0]);

  end = end > totalRecords ? totalRecords : end;

  for (let i = start; i < end; i++) {
    let row = queryResults[i];
    const tr = document.createElement("tr");
    for (const key of keys) {
      const td = document.createElement("td");
      td.textContent = row[key];
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

async function executeQuery(query) {

  let resp = await eAPI.executeQuery(query);

  await loading();

  if (resp.state === "error") {
    document.querySelector("#query-results").innerHTML = `<div style="margin:10px">${resp.message}</div>`;
    return;
  }

  queryResults = resp.result;

  if (!Array.isArray(queryResults)) {
    document.querySelector("#query-results").innerHTML = `<div style="margin:10px">Query done:<br>Rows affected: ${queryResults.affectedRows}<br>Changed rows: ${queryResults.changedRows}<br>Insert ID: ${queryResults.insertId}<br>Message: ${queryResults.message}<br>Protocol 41: ${queryResults.protocol41}<br>Server status: ${queryResults.serverStatus}<br>Warning count: ${queryResults.warningCount}</div>`;
    console.log(queryResults);
    return;
  } else if (queryResults.length === 0) { 
    document.querySelector("#query-results").innerHTML = `<div style="margin:10px">No results</div>`;
    return;
  }
  
  totalRecords = queryResults.length;
  displayedRecords += recordsToRetrieve;

  document.querySelector("#query-results").innerHTML = `<div style="position: absolute;
  margin-top: -25px;
  width: calc(100% - var(--w-min-query-options));
  display: flex;
  justify-content: space-between;
  padding: 0 20px;"><span id='showedRecordsText'>Showed records: ${displayedRecords}</span><span>Total records: ${queryResults.length}</span></div> <table><thead></thead><tbody></tbody></table>`;

  const table = document.querySelector("#query-results table");  
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
 
  while (thead.firstChild) {
    thead.removeChild(thead.firstChild);
  }

  const keys = Object.keys(queryResults[0]);
  for (const key of keys) {
    const th = document.createElement("th");
    th.textContent = key;
    thead.appendChild(th);
  }

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  
  updateTable(0, recordsToRetrieve); 

}

const randomId = Math.random().toString(36).substring(7);
const randomIdDiv = document.querySelector('#random-id');
randomIdDiv.id = randomId;
randomIdDiv.style.height = '100%';
randomIdDiv.style.width = 'calc(100% - var(--w-min-query-options))';

var editor = null;

function initializeEditor(initialContent) {
  if (editor !== null) {
    editor.dispose();
  }

  require(['vs/editor/editor.main'], () => {

    monaco.editor.defineTheme('default', {
      base: 'vs-dark',
      inherit: true,
      rules: [
          {
              token: "identifier",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-secondary')
          },
          {
              token: "keyword",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-primary')
          },
          {
              token: "string",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-tertiary')
          },
          {
              token: "number",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-variant1')
          },
          {
              token: "comment",
              fontStyle: "italic",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-variant2')
          },
          {
              token: "operator.sql",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-text')
          },
          {
              token: "string.quote",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-text')
          },
          {
              token: "predefined.sql",
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--c-primary')
          }
      ],
      "colors": {
        "editor.foreground": getComputedStyle(document.documentElement).getPropertyValue('--c-bar'),
        "editor.background": getComputedStyle(document.documentElement).getPropertyValue('--c-bg'),
        "editor.selectionBackground": "#44475a",
        "editor.lineHighlightBackground": "#00000061",
      }
    });
    monaco.editor.setTheme('default');

    editor = monaco.editor.create(randomIdDiv, {
      value: initialContent,
      language: 'mysql',
      fontSize: 15,
      minimap: {
        enabled: false,
      },
      scrollbar: {
        horizontal: false,
        vertical: false,
      },
      mouseWheelZoom: true,
      automaticLayout: true,
      preserveCursor: true,
    });

    function createDependencyProposals(range) {

      return [
        {
          documentation: 'select',
          insertText: 'select',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'select',
          range: range
        },
        {
          documentation: 'select *',
          insertText: 'select *',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'select *',
          range: range
        },
        {
          documentation: 'from',
          insertText: 'from',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'from',
          range: range
        },
        {
          documentation: 'where',
          insertText: 'where',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'where',
          range: range
        },
        {
          documentation: 'values',
          insertText: 'values',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'values',
          range: range
        },
        {
          documentation: 'group by',
          insertText: 'group by',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'group by',
          range: range
        },
        {
          documentation: 'order by',
          insertText: 'order by',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'order by',
          range: range
        },
        {
          documentation: 'inner join',
          insertText: 'inner join',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'inner join',
          range: range
        },
        {
          documentation: 'left join',
          insertText: 'left join',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'left join',
          range: range
        },
        {
          documentation: 'right join',
          insertText: 'right join',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'right join',
          range: range
        },
        {
          documentation: 'full outer join',
          insertText: 'full outer join',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'full outer join',
          range: range
        },
        {
          documentation: 'natural join',
          insertText: 'natural join',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'natural join',
          range: range
        },
        {
          documentation: 'create table',
          insertText: 'create table',
          kind: monaco.languages.CompletionItemKind.Keyword,
          label: 'create table',
          range: range
        },

      ]
    }
  
    monaco.languages.registerCompletionItemProvider('mysql', {
        provideCompletionItems: function (model, position) {

          var word = model.getWordUntilPosition(position);
          var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          
          return {
            suggestions: createDependencyProposals(range),
          };
        }
    });
  
    editor.getModel().onDidChangeContent((e) => {
      if (!isUpdatingCode && currentRoom !== null) {
        socket.emit('code-update', {
          roomId: currentRoom,
          code: editor.getValue(),
          senderId: socket.id,
        });
      }

    });

    editor.onDidChangeCursorPosition((e) => {
      if(currentRoom !== null) {
        socket.emit('fake-cursor', {
          roomId: currentRoom,
          senderId: socket.id,
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column,
          },
          color: userColor,
        });
      }
    });
    
  });
  
}

initializeEditor('select * from table_name');