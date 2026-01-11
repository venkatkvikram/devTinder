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
