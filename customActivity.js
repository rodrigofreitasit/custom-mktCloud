"use strict";

var connection = new Postmonger.Session();
var payload = {};
var schema = {};

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

  console.log("Has In arguments: " + JSON.stringify(inArguments));

  connection.trigger("updateButton", {
    button: "next",
    text: "done",
    visible: true,
  });
}

function requestedTokens(tokens) {
  console.log("requestedTokens: ", tokens);
}

// Broadcast in response to a requestSchema event called by the custom application.
function requestedSchema(data) {
  if (data.error) {
    console.error("requestedSchema Error: ", data.error);
  } else {
    schema = data["schema"];
  }
  console.log("requestedSchema: ", schema);
  var ul = document.getElementById("ul-variable");
  for (const i in schema) {
    var li = document.createElement("li");
    var text = schema[i].name;
    li.appendChild(text);
    li.classList.add(
      "list-group-item",
      "d-flex justify-content-between",
      "lh-sm"
    );
    ul.appendChild(li);
  }
}

function requestedEndpoints(endpoints) {
  console.log("endpoints: ", endpoints);
}

function requestedInteractionDefaults(settings) {
  console.log("requestedInteractionDefaults: ", settings);
}

function requestedInteraction(interaction) {
  console.log("requestedInteraction: ", interaction);
}

function requestedTriggerEventDefinition(eventDefinitionModel) {
  console.log(
    "requestedTriggerEventDefinition: ",
    eventDefinitionModel.eventDefinitionKey
  );
}

// Ao clicar em done é atualizado o Payload com a configuração do Objeto
function save() {
  var bodyMessage = getMessage();

  payload["arguments"].execute.inArguments = [bodyMessage];

  payload["metaData"].isConfigured = true;

  console.log("save payload: ", JSON.stringify(payload));
  connection.trigger("updateActivity", payload);
}

function getMessage() {
  var objeto = [];
  var inputs = document.getElementsByTagName("input");
  var arr = Array.from(inputs);
  for (var i in arr) {
    let id = arr[i].id;
    let value = arr[i].value;
    objeto.push({ id: id, value: value });
  }
  let data = objeto.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.value }), {});
  return data;
}
