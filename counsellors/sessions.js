// The one list of live "Change the question" sessions (Saturdays, 10:00 to 11:30 am IST, online).
// Read by api/subscribe.js (date check, CRM tag, confirmation and reminder emails) and by
// /counsellors/ and /counsellors/webinar/ (date picker, next date, calendar links, JSON-LD).
// To add a date: add one line. The crmTag must already exist in the CRM tag registry.
// Then run  node tools/sync-sessions.mjs  to add its /join/ redirect and refresh the static JSON-LD
// (until you do, /join/<id> falls back to the "link opens a day before" note, which is fine).
export default [
  { id: "2026-12-12", start: "2026-12-12T10:00:00+05:30", end: "2026-12-12T11:30:00+05:30", label: "Saturday 12 December", crmTag: "Webinar-12Dec2026", joinPath: "/join/2026-12-12" },
  { id: "2026-12-26", start: "2026-12-26T10:00:00+05:30", end: "2026-12-26T11:30:00+05:30", label: "Saturday 26 December", crmTag: "Webinar-26Dec2026", joinPath: "/join/2026-12-26" },
  { id: "2027-01-09", start: "2027-01-09T10:00:00+05:30", end: "2027-01-09T11:30:00+05:30", label: "Saturday 9 January", crmTag: "Webinar-09Jan2027", joinPath: "/join/2027-01-09" },
  { id: "2027-01-23", start: "2027-01-23T10:00:00+05:30", end: "2027-01-23T11:30:00+05:30", label: "Saturday 23 January", crmTag: "Webinar-23Jan2027", joinPath: "/join/2027-01-23" },
  { id: "2027-02-13", start: "2027-02-13T10:00:00+05:30", end: "2027-02-13T11:30:00+05:30", label: "Saturday 13 February", crmTag: "Webinar-13Feb2027", joinPath: "/join/2027-02-13" },
  { id: "2027-02-27", start: "2027-02-27T10:00:00+05:30", end: "2027-02-27T11:30:00+05:30", label: "Saturday 27 February", crmTag: "Webinar-27Feb2027", joinPath: "/join/2027-02-27" },
];
