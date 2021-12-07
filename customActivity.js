"use strict";

var connection = new Postmonger.Session();
var payload = {};
var schema = {};
var dataPayload = [];

$(window).ready(onRender);
connection.on("initActivity", initActivity);
connection.on("clickedNext", save);
connection.on("requestedTokens", requestedTokens);
connection.on("requestedSchema", requestedSchema);
connection.on("requestedEndpoints", requestedEndpoints);
connection.on("requestedInteractionDefaults", requestedInteractionDefaults);
connection.on("requestedInteraction", requestedInteraction);
connection.on(
  "requestedTriggerEventDefinition",
  requestedTriggerEventDefinition
);

function onRender() {
  // JB will respond the first time 'ready' is called with 'initActivity'
  connection.trigger("ready");
  connection.trigger("requestTokens");
  connection.trigger("requestEndpoints");
  // requisição dos campos da DE
  connection.trigger("requestSchema");
  connection.trigger("nextStep");
  connection.trigger("prevStep");
  connection.trigger("requestInteractionDefaults");
  connection.trigger("requestInteraction");
  connection.trigger("requestTriggerEventDefinition");
}

function initActivity(data) {
  console.log("initActivity: ", JSON.stringify(data));
  if (data) {
    payload = data;
  }

  var hasInArguments = Boolean(
    payload["arguments"] &&
      payload["arguments"].execute &&
      payload["arguments"].execute.inArguments &&
      payload["arguments"].execute.inArguments.length > 0
  );

  var inArguments = hasInArguments
    ? payload["arguments"].execute.inArguments
    : {};

  // console.log("Has In arguments: " + JSON.stringify(inArguments));

  if (inArguments) {
    console.log("schema: ", schema);
    fillForm(inArguments);
    // treatMessageToForm(inArguments);
  }

  connection.trigger("updateButton", {
    button: "next",
    text: "done",
    visible: true,
  });
}

function requestedTokens(tokens) {
  // console.log("requestedTokens: ", tokens);
}

// Broadcast in response to a requestSchema event called by the custom application.
function requestedSchema(data) {
  if (data.error) {
    console.error("requestedSchema Error: ", data.error);
  } else {
    schema = data["schema"];
  }
  // console.log("requestedSchema: ", schema);
  var ul = document.getElementById("ul-variable");
  var spinner = document.getElementById("spinner");
  setTimeout(function () {
    ul.removeChild(spinner);
    for (const i in schema) {
      var li = document.createElement("li");
      var div = document.createElement("div");
      var h6 = document.createElement("h6");
      var text = document.createTextNode(schema[i].name);
      li.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "lh-sm"
      );
      h6.classList.add("my-0");
      h6.appendChild(text);
      div.appendChild(h6);
      li.appendChild(div);
      ul.appendChild(li);
    }
  }, 3000);
  return schema;
}

function requestedEndpoints(endpoints) {
  // console.log("endpoints: ", endpoints);
}

function requestedInteractionDefaults(settings) {
  // console.log("requestedInteractionDefaults: ", settings);
}

function requestedInteraction(interaction) {
  // console.log("requestedInteraction: ", interaction);
}

function requestedTriggerEventDefinition(eventDefinitionModel) {
  // console.log(
  //   "requestedTriggerEventDefinition: ",
  //   eventDefinitionModel.eventDefinitionKey
  // );
}

// Ao clicar em done é atualizado o Payload com a configuração do Objeto
function save() {
  var bodyMessage = getMessage();
  var messageTreated = treatMessage(bodyMessage.message);
  bodyMessage.message = messageTreated;
  payload["arguments"].execute.inArguments = [bodyMessage];

  payload["metaData"].isConfigured = true;

  console.log("save payload: ", JSON.stringify(payload));
  connection.trigger("updateActivity", payload);
}

function getMessage() {
  var obj = [];
  var inputs = document.querySelectorAll("input,textarea,select");
  var arr = Array.from(inputs);
  for (var i in arr) {
    let id = arr[i].id;
    let value = arr[i].value;
    obj.push({ id: id, value: value });
  }
  let data = obj.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.value }), {});
  return data;
}

function treatMessage(msg) {
  var messageToTreat = msg;
  if (messageToTreat) {
    for (const i in schema) {
      let keyDE = schema[i].key;
      let nameDE = schema[i].name;
      let varName = `<<${nameDE}>>`;
      messageToTreat = messageToTreat.replace(varName, keyDE);
    }
    return messageToTreat;
  }
}

function treatMessageToForm(msg) {
  var dataPayloadToTreat = msg;
  if (dataPayloadToTreat) {
    for (const i in dataPayloadToTreat) {
      var property = dataPayloadToTreat[i];
      if (property.indexOf("Event.DEAudience") >= 0) {
        for (let index in schema) {
          let keyDE = schema[index].key;
          let nameDE = schema[index].name;
          let varName = `<<${nameDE}>>`;
          dataPayloadToTreat[i] = dataPayloadToTreat[i].replace(keyDE, varName);
        }
      }
    }
    console.log("dataPayloadToTreat: ", dataPayloadToTreat);
    return dataPayloadToTreat;
  }
}

function fillForm(inArguments) {
  dataPayload = inArguments[0];
  treatMessageToForm(dataPayload);
  if (dataPayload) {
    var firstName = document.getElementById("firstName");
    firstName.value = dataPayload.firstName;
    var lastName = document.getElementById("lastName");
    lastName.value = dataPayload.lastName;
    var username = document.getElementById("username");
    username.value = dataPayload.username;
    var email = document.getElementById("email");
    email.value = dataPayload.email;
    var address = document.getElementById("address");
    address.value = dataPayload.address;
    var message = document.getElementById("message");
    message.value = dataPayload.message;
    var country = document.getElementById("country");
    country.value = dataPayload.country;
    var state = document.getElementById("state");
    state.value = dataPayload.state;
    var zip = document.getElementById("zip");
    zip.value = dataPayload.zip;
  }
}
