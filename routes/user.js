// routes/user.js

let express = require("express");
const stripe = require('stripe')('sk_test_Kgcalsjjpi8nd1esCWktMAN1');
let userRouter = express.Router();
const { UserModel } = require("../models/index");
let jwt = require("jsonwebtoken");
let config = require("../config");
const { SuccessModel, ErrorModel } = require("../utils/resModule");
const YOUR_DOMAIN = 'http://localhost:8000';

userRouter.post("/register", async function (req, res) {
    /* Creating a new user and then sending a response to the client. */
    await UserModel.create(req.body);
    res.json(new SuccessModel("registerWasSuccessful"));
});

userRouter.post("/login", async function (req, res) {
    /* This is the login route. It is taking the username and password from the request body and then
    using them to query the database. If the query is successful, it will return a token. If the
    query is unsuccessful, it will return an error. */
    let { username, password } = req.body;
    let query = { username, password };
    try {
        let result = await UserModel.findOne(query);
        let resultJSON = result.toJSON();
        let token = jwt.sign(resultJSON, config.Secret, { expiresIn: config.EXPIRES });
        res.json(new SuccessModel(token));
    } catch (error) {
        res.json(new ErrorModel("loginFailed"));
    }
});

userRouter.get("/currentUser", async function (req, res) {
    /* This is the route that is used to get the current user's information. It is taking the token
    from the request header and then using it to query the database. If the query is successful, it
    will return the user's information. If the query is unsuccessful, it will return an error. */
    let authorization = req.headers["authorization"];
    let token = authorization.split(" ")[1];
    let result = jwt.verify(token, config.Secret);
    res.json(new SuccessModel(result, "loginWasSuccessful"));
});

userRouter.get("/account", async function (req, res) {
    try {
        /* Querying the database for all users and then sending the result to the client. */
        let result = await UserModel.find();
        res.json(new SuccessModel(result, "queryWasSuccessful"));
    } catch (error) {
        res.json(new ErrorModel(error));
    }
});

userRouter.delete("/account", async function (req, res) {
    /* Checking to see if the user exists in the database. If the user exists, it will delete the user.
    If the user does not exist, it will return an error. */
    let hasRes = await UserModel.findOne(req.body);
    if (hasRes) {
        let { deletedCount } = await UserModel.remove(req.body);
        if (deletedCount) {
            res.json(new SuccessModel("deletionSucceeded"));
        }
    } else {
        res.json(new ErrorModel("deleteFailed"));
    }
});

userRouter.put("/account", async function (req, res) {
    /* Updating the user's information. */
    let { nModified } = await UserModel.updateOne(
        req.query,
        { $set: req.body },
        { multi: true }
    );
    if (nModified) {
        res.json(new SuccessModel("modificationSucceeded"));
    } else {
        res.json(new ErrorModel("modificationFailed"));
    }
});

userRouter.post('/checkout', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price: 'price_1M0AsaAy6KNxnnbKOTjIk6dC',
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}?success=true`,
        cancel_url: `${YOUR_DOMAIN}?canceled=true`,
        automatic_tax: {enabled: true},
      });
      res.redirect(303, session.url);
});

module.exports = {
    userRouter,
};
