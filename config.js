// This file is for config options
module.exports = {
  // For webpage variables
  "page": {
    "title": "mynodeflix",
  },
  // The directory media is stored in
  "media_dir": __dirname + "/media/",
  // The directory for media to be seen by all
  "all_access": "public",
  // API cofing options
  "api": {
    // Basic will provide req with username and password strings
    "auth": "basic",
    // Headers defined here
    "headers": {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  },
  // Database options
  "database": {
    // Database to use
    "type": "none",
    // For cassandra run:
    // docker run -d --net=host tobert/cassandra -name "My Cluster"
    // for additional nodes add: --seed $IP to connect to cluster
    // to save the data map a local folder to /data with option:
    // -v /local/folder:/data
    // Host to connect to
    "host": "localhost",
  },
};
