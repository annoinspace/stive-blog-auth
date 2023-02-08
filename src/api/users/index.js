import express from "express"
import createHttpError from "http-errors"
import UsersModel from "./model.js"
import BlogsModel from "../blogs/model.js"
import { adminOnlyMiddleware } from "../../lib/auth/adminOnly.js"
import { createAccessToken } from "../../lib/auth/tools.js"
import { jwtAuthMiddleware } from "../../lib/auth/jwtAuth.js"
const usersRouter = express.Router()

usersRouter.post("/register", async (req, res, next) => {
  try {
    // make sure an email is not aready in use
    const existingUser = await UsersModel.findOne({ email: req.body.email })
    if (existingUser) {
      next(createHttpError(400, "Email already in use"))
    } else {
      const newUser = new UsersModel(req.body)
      const { _id } = await newUser.save()
      res.status(201).send({ _id })
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/", jwtAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
  try {
    const users = await UsersModel.find()
    res.send(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/me", jwtAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id)
    res.send(user)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId", jwtAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId)
    if (user) {
      res.send(user)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/:userId", jwtAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId, // WHO you want to modify
      req.body, // HOW you want to modify
      { new: true, runValidators: true } // OPTIONS. By default findByIdAndUpdate returns the record PRE-MODIFICATION. If you want to get back the updated object --> new:true
      // By default validation is off here --> runValidators: true
    )

    if (updatedUser) {
      res.send(updatedUser)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/:userId", jwtAuthMiddleware, adminOnlyMiddleware, async (req, res, next) => {
  try {
    const deletedUser = await UsersModel.findByIdAndDelete(req.params.userId)
    if (deletedUser) {
      res.status(204).send()
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = UsersModel.checkCredentials(email, password)
    if (user) {
      const payload = { _id: user._id, role: user.role }
      const accessToken = await createAccessToken(payload)
      res.send({ accessToken })
    } else {
      next(createHttpError(401, "Credentials are not OK!"))
    }
  } catch (error) {
    next(error)
  }
})

// ----------------------------------- embedded likeHistory routes -------------------------------

usersRouter.post("/:userId/likeHistory", async (req, res, next) => {
  try {
    const likedBlog = await BlogsModel.findById(req.body.blogId, { _id: 0 }) // here we could use projection {_id: 0} to remove the _id from the blog. We should do this because in this way Mongo will automagically create a unique _id for every item in the array

    if (likedBlog) {
      const blogToInsert = {
        ...likedBlog.toObject(),
        likeDate: new Date()
      }
      console.log("Blog TO INSERT: ", blogToInsert)

      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.params.userId, // WHO
        { $push: { likeHistory: blogToInsert } }, // HOW
        { new: true, runValidators: true } // OPTIONS
      )
      if (updatedUser) {
        res.send(updatedUser)
      } else {
        next(createHttpError(404, `User with id ${req.params.userId} not found!`))
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.body.blogId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId/likeHistory", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId)
    if (user) {
      if (user.likeHistory.length === 0) {
        res.send(` User ${user.firstName} ${user.lastName} with id:${user._id} has no liked blogs`)
      } else {
        res.send(user.likeHistory)
      }
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId/likeHistory/:blogId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId)
    if (user) {
      const purchasedBook = user.likeHistory.find(
        (book) => book._id.toString() === req.params.blogId // You CANNOT compare a string(req.params.blogId) with an ObjectId (book._id) --> you have to either convert _id into string or blogId into ObjectId
      )
      console.log(user.likeHistory)
      if (purchasedBook) {
        res.send(purchasedBook)
      } else {
        next(createHttpError(404, `Book with id ${req.body.bookId} not found!`))
      }
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/:userId/likeHistory/:blogId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId, // WHO
      { $pull: { likeHistory: { _id: req.params.blogId } } }, // HOW
      { new: true } // OPTIONS
    )
    if (updatedUser) {
      res.send(updatedUser)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

export default usersRouter
