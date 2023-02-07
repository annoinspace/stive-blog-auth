import express from "express"
import q2m from "query-to-mongo"
import BlogsModel from "../blogs/model.js"

const commentsRouter = express.Router()

commentsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query)

    const total = await BlogsModel.countDocuments(mongoQuery.criteria)

    const blogs = await BlogsModel.find(mongoQuery.criteria, mongoQuery.options.fields)
      .limit(mongoQuery.options.limit) // No matter the order of usage of these 3 options, Mongo will ALWAYS go with SORT, then SKIP, then LIMIT
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
    res.send({
      links: mongoQuery.links("http://localhost:3007/comments", total),
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      blogs
    })
  } catch (error) {
    next(error)
  }
})

export default commentsRouter
