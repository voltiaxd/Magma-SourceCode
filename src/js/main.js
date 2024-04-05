var width = document.querySelector(".content").clientWidth;
var height = document.querySelector(".content").clientHeight;

var centerForceInput = document.getElementById("center-force");
var repelForceInput = document.getElementById("repel-force");
var linkForceInput = document.getElementById("link-force");
var linkDistanceInput = document.getElementById("link-distance");

function openSettings() {
  document.querySelector("#settings-modal").classList.add("modal-active");

  let mysql_bin_path = localStorage.getItem("mysql_bin_path");
  let run_mysql_at_startup = localStorage.getItem("run_mysql_at_startup");

  if(run_mysql_at_startup) {
    run_mysql_at_startup = JSON.parse(run_mysql_at_startup).startup;
  }

  if(mysql_bin_path) {
    mysql_bin_path = JSON.parse(mysql_bin_path).path;
  }

  document.querySelector("#settings-config input[name='mysql_bin_path']").value = mysql_bin_path;
  document.querySelector("#settings-config input[name='run_mysql_at_startup']").checked = run_mysql_at_startup;

  document.querySelector("#settings-config input[name='run_mysql_at_startup']").dispatchEvent(new Event('change'));
}

function closeSettings() {
  document.querySelector("#settings-modal").classList.remove("modal-active");
}

function openThemes() {
  loadThemesList(document.querySelector("#themes-list"));
  
  document.querySelector("#themes-modal").classList.add("modal-active");
}

function closeThemes() {
  document.querySelector("#themes-modal").classList.remove("modal-active");
}

function openModal() {
  document.querySelector("#create-connection-modal").classList.add("modal-active");
}

function closeModal() {
  document.querySelector("#create-connection-modal").classList.remove("modal-active");
}

function openModalMock(args) {
  loadCustomCheckbox();

  document.querySelector("#generate-mock-modal").classList.add("modal-active");

  document.querySelector("#generate-mock-modal .modal-body #mock-data-generator").innerHTML = `
    <b id="column-name">${args.label}</b>
    <div class="mock-inputs-wrapper">
      <input type="text" name="count" placeholder="Records number (default: 10)">
      <div style="display:flex;flex-direction:column;gap:10px">
        ${args.columns.map(c => `
          <div style="display:flex;gap:10px">
            <input type="checkbox" name="column" id="${c.label}" data-type="${c.type}" ${c.length !== undefined ? "data-length='"+c.length+"'" : ""} checked>
            <label for="${c.label}" class="custom-checkbox checked">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
            </label>
            <label for="${c.label}">${c.label} - ${c.type}${c.length !== undefined ? "("+c.length+")" : ""}</label>
          </div>`).join("")}
      </div>
    </div>
    <button name="button" type="submit"><span>Generate</span><div class="loader hidden"></div></button>
  `;

  loadCustomCheckbox();
}

function closeModalMock() {
  document.querySelector("#generate-mock-modal").classList.remove("modal-active");
}

function alert(message) {
  document.querySelector("#alert").classList.remove("hidden");
  document.querySelector("#alert").classList.remove("alert-deactive");
  document.querySelector("#alert").classList.add("alert-active");
  document.querySelector("#alert .message").innerHTML = message;

  setTimeout(() => {
    document.querySelector("#alert").classList.remove("alert-active");
    document.querySelector("#alert").classList.add("alert-deactive");
  }, 2500);

}

function importTheme() {
  navigator.clipboard.readText().then(text => {
    try{
      let themes = JSON.parse(text);
      localStorage.setItem("themes_backup", localStorage.getItem("themes"));
      localStorage.setItem("themes", JSON.stringify(themes));

      eAPI.alert("info", "New themes saved, the older are saved in a backup!");

      loadThemesList(document.querySelector("#themes-list"));
    } catch {
      return eAPI.alert("error", "Invalid theme");
    }
  })
  .catch(err => {
    return eAPI.alert("error", 'Failed to read clipboard contents: ', err);
  });
}

function exportTheme() {
  navigator.clipboard.writeText(localStorage.getItem("themes"));
  eAPI.alert("info", "Themes copied to clipboard, paste it somewhere to save it!");
}

function saveQuery() {
  let query = editor.getValue();

  if (!query) return eAPI.alert("error", "Query is empty");

  let queries = JSON.parse(localStorage.getItem("queries")) || [];

  queries.push({ query: query, date: new Date().toLocaleString() });

  localStorage.setItem("queries", JSON.stringify(queries));

  loadQueriesList(document.querySelector("#items-queries"));
}

function deleteQuery(id) {
  let query = editor.getValue();

  if (!query) return eAPI.alert("error", "Query is empty");

  let queries = JSON.parse(localStorage.getItem("queries")) || [];

  queries.splice(id, 1);

  localStorage.setItem("queries", JSON.stringify(queries));

  loadQueriesList(document.querySelector("#items-queries"));

}

function loadQueriesList(element) {

  let queries = JSON.parse(localStorage.getItem("queries")) || [];
  
  if(queries.length > 0) {
    element.innerHTML = ``;
    document.querySelector("#empty-queries-list").classList.add("hidden");
    element.classList.remove("hidden");

    queries.forEach((query, i) => {
      element.innerHTML += `<div class="query-item">${query.query.split("\n")[0]}</div>`;
    });

  } else {
    element.innerHTML = ``;
    document.querySelector("#empty-queries-list").classList.remove("hidden");
    element.classList.add("hidden");

  }

}

async function waitForConnections(maxAttempts = 10, delay = 1000) {
  let attempts = 0;

  async function checkConnections() {
      if (eAPI.getConnections().length > 0) {
          return;
      } else {
          attempts++;
          if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delay));
              await checkConnections();
          } else {
              throw new Error('Max attempts reached. Unable to get connections.');
          }
      }
  }

  await checkConnections();
}

function loadConnections() {
  document.querySelector("#items").innerHTML = "";
  eAPI.getConnections().forEach((con, i) => {
    addConnectionElement(con);  
  });
}

function addConnectionElement(conn){
  document.querySelector("#items").innerHTML += `
  <div class="item" id="${conn.id}">
      <div class="header" onclick="openDB(event)" title="${conn.database != conn.name ? conn.database : ""}">
          <div class="left">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              ${conn.name} (${conn.data.nodes.length})
          </div>
          <div class="right">
              <button class="single" id="activateDB" onclick="activateDB(event)" title="Set this database as ACTIVE">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                  </svg>
              </button>
              <button class="single" id="closeDB" onclick="closeDB(event)" title="Close and remove this database connection">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
              </button>
          </div>
      </div>
  </div>`;
  
  document.querySelector("#no-connection-found").classList.add("hidden");
}

function generateMockData(type, size) {
  switch (type) {
    case "int":
      return Array(Math.min(Math.floor(Math.random() * size) + 1, size)).fill().map(() => Math.floor((Math.random() * 10)+1)).join("");       
    case "varchar":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "text":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "date":
      return new Date().toISOString().slice(0, 10);
    case "datetime":
      return new Date().toISOString().slice(0, 19).replace("T", " ");
    case "timestamp":
      return new Date().toISOString().slice(0, 19).replace("T", " ");
    case "time":
      return new Date().toISOString().slice(11, 19);
    case "year":
      return new Date().toISOString().slice(0, 4);
    case "char":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "tinyint":
      return Math.floor(Math.random() * 10);
    case "smallint":
      return Math.floor(Math.random() * 100);
    case "mediumint":
      return Math.floor(Math.random() * 1000);
    case "bigint":
      return Math.floor(Math.random() * 10000);
    case "float":
      return Math.random() * 100;
    case "double":
      return Math.random() * 1000;
    case "decimal":
      return Math.random() * 10000;
    case "bit":
      return Math.floor(Math.random() * 2);
    case "binary":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "varbinary":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "blob":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "mediumblob":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "longblob":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "tinyblob":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "enum":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    case "set":
      return generateRandomString(Math.min(Math.floor(Math.random() * size) + 1, size));
    default:
      return null;
  }
}

function generateRandomString(length) {
  const characters = "ABCDEF   GHIJKLM NOPQR    STUVWXY     Zabcdef ghijklmn     opqrs tuvwxyz  0123  456 789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

document.querySelector("#mock-data-generator").addEventListener("submit", async (event) => {
  event.preventDefault();

  let target = event.target;

  target.querySelector(".loader").classList.remove("hidden");
  target.querySelector(".loader").parentElement.querySelector('span').classList.add("hidden");

  let count = target.count.value || 10;

  let resp = eAPI.getActiveDBData();

  if(!resp) {
    closeModalMock();
    alert("No active database selected");
    return;
  }

  const names = [];

  target.column.forEach(c => {
    if(c.checked) {
      names.push(c.id);
    }
  });

  let query = `INSERT INTO \`${resp.database}\`.\`${target.querySelector("#column-name").innerText}\` (${names.join(", ")}) VALUES `;

  for(let i=0; i<parseInt(count); i++) {
    let data = [];
    target.column.forEach(async c => {
      if(c.checked){
        let type = c.dataset.type;
        let size = c.dataset.length || 255;
        let mock = generateMockData(type, size);

        data.push({name: c.id, mock: mock, type: type});
  
        console.log(c.id, type, size, mock);
      }

    });    

    query += `(${data.map(d => { return (
      d.type == "varchar" || 
      d.type == "char" ||
      d.type == "text" ||
      d.type == "date" ||
      d.type == "datetime" ||
      d.type == "timestamp" ||
      d.type == "time" ||
      d.type == "year" ||
      d.type == "binary" ||
      d.type == "varbinary" ||
      d.type == "blob" ||
      d.type == "mediumblob" ||
      d.type == "longblob" ||
      d.type == "tinyblob" ||
      d.type == "enum"
      ? `'${d.mock}'` : d.mock) }).join(", ")})${i == parseInt(count)-1 ? ";" : ","}\n`;
  }

  console.log(query);

  editor.setValue(query);

  executeQuery(query);

  setPage(document.querySelector('#editor-view'))
  alert("Query edited in editor");

  target.querySelector(".loader").classList.add("hidden");
  target.querySelector(".loader").parentElement.querySelector('span').classList.remove("hidden");

  closeModalMock();

});

const loadCustomCheckbox = () => {
  document.querySelectorAll("input[type='checkbox']").forEach((i) => {
      i.addEventListener("change", async (event) => {

      console.log("change");

      let target = event.target;
    
      let status = target.checked;
    
      let label = document.querySelector(`label[for="${target.id}"].custom-checkbox`);
      if (status) {
        label.classList.add("checked");
      } else {
        label.classList.remove("checked");
      }
    });
  });
}

loadCustomCheckbox();

document.querySelector("#settings-config").addEventListener("submit", async (event) => {
  event.preventDefault();

  let target = event.target;

  localStorage.setItem("mysql_bin_path", JSON.stringify({ path: target.mysql_bin_path.value || "C:\\xampp\\mysql\\bin\\mysqld.exe" }));
  localStorage.setItem("run_mysql_at_startup", JSON.stringify({ startup: target.run_mysql_at_startup.checked }));

});

document.querySelector("#create-connection").addEventListener("submit", async (event) => {
  event.preventDefault();

  let ip = event.target.ip.value || "localhost";
  let port = event.target.port.value || 3306;
  let user = event.target.username.value || "root";
  let password = event.target.password.value || null;
  let database = event.target.database.value;
  let custromName = event.target.customName.value || database;

  event.target.button.disabled = true;
  event.target.button.querySelector("span").classList.add("hidden");
  event.target.button.querySelector(".loader").classList.remove("hidden");

  let con = await window.eAPI.addConnection(
    custromName,
    ip,
    port,
    user,
    password,
    database
  );

  event.target[6].disabled = false;
  event.target.button.querySelector("span").classList.remove("hidden");
  event.target.button.querySelector(".loader").classList.add("hidden");

  if (con.status == "error") return eAPI.alert("error", con.message);

  addConnectionElement(con.data);

  closeModal();

});

document.querySelector("#themes-config").addEventListener("submit", async (event) => {
  event.preventDefault();

  let theme = { active: false, primary: event.target.primary.value, secondary: event.target.secondary.value, text: event.target.text.value, alertc: event.target.alertc.value, bg: event.target.bg.value, bar: event.target.bar.value, button: event.target.button.value, button_modal_hover: event.target.button_modal_hover.value, titlebar_buttons: event.target.titlebar_buttons.value, hover: event.target.hover.value };

  saveTheme(theme);
  loadThemesList(document.querySelector("#themes-list"));
  document.querySelector("div[data-tab-target='#themes-list']").click();
});

document.querySelector("#themes-config-edit").addEventListener("submit", async (event) => {
  event.preventDefault();

  let theme = { active: getActiveThemeIndex() == event.target.indexEdited.value, primary: event.target.primary.value, secondary: event.target.secondary.value, text: event.target.text.value, alertc: event.target.alertc.value, bg: event.target.bg.value, bar: event.target.bar.value, button: event.target.button.value, button_modal_hover: event.target.button_modal_hover.value, titlebar_buttons: event.target.titlebar_buttons.value, hover: event.target.hover.value };

  updateTheme(theme, event.target.indexEdited.value);
  loadThemesList(document.querySelector("#themes-list"));
  applyTheme();

});

function deleteTheme(i) {
  removeThemeByIndex(i);
  loadThemesList(document.querySelector("#themes-list"));
}

function editTheme(i) {

  tabEvent(null, document.querySelector("#themes-config-edit"));
  document.querySelector("#themes-config-edit").indexEdited.value = i;

  loadThemesConfig(document.querySelector("#themes-config-edit"), getAllThemes()[i]);
}

function loadThemesConfig(element, theme) {

  // var colorInputs = [];

  element.querySelector(".configs-container").innerHTML = "";

  for(let i=0; i<Object.keys(theme).length; i++) {
    let key = Object.keys(theme)[i];
    if (key == "active") continue;

    element.querySelector(".configs-container").innerHTML += `
    <div>
      <label for="c-input-${key}">${(key.charAt(0).toUpperCase() + key.slice(1)).replaceAll("-", " ").replaceAll("_", " ")} color:</label>
      <div class="color-input">
        <input type="color" id="c-input-${key}" name="${key}" value="${theme[key]}">
      </div>
    </div>
    `;
  }

  //   colorInputs.push(Pickr.create({
  //     el: document.getElementById(`c-input-${i}`),
  //     theme: 'nano',
  //     default: theme[key],

  //     swatches: [
  //         'rgba(244, 67, 54, 1)',
  //         'rgba(233, 30, 99, 0.95)',
  //         'rgba(156, 39, 176, 0.9)',
  //         'rgba(103, 58, 183, 0.85)',
  //         'rgba(63, 81, 181, 0.8)',
  //         'rgba(33, 150, 243, 0.75)',
  //         'rgba(3, 169, 244, 0.7)',
  //         'rgba(0, 188, 212, 0.7)',
  //         'rgba(0, 150, 136, 0.75)',
  //         'rgba(76, 175, 80, 0.8)',
  //         'rgba(139, 195, 74, 0.85)',
  //         'rgba(205, 220, 57, 0.9)',
  //         'rgba(255, 235, 59, 0.95)',
  //         'rgba(255, 193, 7, 1)'
  //     ],

  //     components: {
  //       preview: true,
  //       opacity: true,
  //       hue: true,

  //       interaction: {
  //           hex: true,
  //           rgba: true,
  //           hsla: true,
  //           input: true,
  //           clear: true,
  //           save: true
  //       }
  //     }
  //   }));

  // }

  // colorInputs[0].on('change', (color, source, instance) => {
  //   console.log('Event: "change"', color, source, instance);
  // });

//   <div>
//   <label for="primary">Primary color:</label>
//   <div class="color-input">
//     <input type="color" id="primary" name="primary" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="secondary">Secondary color:</label>
//   <div class="color-input">
//     <input type="color" id="secondary" name="secondary" value="#ff0000">
//   </div>  
// </div>

// <div>
//   <label for="text">Text color:</label>
//   <div class="color-input">
//     <input class="color-picker" type="color" id="text" name="text" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="alertc">Alert color:</label>
//   <div class="color-input">
//     <input type="color" id="alertc" name="alertc" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="bg">Background color:</label>
//   <div class="color-input">
//     <input type="color" id="bg" name="bg" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="bar">Bar color:</label>
//   <div class="color-input">
//     <input type="color" id="bar" name="bar" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="button">Button color:</label>
//   <div class="color-input">
//     <input type="color" id="button" name="button" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="button-modal">Hover modal button color:</label>
//   <div class="color-input">
//     <input type="color" id="button-modal" name="button_modal_hover" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="titlebar_buttons">Titlebar buttons color:</label>
//   <div class="color-input">
//     <input type="color" id="titlebar_buttons" name="titlebar_buttons" value="#ff0000">
//   </div>
// </div>

// <div>
//   <label for="hover">Hover color:</label>
//   <div class="color-input">
//     <input type="color" id="hover" name="hover" value="#ff0000">
//   </div>
// </div>

}

function loadThemesList(element) {

  element.innerHTML = "";

  let themes = getAllThemes();

  themes.forEach((theme, i) => {
    element.innerHTML += `
    <div class="mini-card" style="background: linear-gradient(${theme.primary}, ${theme.secondary})">
      <div class="themesoptions" ${i == 0 ? `style="flex-direction: column;"` : ``}>
        ${i != 0 ? 
           `<button onclick="deleteTheme(${i})">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <button onclick="editTheme(${i})">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </button>` 
          : 
          `<span style="color: white !important">Default Theme</span>`
        }
        <button onclick="setActiveTheme(${i})">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
    </div>
    `;
  });
}

var tmpTarget = null;

function openDB(event) {
  let target = event.target;

  if (tmpTarget || target.tagName === "BUTTON") return;

  while (target && !target.classList.contains("item")) {
    target = target.parentElement;
    if (target.tagName === "BUTTON") return;
  }

  if (!target) return;

  if (target.querySelector("svg").style.transform == "rotate(90deg)") {
    target.querySelector("svg").style.transform = "rotate(0deg)";

    const treeElement = target.querySelector(".tree");

    if (treeElement) {
      treeElement.classList.add("contract");
      tmpTarget = target;
      treeElement.addEventListener("animationend", function () {
        treeElement.remove();
        tmpTarget = null;
        target.removeEventListener("animationend", this);
      });
    }
  } else {

    const conn = eAPI.getConnections()[target.id];

    target.querySelector("svg").style.transform = "rotate(90deg)";

    let tables = "";

    conn.data.nodes.forEach((t) => {
      tables +=
          `<div class="item" id='${conn.id} ${t.label}'>
            <div class="header" onclick="openTable(event, '${t.label}', '${conn.id}')">
              <div class="left">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path>
                </svg>
                ${t.label} (${t.columns.length})
              </div>
              <div class="right">
                <button class="single" id="fastView" onclick="fastView(event)" title="See the table records quickly">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
                  </svg>
                </button>
                <button class="single" id="generateMock" onclick="genMock(event)" title="Generate mock data for the table">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </button>
              </div>  
            </div>
          </div>`
    });

    target.innerHTML += `<div class="tree">${tables}</div>`;
  }
}

function fastView(event) {
  let target = event.target;
  let parent = target;

  while (target && target.id != "fastView") {
    target = target.parentElement;
  }

  while (parent && !parent.classList.contains("item")) {
    parent = parent.parentElement;
  }

  if (!target || !parent) return;

  let connectionId = parent.id.split(" ")[0];
  let tableName = parent.id.split(" ")[1];

  let resp = eAPI.getConnections().filter(c => c.id == connectionId)[0];

  if(!resp) return eAPI.alert("error", "Error: Connection not found");

  editor.setValue(`select * from \`${resp.database}\`.\`${tableName}\`;`);

  executeQuery(editor.getValue());
  setPage(document.querySelector('#editor-view'))
  alert("Query edited in editor");
}
  
var tmpTargetTable = null;

async function openTable(event, tableName, id) {
  let target = event.target;

  if (tmpTargetTable || target.tagName === "BUTTON") return;

  while (target && !target.classList.contains("item")) {
    target = target.parentElement;
    if (target.tagName === "BUTTON") return;
  }

  if (!target) return;

  if (target.querySelector("svg").style.transform == "rotate(90deg)") {
    target.querySelector("svg").style.transform = "rotate(0deg)";

    const treeElement = target.querySelector(".tree");

    if (treeElement) {
      treeElement.classList.add("contract");
      tmpTargetTable = target;
      treeElement.addEventListener("animationend", function () {
        treeElement.remove();
        tmpTargetTable = null;
        target.removeEventListener("animationend", this);
      });
    }
  } else {

    let resp = eAPI.getConnections()[id];

    if(!resp) return eAPI.alert("error", "Error: Connection not found");

    let columns = resp.data.nodes.filter(c => c.label == tableName)[0].columns;

    target.querySelector("svg").style.transform = "rotate(90deg)";

    let columnsData = ""; 

    columns.forEach((c) => {
      columnsData +=
      `<div class="item">
        <div class="header">
          <div class="left">
            ${c.label}
          </div>
          <div class="right">
          </div>
        </div>
      </div>`
    });

    target.innerHTML += `<div class="tree">
      ${columnsData}</div>`;
  }
}

async function activateDB(event) {
  let target = event.target;
  let parent = target;

  while (target && target.id != "activateDB") {
    target = target.parentElement;
  }

  while (parent && !parent.classList.contains("item")) {
    parent = parent.parentElement;
  }

  if (!target || !parent) return;

  let activated = await eAPI.activateDB(parent.id);

  if (!activated) return;

  reset();

  await updatePage();

  setPage(document.querySelector("#graph-view"));
}

function genMock(event) {
  let target = event.target;
  let parent = target;

  while (target && target.id != "generateMock") {
    target = target.parentElement;
  }

  while (parent && !parent.classList.contains("item")) {
    parent = parent.parentElement;
  }

  if (!target || !parent) return;

  let connectionId = parent.id.split(" ")[0];
  let tableName = parent.id.split(" ")[1];

  let resp = eAPI.getConnections().filter(c => c.id == connectionId)[0];

  if(!resp) return eAPI.alert("error", "Error: Connection not found");

  const data = resp.data.nodes.filter(c => c.label == tableName)[0];

  openModalMock(data);
}

async function closeDB(event) {
  if (!eAPI.getConnections().length) return;

  let target = event.target;
  let parent = target;

  while (target && target.id != "closeDB") {
    target = target.parentElement;
  }

  while (parent && !parent.classList.contains("item")) {
    parent = parent.parentElement;
  }

  let activeDB = eAPI.getActiveDBData();

  if (!target || !parent) return;

  let erase = await eAPI.closeConnection(parent.id);

  if (!erase) return;

  if (!activeDB || activeDB.id == parent.id) {
    reset();
  }

  parent.remove();

  eAPI.getConnections().length == 0 ? document.querySelector("#no-connection-found").classList.remove("hidden") : document.querySelector("#no-connection-found").classList.add("hidden");

  updateIDs();

}

function centerForceInputHandler() {
  const value = parseFloat(centerForceInput.value);
  simulation
    .force("x", d3.forceX().strength(value))
    .force("y", d3.forceY().strength(value));

  simulation.alpha(0.05).restart();
}

function repelForceInputHandler() {
  const value = parseFloat(repelForceInput.value);
  simulation.force("charge", d3.forceManyBody().strength(-value));

  simulation.alpha(0.05).restart();
}

function linkForceInputHandler() {
  const value = parseFloat(linkForceInput.value);
  simulation.force("link", d3.forceLink(data.links).id((d) => d.id).strength(value));

  simulation.alpha(0.05).restart();
}

function linkDistanceInputHandler() {
  const value = parseInt(linkDistanceInput.value);
  simulation.force(
    "link",
    d3
      .forceLink(data.links)
      .id((d) => d.id)
      .distance(value)
  );

  simulation.alpha(0.05).restart();
}

function creatingChildren(event, d) {

  if(event.shiftKey) {

    let resp = eAPI.getActiveDBData();

    editor.setValue(`select * from \`${resp.database}\`.\`${d.label}\`;`);

    executeQuery(editor.getValue());
    setPage(document.querySelector('#editor-view'))
    alert("Query edited in editor");

  }else{

    const x = d3.scaleLinear([0, 1], [0, 100]);
    const y = d3.scaleLinear([0, 1], [0, 100]);

    let currentNode = d3.select(event.currentTarget);

    let radius;

    let classP = "parent-" + currentNode._groups[0][0].__data__.index;

    if(currentNode.attr("r") == 18) { // open

      
      let columnLinks = [];
      columnLinks.push(...d.columns.map(c => {return {source: d.id, target: c.id, child: true}}));

      radius = 30;
      
      currentNode
        .transition() 
        .duration(500)
        .attr("r", radius); 
      
      
      data.nodes.push(...d.columns);

      simulation
        .nodes(data.nodes)
        .force("link-column "+classP, d3.forceLink(columnLinks).id(d => d.id).distance(0.5 * columnLinks.length - 1).strength(0.3));

      setTimeout(() => {
        // simulation.stop();
       
                      
        linkChildren.push(g.selectAll(".link-column ." + classP)
          .data(columnLinks)
          .enter()
          .append("line")
            .attr("class", "link-column " + classP)
            .attr("opacity", 0));

        setTimeout(() => {
          linkChildren[linkChildren.length - 1]
            .transition()
            .duration(100)
            .attr("opacity", 1);
        }, 300);
                       


        column.push(
                g.selectAll(".node-column ." + classP)
                .data(d.columns)
                .enter()
                .append("circle")
                  .attr("class", "node-column " + classP)
                  .attr("cx", d => x(d[0]))
                  .attr("cy", d => y(d[1]))
                  .attr("x", currentNode.attr("cx"))
                  .attr("y", currentNode.attr("cy"))
                  .attr("r", 0)
                  .call(drag(simulation)));

      
        currentNode.attr("id", column.length - 1);

        simulation.alpha(0.2).restart();

        column[column.length - 1]
          .transition()
          .duration(300)
          .attr("r", 10);


        nodeLabelsChildren.push(g
          .selectAll(".node-column-label ." + classP)
          .data(d.columns)
          .enter()
          .append("text")
            .attr("class", "node-column-label " + classP)
            .text(d => d.label));

        let oldnode = currentNode._groups[0][0];

        currentNode.remove();

        g.append(() => oldnode);

      }, 300);

    } else if(currentNode.attr("r") == 30) {
      radius = 18;
      
      currentNode
        .transition()
        .duration(400)
        .attr("r", radius);

      console.log(data.nodes);
      data.nodes = data.nodes.filter(n => n.parent != currentNode.attr("id"));

   
      column[[currentNode.attr("id")]]
        .transition()
        .duration(300)
        .attr("r", 0)
        .remove();
  

      linkChildren[currentNode.attr("id")].remove();
      nodeLabelsChildren[currentNode.attr("id")].remove();
      column[currentNode.attr("id")].remove();

      simulation.nodes(data.nodes);
    }

    // //remove all nodeLabels and nodeLabelsChildren and recreate them
    // let oldNodeLabels = nodeLabels._groups[0];
    // let oldNodeLabelsChildren = nodeLabelsChildren._groups[0];

    // nodeLabels.remove();
    // nodeLabelsChildren.remove();

    // nodeLabels = g
    //   .selectAll(".node-label")
    //   .data(data.nodes)
    //   .enter()
    //   .append("text")
    //     .attr("class", "node-label")
    //     .text(d => d.label);

    // nodeLabelsChildren.push(g
    //   .selectAll(".node-column-label ." + classP)
    //   .data(d.columns)
    //   .enter()
    //   .append("text")
    //     .attr("class", "node-column-label " + classP)
    //     .text(d => d.label));
        

  } 

}

async function updatePage() {

  let resp = eAPI.getActiveDBData();

  if(!resp) return eAPI.alert("error", "Error: Connection not found");

  
  let buttons = document.querySelectorAll(".views button");

  buttons.forEach((button) => {
    button.disabled = false;
  });

  centerForceInput.removeEventListener("input", centerForceInputHandler);
  repelForceInput.removeEventListener("input", repelForceInputHandler);
  linkForceInput.removeEventListener("input", linkForceInputHandler);
  linkDistanceInput.removeEventListener("input", linkDistanceInputHandler);

  centerForceInput.addEventListener("input", centerForceInputHandler);
  repelForceInput.addEventListener("input", repelForceInputHandler);
  linkForceInput.addEventListener("input", linkForceInputHandler);
  linkDistanceInput.addEventListener("input", linkDistanceInputHandler);

  data = resp.data;

  // simulation = d3.forceSimulation(data.nodes)
  //   .force("link", d3.forceLink(data.links).id((d) => d.id).strength(0))
  //   .force("charge", d3.forceManyBody().strength(0))
  //   .force("center", d3.forceCenter().strength(0))
  //   .alpha(0.05)
  //   .alphaDecay(0);

  simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY());
                 
  centerForceInputHandler();
  repelForceInputHandler();
  linkForceInputHandler();
  linkDistanceInputHandler();

  svg = d3.select("#canvas")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;")
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle");

  g = svg.append("g");

  const x = d3.scaleLinear([0, 1], [0, 100]);
  const y = d3.scaleLinear([0, 1], [0, 100]);

  link = g
    .selectAll(".link")
    .data(data.links)
    .enter()
    .append("line")
      .attr("class", "link");
        
  node = g
    .selectAll(".node")
    .data(data.nodes)
    .enter()
    .append("circle")
      .attr("class", "node")
      .attr("cx", d => x(d[0]))
      .attr("cy", d => y(d[1]))
      .attr("r", 18)
      .call(drag(simulation))
      .on("click", creatingChildren);

  nodeLabels = g
    .selectAll(".node-label")
    .data(data.nodes)
    .enter()
    .append("text")
      .attr("class", "node-label")
      .text(d => d.label)

  let transform;

  simulation.on("tick", () => {

    if(!transform) return;  

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    nodeLabels
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y - d3.select(node._groups[0][d.index]).attr("r") - 10);

    if(column != null && linkChildren != null && nodeLabelsChildren != null) {

      linkChildren.forEach((c) => {
        c.attr("x1", (d) => d.source.x) 
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      });
 
      column.forEach((c) => {
        c.attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
      });





      //console.log("node", node._groups[0]);
      //console.log("column", column);
      //console.log("nodeLabels", nodeLabels._groups[0]);
      //console.log("nodeLabelsChildren", nodeLabelsChildren._groups[0]);


      nodeLabelsChildren.forEach((c, j) => {
        let i = 0;
        c.attr("x", (d) => d.x)
        .attr("y", (d) => {
          return d.y - d3.select(column[j]._groups[0][i++]).attr("r") - 10});
      });
          

    }

  });

  zoom = d3.zoom().on("zoom", e => {

    if (e.transform.k < 0.1 || e.transform.k > 100) { e.transform.k = transform.k; e.transform.x = transform.x; e.transform.y = transform.y; return; }

    g.attr("transform", (transform = e.transform));

    document.querySelector("#zoom").innerHTML = Math.round(transform.k * 100) + "%";
  
  });

  svg
    .call(zoom)
    .call(zoom.transform, d3.zoomIdentity)
    .node();

  simulation.alpha(1).restart();

  document.querySelector("#graph-view #activeDBTitle").innerHTML = resp.database != resp.name ? `${resp.name} (${resp.database.replaceAll("_", " ")})` : resp.database.replaceAll("_", " ");

  editor.setValue(`select * from ${resp.database}.table_name`);

}

function updateIDs() {
  document.querySelectorAll(".item").forEach((item, i) => {
    item.id = i;
  });
}

async function clearConnections() {
  if (!eAPI.getConnections().length) return;

  let erase = await eAPI.clearConnections();

  if (!erase) return;

  document.querySelector("#items").innerHTML = "";

  reset();

  eAPI.getConnections().length == 0 ? document.querySelector("#no-connection-found").classList.remove("hidden") : document.querySelector("#no-connection-found").classList.add("hidden");

}

function setPage(e = null) {
  let pages = document.querySelectorAll(".page");

  pages.forEach((page) => {
    page.style.display = "none";
  });

  if(e == null) return;

  e.style.display = "flex";
}

function reset(redirect = true) {
  document.querySelector("svg#canvas").innerHTML = "";

  let buttons = document.querySelectorAll(".views button");

  buttons.forEach((button) => {
    button.disabled = true;
  });

  try{
    editor.setValue(`select * from table_table;`);
  }catch{}

  if(!redirect) return;
  
  setPage(document.querySelector("#empty-view"));
}

function resetZoom() {
  svg.call(zoom.transform, d3.zoomIdentity);
}

function genQuery(type) {

  let resp = eAPI.getActiveDBData();

  if(!resp) return;

  let tableUsed = "none-magma";
  
  try {
    tableUsed = editor.getValue().split("from")[1].split(" ")[1].replaceAll(";", "");
  } catch (error) {
    try {
      tableUsed = editor.getValue().split("into")[1].split(" ")[1].replaceAll(";", "");
    } catch (error) {
      try {
        tableUsed = editor.getValue().split("update")[1].split(" ")[1].replaceAll(";", "");
      } catch (error) {
        try {
          tableUsed = editor.getValue().split("delete")[1].split(" ")[1].replaceAll(";", "");
        } catch (error) {
          try {
            tableUsed = editor.getValue().split("table")[1].split(" ")[1].replaceAll(";", "");
          } catch (error) {
            tableUsed = "none-magma";
          }
        }
      }
    }
  }

  if(tableUsed === "none-magma" || resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1]) === undefined || resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1]).length < 1) {
    tableUsed = `\`${resp.database}\`.\`table_name\``;
  }

  let query = "";

  switch(type) {
    case "select":
      query = `select * from ${tableUsed};`;
      break;
    case "insert":
      query = `insert into ${tableUsed} (column1, column2) values (value1, value2);`;

      if(tableUsed != `\`${resp.database}\`.\`table_name\``) {

        let columns = resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1])[0].columns.map(c => c.label).join(", ");

        let values = resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1])[0].columns.map(c => `value${resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1])[0].columns.indexOf(c) + 1}`).join(", ");

        query = `insert into ${tableUsed} (${columns}) values (${values});`;
      }

      break;
    case "update":

      query = `update ${tableUsed} set column1 = value1, column2 = value2 where column1 = value1;`;

      if(tableUsed != `${resp.database}.table_name`) {

        let setValues = resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1])[0].columns.map(c => `${c.label} = value${resp.data.nodes.filter(c => c.label == tableUsed.split(".")[1])[0].columns.indexOf(c) + 1}`).join(", ");

        query = `update ${tableUsed} ${setValues} where column1 = value1;`;
      }

      break;
    case "delete":

      query = `delete from ${tableUsed} where column1 = value1;`;
      break;
    case "create":
      query = `create table \`${resp.database}\`.\`table_name\` (\n\tcolumn1 type,\n\tcolumn2 type\n);`;
      break;
    case "drop":
      query = `drop table ${tableUsed};`;
      break;
  }

  editor.setValue(query);

  setPosQueryResultSection();
}

applyTheme();
loadThemesConfig(document.querySelector("#themes-config"), getDefaultTheme());
loadQueriesList(document.querySelector("#items-queries"));

(async () => {
  await loading();
})();

reset();
