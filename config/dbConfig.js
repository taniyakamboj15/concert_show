const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://taniyakamboj184:taniyaKamboj184@cluster0.sncqn.mongodb.net/event?retryWrites=true&w=majority&appName=Cluster0"
    );
  } catch (err) {
    console.log(err.message);
  }
};
module.exports = dbConnect;
