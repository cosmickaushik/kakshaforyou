let middleware = {};

middleware.isLoggedIn = function(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		// req.flash("error","You need to be Logged in to do that!");
		res.redirect("/login");
	}
}

// async      = require("async"),
//       nodemailer = require("nodemailer"),
//       crypto     = require("crypto");



module.exports = middleware;


router.post("/forgot",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20,function(err,buffer){
				let token = buffer.toString("hex");
				done(err,token);
			});
		},
		function(token,done){
			User.findOne({email: req.body.email.toLowerCase()},function(err,user){
				if(!user){
					req.flash("error","No account with that email address is registered!");
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
					user: "aayushmansharma.1999@gmail.com",
					pass: process.env.GMAILPW
				}
			});

			let mailOptions = {
				to: user.email,
				from: "aayushmansharma.1999@gmail.com",
				subject: "La Vagabond - Password Reset",
				text: "This is to inform you that you (or someone else) have requested a password reset for your account on La Vagabond."
				       + "\n\n" + "To reset the password, click on the following link, or paste the link in your browser"
				       + "\n\n" + "http://" + req.headers.host + "/reset/" + token
				       + "\n\n" + "The above link is set to expire in 1 hour."
				       + "\n\n" + "If you did not request this password reset, kindly ignore this mail."
			};

			ourMailer.sendMail(mailOptions,function(err){
				console.log("Mail Sent");
				req.flash("success","An e-mail has been sent to " + user.email + " with further instructions.");
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

router.get("/reset/:token",function(req,res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },function(err,user){
		if(!user){
			req.flash("error","Password reset link is invalid or has expired!");
			res.redirect("/forgot");
		}
		else{
			res.render("reset",{token: req.params.token, user: user});
		}
	});
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset link is invalid or has expired!');
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
            req.flash("error", "Passwords do not match.");
            return res.redirect('/reset/'+req.params.token);
        }
      });
    },
    function(user, done) {
      let ourMailer = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'aayushmansharma.1999@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      let mailOptions = {
        to: user.email,
        from: 'aayushmansharma.1999@gmail.com',
        subject: 'La Vagabond - Password changed successfully',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      ourMailer.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
  	req.flash("success","Welcome to La Vagabond, "+ user.username);
    res.redirect('/resorts');
  });
});


<%- include("partials/header") %>

<div class="container">
	<div class="row" style="margin: 0 auto; width: 30%;">
		<legend class="text-center">Reset Password for <strong><em><%= user.username %></strong></em></legend>
		<div class="col-md-12">
			<form action="/reset/<%= token %>" method="POST">
				<div class="form-group">
					<label>New Password</label>
					<input type="password" name="password" class="form-control" autofocus placeholder="enter new password" required>
				</div>
				<div class="form-group">
					<label>Confirm Password</label>
					<input type="password" name="confirm" class="form-control" placeholder="confirm new password" required>
				</div>
				<div class="form-group">
					<input type="submit" value="Update Password" class="btn btn-primary btn-block">
				</div>
			</form>
			<a href="/forgot">Go back</a>
		</div>
	</div>
</div>



<%- include("partials/footer") %></div>



<%- include("partials/header") %>

<div class="container">
	<legend class="text-center">Forgot Password</legend>
	<div class="row" style="margin: 0 auto; width: 30%;">
		<div class="col-md-12">
			<form action="/forgot" method="POST">				
				<div class="form-group">
					<label>Email:</label>
					<input type="email" name="email" class="form-control" autofocus required placeholder="email">
				</div>
				<div class="form-group">
					<input type="submit" value="Reset Password" class="btn btn-primary btn-block">
				</div>
			</form>
			<a href="/login" class="pull-left">Go back</a>
		</div>
	</div>
</div>

<%- include("partials/footer") %></div>