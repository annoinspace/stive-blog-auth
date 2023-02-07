import express from "express"
import BlogsModel from "./model.js"
import q2m from "query-to-mongo"
// import { sendRegistrationEmail } from "../../lib/email-tools.js"
import createHttpError from "http-errors"

const blogsRouter = express.Router()

blogsRouter.post("/", async (req, res, next) => {
  try {
    const newBlog = new BlogsModel(req.body)
    // newBlog.set("author.avatar", `https://ui-avatars.com/api/?name=${req.body.author.name}`)
    const { _id } = await newBlog.save()
    res.status(201).send({ _id })
  } catch (error) {
    next(error)
  }
})

blogsRouter.get("/", async (req, res, next) => {
  try {
    const blogs = await BlogsModel.find().populate({ path: "author", select: "firstName lastName" })
    res.send(blogs)
  } catch (error) {
    console.log("error getting blogs")
    next(error)
  }
})

blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId).populate({ path: "author", select: "firstName lastName" })

    if (blog) {
      res.send(blog)
    } else {
      next(NotFound(`Blog with id ${req.params.blogId} not found!`))
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

blogsRouter.put("/:blogId", async (req, res, next) => {
  try {
    const updatedBlog = await BlogsModel.findByIdAndUpdate(req.params.blogId, req.body, {
      new: true,
      runValidators: true
    })
    if (updatedBlog) {
      res.send(updatedBlog)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const deletedBlog = await BlogsModel.findByIdAndDelete(req.params.blogId)
    if (deletedBlog) {
      res.status(204).send()
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

// blogsRouter.post("/register", async (req, res, next) => {
//   try {
//     const { email } = req.body
//     await sendRegistrationEmail(email)
//     res.send()
//   } catch (error) {
//     next(error)
//   }
// })

// ------------------------ embedding comments ---------------------
blogsRouter.get("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId)
    if (blog) {
      if (blog.comments.length === 0) {
        res.send("No comments found for this blog.")
      } else {
        res.send(blog.comments)
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found!`))
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

blogsRouter.get("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId)
    if (blog) {
      const selectedComment = blog.comments.find((comment) => comment._id.toString() === req.params.commentId)

      if (selectedComment) {
        res.send(selectedComment)
      } else {
        next(createHttpError(404, `Comment with id ${req.params.commentId} not found!`))
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const comment = req.body // Get the comment from the req.body

    if (comment) {
      const commentToInsert = comment
      const updatedBlog = await BlogsModel.findByIdAndUpdate(
        req.params.blogId, // WHO
        { $push: { comments: commentToInsert } }, // HOW
        { new: true, runValidators: true } // OPTIONS
      )

      if (updatedBlog) {
        res.send(updatedBlog)
      } else {
        next(createHttpError(404, `Blog with id ${req.params.blogId} not found!`))
      }
    } else {
      // 4. In case of either book not found or blog not found --> 404
      next(createHttpError(404, `Comment not found!`))
    }
  } catch (error) {
    next(error)
  }
})

blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const comment = req.body // Get the comment edit from the req.body

    if (comment) {
      // Find the comment by id and update it with the new comment data
      const updatedBlog = await BlogsModel.findOneAndUpdate(
        { "comments._id": req.params.commentId },
        { $set: { "comments.$": comment } },
        { new: true, runValidators: true } // OPTIONS
      )

      if (updatedBlog) {
        res.send(updatedBlog)
      } else {
        next(createHttpError(404, `Comment with id ${req.params.commentId} not found!`))
      }
    } else {
      next(createHttpError(404, `Comment not found!`))
    }
  } catch (error) {
    next(error)
  }
})

// ------------------------------------ alternative put request --------------------------------------

// blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
//   try {
//     // 1. Find blog by Id (obtaining MONGOOSE DOCUMENT!)
//     const blog = await BlogsModel.findById(req.params.blogId)

//     if (blog) {
//       // 2. Update the item in the array by using normal JS code
//       // 2.1 Search for the index of the product into the comments array
//       const index = blog.comments.findIndex((comment) => comment._id.toString() === req.params.commentId)
//       if (index !== -1) {
//         // 2.2 If the product is there --> modify that product with some new data coming from req.body
//         blog.comments[index] = { ...blog.comments[index].toObject(), ...req.body }
//         // 3. Since blog object is a MONGOOSE DOCUMENT I can use .save() method to update that record
//         await blog.save()
//         res.send(blog)
//       } else {
//         // 2.3 If comment is not there --> 404
//         next(createHttpError(404, `Commment with id ${req.params.commentId} not found!`))
//       }
//     } else {
//       next(createHttpError(404, `blog with id ${req.params.blogId} not found!`))
//     }
//   } catch (error) {
//     next(error)
//   }
// })

blogsRouter.delete("/:blogId/commments/:commentId", async (req, res, next) => {
  try {
    const updatedBlog = await BlogsModel.findByIdAndUpdate(
      req.params.blogId, // WHO
      { $pull: { comments: { _id: req.params.commentId } } }, // HOW
      { new: true } // OPTIONS
    )
    if (updatedBlog) {
      res.send(updatedBlog)
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

export default blogsRouter
