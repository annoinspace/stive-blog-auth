import mongoose from "mongoose"
import bcrypt from "bcrypt"

const { Schema, model } = mongoose

const usersSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    address: {
      street: { type: String },
      number: { type: Number }
    },
    likeHistory: [
      {
        title: String,
        category: String,
        likeDate: Date
      }
    ]
  },
  {
    timestamps: true
  }
)

usersSchema.pre("save", async function (next) {
  const currentUser = this
  if (currentUser.isModified("password")) {
    const plainPW = currentUser.password
    const hash = await bcrypt.hash(plainPW, 11)
    currentUser.password = hash
  }
  // When we are done with this function -----> next
  next()
})

usersSchema.methods.toJson = function () {
  const userDocument = this
  const user = userDocument.toObject()

  delete user.password
  delete user.createdAt
  delete user.updatedAt
  delete user.__v
  return user
}

usersSchema.static("checkCredentials", async function (email, password) {
  const user = await this.findOne({ email })

  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (passwordMatch) {
      return user
    } else {
      return null
    }
  } else {
    return null
  }
})

export default model("User", usersSchema)
