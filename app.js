const express=require("express");
const bodyparser=require("body-parser");
const app=express();
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");	  
const mongoose = require("mongoose");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto     = require("crypto");
// const middleware = require("/middleware");


app.use(bodyparser.urlencoded({extended:true}));
 
app.use(express.static(__dirname + '/public'));
app.set("view engine","ejs");

app.use(require("express-session")({
	secret: "Gaurav",
	resave: false,
	saveUninitialized: false
}));


// //////////////////////////////////////////////////////////////////////////////////////////////////




const URI ='mongodb+srv://aquapogue:ruchi2711@kakshaforyou.lpm3a.mongodb.net/<dbname>?retryWrites=true&w=majority';


mongoose.connect(URI  , {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to apni_kaksha Database!'))
.catch(error => console.log(error.message));

// var obj = { name: "John", age: 30, city: "New York" };
// var myJSON = JSON.stringify(obj);

var feedbackSchema = new mongoose.Schema({
	name: String,
 
	feedback: String
});

var Feedback = mongoose.model("Feedback",feedbackSchema);


var linkSchema=new mongoose.Schema({
    name: String,
    subject: String,
    class: Number,
    time: String,
    classlink: String
});
var modellink =mongoose.model("modellink",linkSchema);

let userSchema = new mongoose.Schema({
	password: String,
	username: {type: String, unique: true, required: true},
	name : String,
	age: Number,
	std: Number,
	contact: Number,
	resetPasswordToken: String,
	resetPasswordExpires: Date
	
});

userSchema.plugin(passportLocalMongoose);

let User = mongoose.model("User",userSchema);

app.use(passport.initialize());
app.use(passport.session());
 passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		// req.flash("error","You need to be Logged in to do that!");
		//alert("You need to be Logged in to do that!");
		res.redirect("/login");
	}
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
 

app.post("/index",function(req,res){
	 
	res.redirect("/index");
});

app.post("/tutor",isLoggedIn,function(req,res){
    var name = req.body.name;
	var subject = req.body.subject;
    var standard = req.body.class;
    var time = req.body.time;
    var classlink =req.body.url;
    
	let obj = {
		name: name,
		subject: subject,
        class: standard,
        
        time:time,
        classlink:classlink,

    }
    modellink.create(obj,function(err,values){
		if(err){
			console.log(err);
		}
		else{
			console.log(classlink);
		}
	});
	 
	res.redirect("/tutor");
});
app.post("/student",isLoggedIn,function(req,res){
     
    var name = req.body.name;
 
	var feedback = req.body.feedback;
	let feedbackpush = {
		name: name,
	 
		feedback: feedback
	}
	Feedback.create(feedbackpush,function(err,feedback){
		if(err){
			console.log(err);
		}
		else{
			console.log(feedback);
		}
	});
	res.redirect("/student");
});


app.post("/admin",isLoggedIn,function(req,res){
	 
	res.redirect("/admin");
});
app.post("/about-us" ,function(req,res){
	 
	res.redirect("/about-us");
});
app.post("/terms" ,function(req,res){
	 
	res.redirect("/terms");
});


app.post('/reset/:token', function(req, res) {
	async.waterfall([
	  function(done) {
		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		  if (!user) {
		   // req.flash('error', 'Password reset link is invalid or has expired!');
		   console.log("ss");
			return res.redirect('/forgot');
		  }
		  if(req.body.password === req.body.confirm) {
			user.setPassword(req.body.password, function(err) {
			  user.resetPasswordToken = undefined;
			  user.resetPasswordExpires = undefined;
  
			  user.save(function(err) {
				req.logIn(user, function(err) {
				  done(err, user);
				});
			  });
			})
		  } else {
			//  req.flash("error", "Passwords do not match.");
			  return res.redirect('/reset/'+req.params.token);
		  }
		});
	  },
	  function(user, done) {
		let ourMailer = nodemailer.createTransport({
		  service: 'Gmail', 
		  auth: {
			user: ' kakshaforyou@gmail.com',
			pass: ruchi2711
		  }
		});
		let mailOptions = {
		  to: user.email,
		  from: 'kakshaforyou@gmail.com',
		  subject: 'kakshaforyou - Password changed successfully',
		  text: 'Hello,\n\n' +
			'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
		};
		ourMailer.sendMail(mailOptions, function(err) {
		//  req.flash('success', 'Success! Your password has been changed.');
		  done(err);
		});
	  }
	], function(err) {
	//	req.flash("success","Welcome to La Vagabond, "+ user.username);
	  res.redirect('/index');
	});
  });
app.post("/forgot",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20,function(err,buffer){
				let token = buffer.toString("hex");
				done(err,token);
			});
		},
		function(token,done){
			User.findOne({username: req.body.email },function(err,user){
				if(!user){
					 
					res.redirect("/forgot");
				}
				else{
					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000;

					user.save(function(err){
						done(err,token,user);
					});
				}
			});
		},
		function(token,user,done){
			let ourMailer = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: "kakshaforyou@gmail.com",
					pass:  "ruchi2711"
				}
			});

			let mailOptions = {
				to: user.username,
				from: "kakshaforyou@gmail.com",
				subject: "kakshaforyou - Password Reset",
				text: "This is to inform you that you (or someone else) have requested a password reset for your account on kakshaforyou."
				       + "\n\n" + "To reset the password, click on the following link, or paste the link in your browser"
				       + "\n\n" + "http://" + req.headers.host + "/reset/" + token
				       + "\n\n" + "The above link is set to expire in 1 hour."
				       + "\n\n" + "If you did not request this password reset, kindly ignore this mail."
			};

			ourMailer.sendMail(mailOptions,function(err){
				console.log("Mail Sent");
				//req.flash("success","An e-mail has been sent to " + user.email + " with further instructions.");
				done(err,"done");
			});
		}
	],function(err){
		if(err){
			return next(err);
		}
		else{
			res.redirect("/forgot");
		}
	});
});


	// REGISTER
	app.get("/register",(req,res)=>{
		res.render("register");
	});
	
	app.post("/register",(req,res)=>{
		
		let newUser = new User({username: req.body.username,name: req.body.name,age: req.body.age,std: req.body.class,contact: req.body.number});
		User.register(newUser,req.body.password,(err,user)=>{
			if(err){
				console.log(err);
			}
			else{
				 
				res.redirect("/login");
				 
			}
		});
	});
	
	

//////////////////////////////////////////////////////////////////////////////////////////////////
 


app.post("/login",passport.authenticate("local",{successRedirect: "/student", failureRedirect: "/login"}),(req,res)=>{
		
});


app.get("/login",function(req,res){

    res.render("login");
});

	//LOGOUT
	app.get("/logout",(req,res)=>{
		req.logout();
		res.redirect("/index");
	});

app.get("/admin",isLoggedIn,function(req,res){
    Feedback.find({},function(err,allfeedbacks){
		if(err){
			console.log(err);
        }
        else{
			User.find({},function(err,all){
				if(err){
					console.log(err);
				}
				else{
					res.render("admin",{feed: allfeedbacks , dataa:all});
        }
				
			});
		}
        
    });
    
});
 
app.get("/",function(req,res){
    res.render("index");
});
app.get("/index",function(req,res){
    res.render("index");
});
app.get("/terms",function(req,res){
    res.render("terms");
});

app.get("/tutor",isLoggedIn,function(req,res){

    res.render("tutor");
});
app.get("/student",isLoggedIn,function(req,res){
	modellink.find({},function(err,alllink){
		if(err){
			console.log(err);
        }
        else{
            res.render("student",{data: alllink});
        }
    });

  
});

app.get("/reset/:token",function(req,res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },function(err,user){
		if(!user){
		//	req.flash("error","Password reset link is invalid or has expired!");
		console.log(err);
			res.redirect("/forgot");
		}
		else{
			res.render("reset",{token: req.params.token, user: user});
		}
	});
});
app.get("/forgot", function(req,res){
    res.render("forgot");
});
app.get("/about-us", function(req,res){
    res.render("about-us");
});


app.listen("3000",function()
{
	console.log("Server started at Port 3000");

});