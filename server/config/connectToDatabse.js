const mongoose = require("mongoose")
password = encodeURIComponent("@Deepu0895..")
console.log(password)

const connectionString = process.env.ATLAS_URI_1 || `mongodb+srv://deepanshuy098_db_user:${password}@chatapp.5ruznci.mongodb.net/`

const connectToDatabase = async () => {
  try {
    await mongoose.connect(connectionString, {
      dbName: "chatAppDB"
    })
    console.log("CONNECTED TO THE DATABASE")
  } catch (error) {
    console.error("ERROR CONNECTING TO THE DATABASE:", error)
    throw error
  }
}

module.exports = { connectToDatabase }