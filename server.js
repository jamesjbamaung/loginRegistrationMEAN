// Load the express module and store it in the variable express (Where do you think this comes from?)
var express = require("express");
console.log("Let's find out what express is", express);
// invoke express and store the result in the variable app
var app = express();
console.log("Let's find out what app is", app);
// use app's get method and pass it the base route '/' and a callback

//linking static folder
app.use(express.static(__dirname + "/static"));

//linking views folder and importing ejs (the view engine)
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//importing and installing body-parser
var bodyParser = require('body-parser');
// use it!
app.use(bodyParser.urlencoded({ extended: true }));

//importing and installing express-session
const session = require('express-session');
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))

//importing and installing flash
const flash = require('express-flash');
app.use(flash());


//importing and installing mongoose
var mongoose = require('mongoose');
// This is how we connect to the mongodb database using mongoose -- "basic_mongoose" is the name of
//   our db in mongodb -- this should match the name of the db you are going to use for your project.
mongoose.connect('mongodb://localhost/loginRegistration');

//importing and installing bcrypt
var bcrypt = require("bcrypt");

//creating a user database
var UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minlength: 2 },
    lastName: { type: String, required: true, minlength: 2 },
    email: { type: String, required: true, minlength: 2 },
    birthday: { type: Date, required: true },
    password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });
mongoose.model('User', UserSchema); // We are setting this Schema in our Models as 'User'
var User = mongoose.model('User'); // We are retrieving this Schema from our Models, named 'User'

// Use native promises (only necessary with mongoose versions <= 4)
mongoose.Promise = global.Promise;



app.get('/', function (request, response) {
    response.render('index');
});
app.post('/sessions', function(request, response){
    User.countDocuments({email: request.body.email}, function(err, count) {
        if(count == 1) {
            User.findOne({email: request.body.email}, function(err, user) {
                if(bcrypt.compareSync(request.body.password, user.password)) {
                    user.save(function(err) {
                        if(err) {
                            response.redirect('/');
                        }
                        else {
                            request.session.userId = user._id;
                            response.redirect('success');
                        }
                    })
                }
                else {
                    response.redirect('success')
                }
            })
        }
        else {
            response.redirect('/')
        }
    })
})
app.post('/users', function (req, res) {
    User.countDocuments({ email: req.body.email, password: req.body.password }, (err, count) => {
        if(count == 0){
            //set hash password and create instance of user
            let hashpw = bcrypt.hashSync(req.body.password, 10);
            var user = new User({firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email, birthday: req.body.birthday, password: hashpw});

            user.save(function (err) {
                if (err) {
                    // if there is an error upon saving, use console.log to see what is in the err object 
                    console.log("We have an error!", err);
                    // adjust the code below as needed to create a flash message with the tag and content you would like
                    for (var key in err.errors) {
                        req.flash('registration', err.errors[key].message);
                    }
                    // redirect the user to an appropriate route
                    res.redirect('/');
                }
                else {
                    req.session.userId = user._id;
                    req.session.email = user.email;
                    res.redirect('/success');
                }
            });

        }
        else {
            res.redirect('/')
        }

    })

});
app.get('/success', function (request, response) {
    if(request.session.userId) {
        response.render('success');
    }
    else{
        response.redirect('/');
    }
    
})
// tell the express app to listen on port 8000, always put this at the end of your server.js file
app.listen(8000, function () {
    console.log("listening on port 8000");
})