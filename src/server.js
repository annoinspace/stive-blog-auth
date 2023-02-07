import express from "express"
import listEndpoints from "express-list-endpoints"
import authorsRouter from "./api/authors/index.js"
import cors from "cors"
import blogsRouter from "./api/blogs/index.js"
import commentsRouter from "./api/comments/index.js"
import { badRequestHandler, notFoundHandler, genericErrorHandler } from "./errorHandlers.js"

import mongoose from "mongoose"
import usersRouter from "./api/users/index.js"

const server = express()

const port = process.env.PORT

// ---------------- WHITELIST FOR CORS ------------------

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]

const corsOptions = {
  origin: (origin, corsNext) => {
    console.log("-----CURRENT ORIGIN -----", origin)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      corsNext(null, true)
    } else {
      corsNext(createHttpError(400, `Origin ${origin} is not in the whitelist!`))
    }
  }
}

server.use(express.json())
server.use(cors(corsOptions))
// ****************** ENDPOINTS ********************
server.use("/blogPosts", blogsRouter)
server.use("/comments", commentsRouter)
server.use("/authors", authorsRouter)
server.use("/users", usersRouter)

// ****************** ERROR HANDLERS ****************
server.use(badRequestHandler) // 400
server.use(notFoundHandler) // 404
server.use(genericErrorHandler) // 500
// (the order of these error handlers does not really matters, expect for genericErrorHandler which needs to be the last in chain)

mongoose.set("strictQuery", false)
mongoose.connect(process.env.MONGO_URL)

mongoose.connection.on("connected", () => {
  console.log("connectd to mongo!")
  server.listen(port, () => {
    console.table(listEndpoints(server))
    console.log("server is running on port:", port)
    // const blogs = await getBlogs()
    // console.log(blogs)
  })
})
