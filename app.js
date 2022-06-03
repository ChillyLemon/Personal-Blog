require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const homeStartingContent = "This is a personal blog site which was created in order to maintain a record of my workout routine: how my performance varies day by day, whether it improves or plateaus. This will also aid in getting in the habit of working out.";

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({   // Keep this line of code above mongoose.connect()
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.URL,{useNewUrlParser: true});

const postSchema = mongoose.Schema({
  postHead: String,
  postContent: String
});

const Post = mongoose.model('Post',postSchema);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User',userSchema);

passport.use(User.createStrategy());

passport.serializeUser((User, done)=> {
  done(null, User);
});

passport.deserializeUser((User, done)=> {
  done(null, User);
});

app.get('/',(req,res)=>{
  Post.find((err,foundPost)=>{
    if(!err)
      res.render('home',{
        homeContent: homeStartingContent,
        postsArr: foundPost
      });
  })
});

app.get('/about',(req,res)=>{
  res.render('about');
});

app.get('/contact',(req,res)=>{
  res.render('contact');
});

app.get("/compose",(req,res)=>{
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0');
  if (req.isAuthenticated()){
      res.render('compose');
  } else {
      res.redirect("/login");
  }
})

app.get('/login',(req,res)=>{
  res.render('login');
});

app.get("/logout",(req,res)=>{
  req.logout((err)=>{     // Updated usage
      if (err)
          console.log(err);
      else
          res.redirect("/");
  });
});

app.get('/posts/:path',(req,res)=>{ 
  const postId = req.params.path;
  
  Post.findOne({_id: postId},(err,foundPost)=>{
    if(!err){
      if (req.isAuthenticated()){
        res.render('post-del',{
          eId: foundPost._id,
          eTitle: foundPost.postHead,
          eBody: foundPost.postContent
      });
    } else {
      res.render('post',{
        eId: foundPost._id,
        eTitle: foundPost.postHead,
        eBody: foundPost.postContent
    });
    }  
    }
  });
});

app.get('/delete/:path',(req,res)=>{ 
  const postId = req.params.path;

  Post.findByIdAndRemove(postId,(err)=>{
    if(!err){
        res.redirect("/");
    }
  });
});

app.post('/compose',(req,res)=>{
  const post = new Post({
    postHead: req.body.postTitle,
    postContent: req.body.postBody
  });
  post.save(()=>{
    res.redirect('/');
  });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/compose',
  failureRedirect: '/login' 
}));

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});