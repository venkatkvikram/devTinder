# DevTinder APIs


authRouter
- POST /signup
- POST /login
- POST /logout

profileRouter
- GET /profile/view
- PATCH /profile/edit
- PATCH /password/password


connectionRequestRouter
- POST /request/send/interestes/:userId
- POST /request/send/ignore/:userId
- POST /request/review/accepted/:requestId
- POST /request/review/rejected/:requestId

userRouter
- GET /user/requests/received
- GET /requests/received
- GET /feed 




Status : Ignore, Interested, Accepted, Rejected

