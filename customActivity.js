"use strict";

var connection = new Postmonger.Session();
var payload = {};
var schema = {};
var dataPayload = [];
var steps = [
  // initialize to the same value as what's set in config.json for consistency
  { label: "Step 1", key: "step1" },
  { label: "Step 2", key: "step2" },
];
var currentStep = steps[0].key;
var hasNameCampaign = null;

$(window).ready(onRender);
connection.on("initActivity", initActivity);
connection.on("requestedSchema", requestedSchema);
connection.on("clickedNext", onClickedNext);
connection.on("clickedBack", onClickedBack);
connection.on("gotoStep", onGotoStep);

function onRender() {
  // JB will respond the first time 'ready' is called with 'initActivity'
  connection.trigger("ready");
  connection.trigger("nextStep");
  connection.trigger("prevStep");
  // Disable the next button if a value isn't selected
  // Disable the next button if a value isn't selected
  $("#nameCampaign").change(function () {
    hasNameCampaign = getMessage();
    hasNameCampaign = hasNameCampaign.nameCampaign;
    connection.trigger("updateButton", {
      button: "next",
      text: "next",
      enabled: Boolean(hasNameCampaign),
    });
  });
  // validateField();
}

function initActivity(data) {
  // console.log("initActivity: ", JSON.stringify(data));
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

  $.each(inArguments, function (index, inArgument) {
    $.each(inArgument, function (key, val) {
      if (key === "nameCampaign") {
        console.log("each: ", val);
      }
    });
  });

  // console.log("Has In arguments: " + JSON.stringify(inArguments));
  connection.trigger("requestSchema");
  if (inArguments) {
    setTimeout(function () {
      fillForm(inArguments);
    }, 1500);
  }
}
// function validateField() {
//   hasNameCampaign = getMessage();
//   hasNameCampaign = hasNameCampaign.nameCampaign;
//   // if (hasNameCampaign) {
//   //   connection.trigger("updateButton", {
//   //     button: "next",
//   //     text: "next",
//   //     enabled: Boolean(hasNameCampaign),
//   //   });
//   // } else {
//   $("#nameCampaign").change(function () {
//     hasNameCampaign = getMessage();
//     hasNameCampaign = hasNameCampaign.nameCampaign;
//     connection.trigger("updateButton", {
//       button: "next",
//       text: "next",
//       enabled: Boolean(hasNameCampaign),
//     });
//   });
//   // }
// }
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
}
function onClickedNext() {
  if (currentStep.key === "step2") {
    // console.log("currentStep.key: ", currentStep.key);
    save();
  } else {
    // console.log("currentStep.key: ", currentStep.key);
    connection.trigger("nextStep");
  }
}
function onClickedBack() {
  connection.trigger("prevStep");
}
function onGotoStep(step) {
  // console.log("step: ", step);
  showStep(step);
  connection.trigger("ready");
}
function showStep(step, stepIndex) {
  if (stepIndex && !step) {
    step = steps[stepIndex - 1];
  }

  currentStep = step;

  $(".step").hide();

  switch (currentStep.key) {
    case "step1":
      $("#step1").show();
      connection.trigger("updateButton", {
        button: "next",
        enabled: Boolean(hasNameCampaign),
      });
      connection.trigger("updateButton", {
        button: "back",
        visible: false,
      });
      break;
    case "step2":
      $("#step2").show();
      connection.trigger("updateButton", {
        button: "back",
        visible: true,
      });
      connection.trigger("updateButton", {
        button: "next",
        text: "done",
        visible: true,
      });
      break;
  }
}
// Ao clicar em done é atualizado o Payload com a configuração do Objeto
function save() {
  var bodyMessage = getMessage();
  var messageTreated = treatMessage(bodyMessage);
  bodyMessage = messageTreated;
  console.log("bodyMessage: ", JSON.stringify(bodyMessage));
  payload["arguments"].execute.inArguments = [bodyMessage];

  payload["metaData"].isConfigured = true;

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
    for (var k in messageToTreat) {
      for (const i in schema) {
        let keyDE = schema[i].key;
        let nameDE = schema[i].name;
        let varName = `<<${nameDE}>>`;
        messageToTreat[k] = messageToTreat[k].replace(varName, `{{${keyDE}}}`);
      }
    }
    return messageToTreat;
  }
}
function fillForm(inArguments) {
  dataPayload = inArguments[0];
  if (dataPayload) {
    for (const i in dataPayload) {
      var property = dataPayload[i];
      if (
        property.indexOf("Event.DEAudience") >= 0 ||
        property.indexOf("Event.APIEvent") >= 0
      ) {
        for (var index in schema) {
          var keyDE = schema[index].key;
          var nameDE = schema[index].name;
          var varName = `<<${nameDE}>>`;
          dataPayload[i] = dataPayload[i].replace(keyDE, varName);
        }
      }
    }
    // console.log("dataPayloadToTreat: ", schema);
    var nameCampaign = document.getElementById("nameCampaign");
    nameCampaign.value = dataPayload.nameCampaign;

    var nameProduct = document.getElementById("nameProduct");
    nameProduct.value = dataPayload.nameProduct;

    var firstName = document.getElementById("firstName");
    firstName.value = dataPayload.firstName
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    var lastName = document.getElementById("lastName");
    lastName.value = dataPayload.lastName
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    var username = document.getElementById("username");
    username.value = dataPayload.username
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    var email = document.getElementById("email");
    email.value = dataPayload.email.replaceAll("{{", "").replaceAll("}}", "");
    var address = document.getElementById("address");
    address.value = dataPayload.address
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    var message = document.getElementById("message");
    message.value = dataPayload.message
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    var country = document.getElementById("country");
    country.value = dataPayload.country
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    var state = document.getElementById("state");
    state.value = dataPayload.state.replaceAll("{{", "").replaceAll("}}", "");
    var zip = document.getElementById("zip");
    zip.value = dataPayload.zip.replaceAll("{{", "").replaceAll("}}", "");
  }
}
