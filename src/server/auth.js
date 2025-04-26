// var settings = require('./settings'),

import "http-auth";

import "./settings";

auth = null;

if (settings.read("authentication")) {
    var [name, pwd] = settings.read("authentication").split(":"),
        // Moving this to top.
        // httpAuth = require("http-auth");

        auth = httpAuth.basic(
            {
                realm: "Open Stage Control",
            },
            (username, password, callback) => {
                // Custom authentication method.
                callback(username === name && password === pwd);
            }
        );
}

module.exports = auth;
