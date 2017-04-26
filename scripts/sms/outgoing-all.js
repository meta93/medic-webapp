#!/usr/bin/env node

if(process.argv[2] === '-h' || process.argv[2] === '--help') {
  console.log(`Get a quick report of all SMS in your database.

Usage:
    ${process.argv[1]} [medic db URL]

Example:
    ${process.argv[1]} http://admin:pass@localhost:5984/medic
`);
  process.exit(0);
}

const couchUrl = process.argv[2] || process.env.COUCH_URL || 'http://admin:pass@localhost:5984/medic';

const PouchDB = require('pouchdb'),
      u = require('./utils');


function link(docId) {
  return `${u.sanitiseUrl(couchUrl)}/${docId}`;
}

u.log(`Starting for ${u.sanitiseUrl(couchUrl)}…`);

var db = PouchDB(couchUrl);

console.log('        state | to               |  len | message                          | doc URL');

db.query('medic/tasks_messages')
  .then((res) => {
    res.rows.map((row) => {
        doc = row.value;
        const m = doc.message;
        u.printTableRow(
            doc.state, -13,
            doc.to, 16,
            m ? m.length : 0, -4,
            m, 32,
            link(row.id), 0);
    });
  })
  .then(() => u.log('Finished.'))
  .catch(console.log);