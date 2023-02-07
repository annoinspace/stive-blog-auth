import mongoose from "mongoose"

const { Schema, model } = mongoose

const likedSchema = new Schema(
  {
    owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    likedBlogs: [
      {
        blogId: { type: mongoose.Types.ObjectId, ref: "Blog" }
      }
    ],
    status: { type: String, required: true }
  },
  { timestamps: true }
)

export default model("Like", likedSchema)
