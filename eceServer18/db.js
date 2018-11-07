var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/db18", { useNewUrlParser: true });

module.exports = mongoose;
