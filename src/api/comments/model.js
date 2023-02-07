import mongoose from "mongoose"

const { Schema } = mongoose
const commentsSchema = new Schema(
  {
    text: { type: String, required: true }
  },
  { timestamps: true }
)
export default commentsSchema
