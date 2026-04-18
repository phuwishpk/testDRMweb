// Entrypoint for Plesk/IIS Node.js hosting.
// Keeps the app's actual code inside /backend while allowing startup file = "server.js" at site root.
require('./backend/server.js');
