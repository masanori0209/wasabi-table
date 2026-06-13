/** Benchmark-only sample records for records-mode measurements. */

/** @typedef {import('../../dist/records-data-source.js').RecordRow} RecordRow */
/** @typedef {import('../../dist/records-data-source.js').RecordColumnDef} RecordColumnDef */

/** @type {RecordColumnDef[]} */
export const SAMPLE_RECORD_COLUMNS = [
  { field: 'personid', header: 'ID', width: 100 },
  { field: 'fname', header: 'First Name', width: 200 },
  { field: 'lname', header: 'Last Name', width: 200 },
  { field: 'email', header: 'Email', width: 250 },
  { field: 'check', header: '', width: 50 },
];

/** @param {number} count @returns {RecordRow[]} */
export function generateSampleRecords(count) {
  const records = new Array(count);
  for (let i = 0; i < count; i += 1) {
    records[i] = {
      personid: i + 1,
      fname: `fname_${i}`,
      lname: `lname_${i}`,
      email: `user${i}@example`,
      check: i % 3 === 0,
    };
  }
  return records;
}
