const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://abhinav:yP2i3MrJ9vZjB8Ff@cluster0.en1oo.mongodb.net/concert?retryWrites=true&w=majority&appName=Cluster0"
    );
  } catch (err) {
    console.log(err.message);
  }
};
module.exports = dbConnect;
