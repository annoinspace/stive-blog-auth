import mongoose from "mongoose"
import CommentSchema from "../comments/model.js"
const { Schema, model } = mongoose

const blogsSchema = new Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    category: { type: String, required: true },
    readTime: {
      value: { type: Number, required: true },
      unit: { type: String, required: true }
    },
    author: [{ type: Schema.Types.ObjectId, ref: "Author" }],
    content: { type: String },
    comments: [CommentSchema]
  },
  {
    timestamps: true // handles the createdAt and updatedAt fields
  }
)

// blogsSchema.static("findBlogsWithAuthors", async function(query){

// })

export default model("Blog", blogsSchema) // this is not automatically linked to the "blogs" collection
