import GoogleStrategy from "passport-google-oauth20"
import UsersModel from "../../api/users/model.js"
import { createAccessToken } from "./tools.js"

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.BE_URL}/users/googleRedirect` // this needs to match EXACTLY with the redirect URL you have configured on Google
  },

  async (_, __, profile, passportNext) => {
    try {
      const { email, given_name, family_name } = profile._json
      const user = await UsersModel.findOne({ email })

      if (user) {
        const accessToken = await createAccessToken({ _id: user._id, rolse: user.role })
        passportNext(null, { accessToken })
      } else {
        const newUser = new UsersModel({
          firstName: given_name,
          lastName: family_name,
          email,
          googleId: profile.id
        })
        const createdUser = await newUser.save()
        const accessToken = await createAccessToken({
          _id: createdUser._id,
          role: createdUser.role
        })
        passportNext(null, { accessToken })
      }
    } catch (error) {
      console.log(error)
      passportNext(error)
    }
  }
)

export default googleStrategy
