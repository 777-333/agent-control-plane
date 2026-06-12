// In tests the authenticated sample user acts as the project owner, so they map
// to DEFAULT_TENANT and see the full seeded demo data the tests assert against.
process.env.OWNER_OPEN_ID = process.env.OWNER_OPEN_ID || "sample-user";
