'use strict';

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '577966968069-0cdlgv4s1gri5r8584qfp4rl3v1c8d80.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const TOTAL = 'total';

var app = new Vue({
  el: '#app',
  data: {
    loading: true,
    needAuth: false,
    months: {},
    byMonth: false,
    showEmail: false,
  },
  computed: {
    sortedMonths: function () {
      return Object.keys(this.months).sort().reverse();
    }
  },
  methods: {
    sortPeople: function (obj) {
      return Object.keys(obj).filter(x => x != 'rendered').sort((a,b) => obj[b].count - obj[a].count);
    },
  }
});

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
function listUpcomingEvents(pageToken) {
  var request = gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date(Date.now() - 365 * 3600 * 24 * 1000)).toISOString(),
    'timeMax': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    // Max 2500
    'maxResults': 250,
    'orderBy': 'startTime',
    pageToken: pageToken,
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
      if (!event.attendees) {
        continue;
      }
      var when = event.start.dateTime;
      if (!when) {
        when = event.start.date;
      }
      let date = new Date(Date.parse(when));
      // Like 2016-02
      let month = date.toISOString().slice(0, 7);
      if (!app.months[month]) {
        Vue.set(app.months, month, {
          'rendered': date.toLocaleString('en-US', {year: 'numeric', 'month': 'short'})
        });
      }
      for (let j = 0; j < event.attendees.length; j++) {
        let who = event.attendees[j];
        if (!who.displayName) {
          who.displayName = who.email;
        }
        increment(month, who);
        increment(TOTAL, who);
      }
    }
    if (resp.nextPageToken) {
      // Recurse if necessary.
      listUpcomingEvents(resp.nextPageToken);
    } {
      app.loading = false;
    }
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


