const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({

  userId: {
    type: String,
  },

  message: {
    type: String,
  },

  response: {
    type: String,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model("Message", MessageSchema);