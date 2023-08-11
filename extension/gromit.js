let eventText = document.querySelector("#eventText");
let calendarSelector = document.querySelector("#calendarSelector");
let createEventBtn = document.querySelector("#createEvent");
let alertContainer = document.querySelector("#alertContainer");

eventDict = {};

loadUserCalendars();

// Loads the users calendars that they are an owner of, so that the user may choose which of their calendars to create an event within
async function loadUserCalendars() {
  chrome.identity.getAuthToken({ interactive: true }, async function (token) {
    let init = {
      method: "GET",
      async: true,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    };
    let response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      init
    );
    data = await response.json();

    for (let calendar of data.items) {
      if (calendar.accessRole == "owner") {
        let calendarOption = document.createElement("option");
        calendarOption.value = calendar.id;
        calendarOption.innerHTML = calendar.summary;
        calendarSelector.appendChild(calendarOption);
      }
    }
  });
}

// Calls AWS lambda function with the event text prompt, that then calls OpenAI
// Returns a JSON object that can be passed to GCal
function createEventHandler(eventText) {
  fetch("https://5xhrsut29l.execute-api.us-east-2.amazonaws.com/gromit", {
    method: "POST",
    async: true,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "null",
    },
    body: JSON.stringify({
      eventPrompt: eventText,
      currDateTime:
        new Date() + Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  })
    .then((response) => response.json())
    .then(function (data) {
      postCalendarEvent(data);
    })
    .catch((error) => {
      console.log(error);
      displayAlert(
        "Error creating calendar event. Please try again later.",
        true
      );
      createEventBtn.disabled = false;
    });
}

function postCalendarEvent(eventDict) {
  let selectedCalendarId =
    calendarSelector.options[calendarSelector.selectedIndex].value;

  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    let init = {
      method: "POST",
      async: true,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventDict),
    };
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${selectedCalendarId}/events`,
      init
    )
      .then((response) => response.json())
      .then((data) => {
        if ("error" in data) {
          displayAlert(
            "Error creating calendar event. Please try again later.",
            true
          );
        } else {
          displayAlert("Calendar event created!");
          eventText.value = "";
        }
      });
  });
  createEventBtn.disabled = false;
}

function displayAlert(message, error = false) {
  alertContainer.innerHTML =
    '<div class="alert alert-' +
    (error ? "danger" : "success") +
    '" role="alert">' +
    message +
    "</div>";

  setTimeout(function () {
    alertContainer.innerHTML = "";
  }, 3000);
}

createEventBtn.onclick = async function createEventBtnHandler(e) {
  e.preventDefault();
  createEventBtn.disabled = true;
  createEventHandler(eventText.value);
};
