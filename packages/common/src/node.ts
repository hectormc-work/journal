// Node-only exports — anything here may read `process.env`, touch the filesystem,
// or otherwise assume a Node runtime. Only import this from server-side packages
// (server, db); never from client/ui-common, which get bundled for the browser.
export * from "./settings";
