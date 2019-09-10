const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const expRoutes = require("./routes/experiments");

const app = express();

/** This file is for communication between our server and code */

app.use(bodyParser.json({ limit: '1mb' })) // payload limit when sending a request to the server
mongoose
.connect(
    "mongodb://localhost:27017/wcd", { useNewUrlParser: true }
    )
    .then(() => {
        console.log("Connected to database!");
    })
    .catch(() => {
        console.log("Connection failed!");
    });
    
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // configure in which headers the server will support
    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
            );
            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, PUT, POST, PATCH, DELETE, OPTIONS"
                );
                next();
            });

            app.use("/api/experiments", expRoutes);

            module.exports = app;
            