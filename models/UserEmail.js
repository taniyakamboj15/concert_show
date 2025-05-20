
const mongoose = require('mongoose');
const userEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  link: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("UserEmail", userEmailSchema);  