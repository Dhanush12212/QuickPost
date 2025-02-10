const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const userModel = require("./models/user"); 
const postModel = require("./models/post");
const jwt = require("jsonwebtoken");
const upload = require('./config/multerconfig');
const path = require("path"); 
const dotenv = require("dotenv");
dotenv.config();

app.use(cookieParser())
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
 
app.get("/", (req,res)=>{ 
    res.render("register");
});

app.post("/register", async(req,res)=>{
    let {username,email,password} =req.body;
    let user = await userModel.findOne({email})

    if(user)
        return res.status(500).send("Something went wrong!");
        
    bcrypt.genSalt(10,  (err, salt) => {
        bcrypt.hash(password, salt,  async(err, hash) => {  
            let user = await userModel.create({
                username,  
                email,
                password:hash,
            });
            let token = jwt.sign({email:email, userId:user._id}, "secret");
            res.cookie("token", token);
            res.send("Registered");
        });
    });   
    res.redirect('/profile');
});

app.get("/login", (req,res) => {
    res.render("login");
})

app.post("/login", async(req,res) => {
    let {email,password} = req.body;
    let user = await userModel.findOne({email});
    if(!user)
        return res.status(500).send("Something went wrong");

    bcrypt.compare(password,user.password, (err,result) =>  {
        if(result) 
        {
            let token = jwt.sign({email:email, userId:user._id}, "secret");
            res.cookie("token", token); 
        }
        else
            res.redirect('/login');
        console.log(err);
        res.redirect('/profile');
    });
})

app.get("/logout", (req,res) => {
    res.cookie("token" ,"");
    res.redirect("/login");
})

app.get("/profile", isLoggedIn, async(req,res) => {
    let user = await userModel.findOne({email:req.user.email}).populate("posts");
    res.render("profile", {user}); 
})

app.post('/post',isLoggedIn ,upload.single('image'), async(req,res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {title,content} = req.body;
    
    let post = await postModel.create({
        user:user._id,
        title,
        content,
        image:req.file.filename
    })  
    user.posts.push(post._id);
    await user.save();  
    res.redirect('/profile')
})

app.get("/delete/:id", isLoggedIn, async(req,res) => {
    let post = await postModel.findOneAndDelete({_id: req.params.id}); 
    res.redirect("/profile"); 
})

app.get("/edit/:id", isLoggedIn, async(req,res) => {
    let post = await postModel.findOne({_id: req.params.id});
    res.render("edit", {post});
})

app.post("/update/:id", upload.single('image'), isLoggedIn, async(req,res) => { 
    let {title,content} = req.body; 
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{title,content},{new:true}); 
    if (req.file) {
        post.image = req.file.filename;
    }
    await post.save();
    res.redirect("/profile"); 
}) 

function isLoggedIn(req,res,next) {
    try {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
    } catch (err) {
        return res.redirect("/login");
    } 
    next();
}

const connectDB = () => {
    mongoose.set("strictQuery", true);
    mongoose
      .connect(process.env.MONGODB_URL)
      .then(() => console.log("Connected to Mongo DB"))
      .catch((err) => {
        console.error("failed to connect with mongo");
        console.error(err);
      });
  };
  
  const startServer = async () => {
    try {
      connectDB();
      app.listen(8080, () => console.log("Server started on port 8080"));
    } catch (error) {
      console.log(error);
    }
  };
  
  
  startServer();