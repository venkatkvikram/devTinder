- Middleware
- Express JS handles requests behind the scenes
- Diff bw app.use() and app.all()
- Write dummy auth middleware for admin
- Write dumy auth middleware for all user routes, except "/user/login"
- Error handling use app.use("/", (err,req,res,next) => {})

- Create a cluster on MongoDB website (Mongo Atlas)
- Intall Mongoose library
- Connect Application to database <"Connection- url"/devTinder>
- Call the connectDB function and connect to database before starting application on 8888
- Create  userSchema and userModel 
- Create POST /signup API call
- Push some documents using API calls from postman
- Error Handling using try,catch

- Add express.json middleware to app
- Make signup API dynamic to receive data from user input
- User.findOne with duplicate fields which object gets returned?
- Diff bw patch and PUT
- API to update and delete the user
- Explore mongoose documentation for Model action methods
- What are options in Model.findOneAndUpdate method
# DATA SANITIZATION

## Schema Level validations
- Explre schemaType options from documentation
- add required,unique,defaultvalue, lowercase, min, minlength,max,maxlength
- Create custom validate function for gender
- Add timestamps to user schema
- Improve DB schema but putting all appropriate validations on each field of schema
## API level validations 
- Add API Level validation on Patch request & signup post API
- Data sanitization - Add API validation for each field
- Install validator
- Explore validator library functions and use valdiator fucntions for password, url and emil
- NEVER trust req.body


- validate data in signup API
- Install bcrypt package
- Create passwordhash with bcrypt.hash
- Create login API
- Compare passwords and throw erros if email or password is invalid

- Install cookie parser
- Send a dummy token to user
- create GET /profile API and check if you get the cookie back
- Intall jsonwebtoken
- In login API, after email and password verification, create a JWT token and send it to user in cookies
- Read cookies inside profile API and find the logged in user
- Create Auth Middleware and validate the token there and implement it in profile API
- Set the expiry of JWT token and cookies to 7 days

- Create User Schema method to getJWT
- Create User Schema method to validatePassword

- Explore Tinder APIs
- Create a list of all API you can think of in Dev Tinder
- Group multiple routes under respecitve routers
- Read documentation for express.Router
- Create routes folder for managing auth, profile, request routers
- Create authRouter, profileRouter, requestRouter
- Import these routers in app.js
- Create POST /logout API
- Create PATCH /profile/edit API
- Create PATCH /profile/password API => forgot password API
- Make you sure to validate the data in POST/PATCH request

- Create connection request schema
- Send COnnection Request API
- proper validaiton of data
- THink about all corner cases
- $or query $and query in mongoose
- Schema.pre function
- Read more about indexes in MongoDB
- Why do we need index in DB
- Advantages and Disadvantages of creating index
- ALWAYS THINK ABOUT CORNER CASES