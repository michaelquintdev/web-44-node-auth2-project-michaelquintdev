const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const users = require('../users/users-model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

router.post("/register", validateRoleName, (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }
    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  const user = req.body;

  const rounds = process.env.BCRY_ROUNDS || 8;
  const hash = bcrypt.hashSync(user.password, rounds);

  user.password = hash

  users.add(user)
    .then(newUser => {
      res.status(201).json(newUser)
    })
    .catch(next)  
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }
    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }
    The token must expire in one day, and must provide the following information
    in its payload:
    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
  const { username, password } = req.body

  users.findBy({ username })
    .then(([user]) => {
      if(user && bcrypt.compareSync(password, user.password)){
        res.status(200).json({
          message:`${user.username} is back!`
        })
      }else{
        next({ status:401 , message:'Invalid Credentials'})
      }
    }).catch(next);
});

module.exports = router;
