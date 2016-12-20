'use strict';

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '577966968069-0cdlgv4s1gri5r8584qfp4rl3v1c8d80.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const TOTAL = 'total';

let app = new Vue({
  el: '#app',
  data: {
    loading: true,
    needAuth: false,
    message: 'yo',
    months: {},
  },
});

// Make a bin for each month.
for (let i = 0; i < 12; i++) {
  Vue.set(app.months, i + 1, {});
}
Vue.set(app.months, TOTAL, {});

/**
 * MAIN ENTRY POINT
 * Check if current user has authorized this application.
 */
function checkAuth() {
  console.log('checking');
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    // Hide auth UI, then load client library.
    app.needAuth = false;
    loadCalendarApi();
  } else {
    // Show auth UI, allowing the user to initiate authorization by
    // clicking authorize button.
    app.needAuth = true;
  }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
    handleAuthResult);
  return false;
}

/**
 * Load Google Calendar client library. List upcoming events
 * once client library is loaded.
 */
function loadCalendarApi() {
  gapi.client.load('calendar', 'v3', listUpcomingEvents);
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
  var request = gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 10,
    'orderBy': 'startTime'
  });

  request.execute(function(resp) {
    var events = resp.items;
    console.log(resp);

    if (!events || events.length <= 0) {
      console.log('No upcoming events found.');
      return;
    }
      
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var when = event.start.dateTime;
      if (!when) {
        when = event.start.date;
      }
      let month = new Date(Date.parse(when)).getMonth() + 1;
      for (let j = 0; j < event.attendees.length; j++) {
        let who = event.attendees[j];
        increment(month, who);
        increment(TOTAL, who);
      }
    }
    app.loading = false;
  });
}

function increment(month, who) {
  if (!app.months[month][who.displayName]) {
    Vue.set(app.months[month], who.displayName, {
      displayName: who.displayName,
      email: who.email,
      count: 0
    });
  }
  app.months[month][who.displayName].count += 1;
}


