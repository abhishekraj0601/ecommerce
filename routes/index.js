var express = require('express');
var router = express.Router();
var passport = require("passport")
var path = require("path")
var crypto = require("crypto")
var userModel = require("./users")
var orderModel = require("./orders")
var productModel = require("./product")
var reviewModel = require("./review")
const nodemailer = require('../nodemailer');
const Razorpay = require('razorpay');
var multer = require("multer")
require('dotenv').config()
var LocalStrategy = require('passport-local');
var GoogleStrategy = require('passport-google-oidc');
passport.use(new LocalStrategy(userModel.authenticate()));
// ----------------------------------------------------

// ---------------------oauth---------------------------------

router.get('/login/federated/google', passport.authenticate('google'));

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'email','profile' ]
}, function verify(issuer, profile, cb) {
 userModel.findOne({username:profile.emails[0].value}).then(function(user){
  if(user){
    return cb(null,user)
  }else{
    var data = new userModel({
      username:profile.emails[0].value,
      fullname:profile.displayName
     })
     userModel.register(data, "1234").then(function(newuser){
      return cb(null,newuser)
     })
  }
 })
}));
router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

// ---------------------------------razor pay---------------------------------------------------

var instance = new Razorpay({
  key_id: 'rzp_test_kNNGbyOiNhCZYG',
  key_secret: 'gyCm1M4HZSoAZRBAj2MquIut',
});
router.post('/create/orderId/:price',function(req,res){
  var options = {
    amount: req.params.price * 100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, function(err, order) {
    // console.log(order);
    if(err){
      throw err
    }else{
      res.send(order);
    }
  });
})
router.post("/api/payment/verify",(req,res)=>{

  let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
 
   var crypto = require("crypto");
   var expectedSignature = crypto.createHmac('sha256', 'gyCm1M4HZSoAZRBAj2MquIut')
                                   .update(body.toString())
                                   .digest('hex');
                                  //  console.log("sig received " ,req.body.response.razorpay_signature);
                                  //  console.log("sig generated " ,expectedSignature);
   var response = {"signatureIsValid":"false"}
   if(expectedSignature === req.body.response.razorpay_signature)
    response={"signatureIsValid":"true"}
       res.send(response);
});


// ---------------------------------------------------



// -multer---------

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
   crypto.randomBytes(13, function(err,buffer){
  var fn =  buffer.toString("hex") + path.extname(file.originalname);
  cb(null, fn)
   })
  }
})

const upload = multer({ storage :storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
 });
 

/* GET home page. */
router.get('/', function(req, res, next) {
  productModel.find().then(function(product){
      res.render('index', {user: req.user, isLoggedIn: req.isLogged ,product ,title:"home"});
  })
});

router.get("/buy",isLoggedin ,function(req,res){
  res.redirect("back")
})
// ------------------axios

router.get("/check/:username",async function(req,res){
 var user = await userModel.findOne({$or:[{"username":req.params.username},{"email":req.params.username},{"number":req.params.username}]})
res.json(user)
})

//  -------------------------------------
router.get('/account',isLoggedin, function(req, res, next) {
  userModel.findOne({username:req.session.passport.user}).then(function(loginuser){
    res.render('account', {user: req.user, isLoggedIn: req.isLogged,title:"account" ,loginuser});
})});

router.get('/contact', function(req, res, next) {
  res.render('contact', {user: req.user, isLoggedIn: req.isLogged ,title:"contact"});
});

router.get('/about', function(req, res, next) {
  res.render('about', {user: req.user, isLoggedIn: req.isLogged ,title:"about"});
});

router.get('/address',isLoggedin, function(req, res, next) {
  userModel.findOne({username:req.session.passport.user}).then(function(loginuser){
    res.render('address', {user: req.user, isLoggedIn: req.isLogged,title:"address" ,loginuser});
  })
});

router.get('/cart',isLoggedin, function(req, res, next) {
  userModel.findOne({username:req.session.passport.user})
  .populate({
    path:"cart",
    populate: {
      path: "userid" // in blogs, populate comments
  }
  })
  .then(async function(loginuser){
    const carts = await productModel.find({_id:loginuser.cart});
    // Sum up the cart prices using the reduce method
    const totalPrice = carts.reduce((acc, cart) => acc + cart.price, 0);
    res.render('cart', {user: req.user, isLoggedIn: req.isLogged,title:"cart" ,loginuser,totalPrice});
  })

});

router.get('/view/:id', function(req, res) {
  var id = req.params.id;
  productModel.findOne({_id:id})
  .populate({
    path:"reviewid",
    populate:{
      path:"userid"
    }
  })
  .then(function(product){
    res.render('productview', {user: req.user,title:"view" ,product});
    // res.send(product)
  })
});

router.get("/cart/:id",isLoggedin,function(req,res,next){
  userModel.findOne({username:req.session.passport.user}).then(function(loginuser){
    if (loginuser.cart.indexOf(req.params.id) == -1) {
      loginuser.cart.push(req.params.id)
    }else{
      loginuser.cart.splice(loginuser.cart.indexOf(req.params.id),1)
    }
    loginuser.save().then(function(){
      res.redirect("back")
    })
  })
})

router.get("/order",isLoggedin,function(req,res,next){
  userModel.findOne({username:req.session.passport.user})
  .populate({
    path:"buyed",
    populate:{
      path:"productid"
    }
  })
  .then(function(loginuser){
      res.render('order', {user: req.user,title:"order" ,loginuser});
  })
})

router.post("/userverify/:orderid/:userid/:productid",async function(req,res){
  var user = await userModel.findOne({_id:req.params.userid})
  var order = await orderModel.findOne({_id:req.params.orderid})
  var product = await productModel.findOne({_id:req.params.productid})
  if (order.userotp === req.body.orderotp) {
    order.deliverystatus ="deliverd";
    order.paymentstatus ="Success"
    await order.save()
    res.redirect("/orderlist")
  }else{
    res.send("not match")
  }
})

router.post("/buy/:id",isLoggedin,async function(req,res,next){
  var loginuser = await userModel.findOne({username:req.session.passport.user})
  var product = await productModel.findOne({_id:req.params.id})
  var address = {
    place:req.body.place,
    flate_no:req.body.flate,
    area:req.body.area,
    city:req.body.city,
    state:req.body.state,
    username:req.body.username,
    country:req.body.country,
    pincode:req.body.pincode,
    number:req.body.number
  }
    orderModel.create({
    price:product.price,
    paymentmode:req.body.paymentType,
    productid:req.params.id,
    userid:loginuser._id
  }).then(async function(order){
    var x =Math.random().toString().substr(2, 6); //6digit otp
    if(req.body.paymentType === "cod"){
      order.paymentstatus ="Pending"
    }else{
      order.paymentstatus ="Success"
    }
    order.deliverystatus ="approved"
    order.userotp =x
    product.orderId.push(order._id)
    order.address.push(address)
    loginuser.buyed.push(order._id)
    await order.save()
    await product.save()
    await loginuser.save()
    var email = loginuser.username;
    var html = `<p><strong>congratulation your order with </strong> <h4>ORDER ID : ${order._id}</h4>
    <h3>product : ${product.productname}</h3>
    <h3> Price : ${product.price}</h3>
    has been confirmed. please note down otp <strong>${x}</strong>. <br> and confirm at the time of delivey <br><br> <strong>Thank you </strong>
    </p> `;
    var subject = "order confirmation"
    // -------
    nodemailer(email,subject,html).then(function(){
      res.redirect("/order")
    })

  })
})

router.get('/login', isLoggedout,function(req, res, next) {
  res.render('login', {user: req.user, isLoggedIn: req.isLogged,title:"login"});
});

router.get('/forget', isLoggedout,function(req, res, next) {
  res.render('forget', {user: req.user, isLoggedIn: req.isLogged,title:"forget"});
});

router.get('/shop',async function(req, res, next) {
  var search = await productModel.find()
  var product = await productModel.find()
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})

    res.render('shop', {user: req.user, isLoggedIn: req.isLogged ,search, smartphone,laptop,computer ,product,title:"shop"});
});

router.get('/low',async function(req, res, next) {
  var search = await productModel.find()

  var product = await productModel.find().sort({price:1})
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})
  res.render('shop', {user: req.user, isLoggedIn: req.isLogged ,search,smartphone,laptop,computer,product,title:"low to high"});
});

router.get('/high',async function(req, res, next) {
    var search = await productModel.find()

  var product = await productModel.find().sort({price:-1})
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})
  res.render('shop', {user: req.user, isLoggedIn: req.isLogged,smartphone,search,laptop,computer ,product,title:"high to low"});
});

router.get('/smartphone',async function(req, res, next) {
  var search = await productModel.find()

  var product = await productModel.find({category:"smartphone"})
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})
    res.render('shop', {user: req.user, isLoggedIn: req.isLogged,search ,smartphone,laptop,computer,product,title:"smartphones"});
});

router.get('/laptop',async function(req, res, next) {
  var search = await productModel.find()

  var product = await productModel.find({category:"laptop"})
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})
    res.render('shop', {user: req.user, isLoggedIn: req.isLogged,search ,smartphone,laptop,computer,product,title:"laptops"});
});

router.get('/computer',async function(req, res, next) {
  var search = await productModel.find()

  var product = await productModel.find({category:"computer"})
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})
    res.render('shop', {user: req.user, isLoggedIn: req.isLogged,search ,smartphone,laptop,computer,product,title:"computers"});
});


router.get("/read",function(req,res){
  userModel.find().then(function(user){
    res.send(user)
  })
})

router.get("/reado",function(req,res){
  orderModel.find().then(function(user){
    res.send(user)
  })
})

router.get("/readr",function(req,res){
  reviewModel.find().then(function(user){
    res.send(user)
  })
})

router.get("/readp",function(req,res){
  productModel.find().then(function(user){
    res.send(user)
  })
})

router.post("/useraddress",isLoggedin,function(req,res){
  userModel.findOne({username:req.session.passport.user}).then(function(user){
    var address = {
      place:req.body.place,
      flate_no:req.body.flate,
      area:req.body.area,
      city:req.body.city,
      state:req.body.state,
      username:req.body.username,
      country:req.body.country,
      pincode:req.body.pincode,
      number:req.body.number
    }
    user.address.push(address)
    user.save().then(function(){
      res.redirect("back")
    })
  })
})
// ------------------------product---------------------
router.get('/sell', function(req, res, next) {
  productModel.find().then(function(product){
    res.render('sell', {user: req.user, isLoggedIn: req.isLogged,title:"sell" ,product});
  })
});

router.post("/sell",upload.array('filename', 5),function(req,res){
    productModel.create({
      username:req.body.username,
      productname:req.body.productname,
      price:req.body.price,
      category:req.body.category,
      photo:req.files,
      brand:req.body.brand,
    }).then(function(product){
          res.redirect("back")
       })
})

router.get("/sell/view/:id",function(req,res){
  orderModel.findOne({_id:req.params.id}).populate({
    path:"productid"
  }).then(function(product){
    res.render("sellview",{product})
  })
})

router.get("/orderlist",async function(req,res){
var orderlist = await orderModel.find({deliverystatus:"approved"}).populate({path:"productid"})
var deliverdlist = await orderModel.find({deliverystatus:"deliverd"}).populate({path:"productid"})
res.render("orderlist",{orderlist ,deliverdlist})
})

// ------------------------------------------------
router.post("/search",async function(req,res){
  var search = await productModel.find()

  var product = await productModel.find({$or:[{"productname":req.body.search},{"brand":req.body.search},{"category":req.body.search}]})
  var smartphone = await productModel.find({category:"smartphone"})
  var laptop = await productModel.find({category:"laptop"})
  var computer = await productModel.find({category:"computer"})
    res.render('shop', {user: req.user, isLoggedIn: req.isLogged ,search,smartphone,laptop,computer ,product,title:"search"});

})
// ----------------------update------------------------------
router.post("/updatephoto",upload.single('filename'),function(req,res){
  userModel.findOneAndUpdate({username:req.session.passport.user},{photo:req.file.filename}).then(function(){
    res.redirect("back")
  })
})

router.post("/updateuser",isLoggedin,function(req,res){
  userModel.findOneAndUpdate({username:req.session.passport.user},{fullname:req.body.fullname ,username:req.body.username , mobilenumber:req.body.number , gender:req.body.gender}).then(function(){
    res.redirect("back")
  })
})

// --------------------password-------------

router.get('/security',isLoggedin, function(req, res, next) {
  userModel.findOne({username:req.session.passport.user}).then(function(loginuser){
    res.render('security', {user: req.user, isLoggedIn: req.isLogged,title:"change password" ,loginuser});
  })
});

router.post("/changepassword",function(req,res){
  userModel.findOne({username:req.session.passport.user}).then(function(loginuser){
    if(req.body.newpassword !== req.body.confirmpassword){
      res.send("password not matched")
    }else{
      loginuser.changePassword(req.body.oldpassword, 
        req.body.newpassword, function(err) {
        if (err) {
          res.json(err.message)
        }else{
          res.redirect("back")
        }
      })
    }
   
  })
})

router.post("/forget",async function(req,res){
  var user = await userModel.findOne({$or:[{"mobilenumber":req.body.email},{"username":req.body.email}]})
  if(user){
    var x =Math.random().toString().substr(2, 6); //6digit otp
    user.otp = x;
    user.expiringtime = Date.now() + 300000;  //5mint
    await user.save()
    // --------nodemailer file
    var email = user.username;
    var subject = "password change request"
    var html = ` <p>  Please fill the following otp to reset your password.</p><h2> ${x} </h2>
    this link is valid only for 5 minuts.
    If you did not request this, please ignore this email and your password will remain unchanged. `;
    
    // -------
    nodemailer(email,subject,html).then(function(){
      res.render("otp",{user})
    })
  }else{
    res.send("user not found !")
  }
})

router.post("/forget/:id",async function(req,res){
  var user = await userModel.findOne({_id:req.params.id})
  if(user.otp !== req.body.otp){
   res.send("otp not matched")
  }else{
   if (req.body.password  !== req.body.confirmpassword) {
    res.send("password not matched")
   }else if (user.expiringtime > Date.now()) {
    user.setPassword(req.body.password, function(){
      user.expiringtime=null
      user.otp =null
      user.save();
      res.redirect('/login')
    });
   }else{
    res.send("otp expired")
   }
  }
})

router.get("/resendotp/:userid",async function(req,res) {
  var user = await userModel.findOne({_id:req.params.userid})
 
    var x =Math.random().toString().substr(2, 6); //6digit otp
    user.otp = x;
    user.expiringtime = Date.now() + 300000;  //5mint
    await user.save()
    // --------nodemailer file
    var email = user.username;
    var html = ` <p>  Please fill the following otp to reset your password.</p><h2> ${x} </h2>
    this link is valid only for 5 minuts.
    If you did not request this, please ignore this email and your password will remain unchanged `;
    var subject = "password change request"
    // -------
    nodemailer(email,subject,html).then(function(){
      res.json("otp sent")
    })
})

router.get("/orderotp/:orderid/:userid",async function(req,res) {
  var order = await orderModel.findOne({_id:req.params.orderid})
  var product = await productModel.findOne({_id:order.productid[0]})
 var user = await userModel.findOne({_id:req.params.userid})
    var x =Math.random().toString().substr(2, 6); //6digit otp
    order.userotp = x;
    await order.save()
    // --------nodemailer file
    var email = user.username;
    var html = ` <p>The verification otp for Your order </p><strong> ${order._id} </strong>
      <P> <strong>${product.productname }</strong>  <br> your otp is : <h2>${x}</h2></p>
    `;
    var subject = "order verification otp"
    // -------
    nodemailer(email,subject,html).then(function(){
      res.json("otp sent")
    })
})
// -----------------register-------------------

router.post("/register",async function(req,res){

  var x =await userModel.findOne({username:req.body.username})
  if(x){
    res.send("this user name is already taken")
  }else{
 var data = new userModel({
    username:req.body.username,
    fullname:req.body.fullname,
  })
  if (!req.body.password) {
    res.send("enter a password")
  }else if (req.body.password !== req.body.confirmpassword) {
    res.send("password not matched")
  }else{
    userModel.register(data,req.body.password).then(function(u){
      passport.authenticate('local')(req,res,function(){
        res.redirect("/")
      })
    })
  }
  }

 
})

// ---------------------login / logout--------------------

router.post("/login",function(req,res){
  if (!req.body.username) {
    res.redirect("back")
}
else if (!req.body.password) {
    res.redirect("back")}
else {
    passport.authenticate("local", {
      successRedirect:'back',
      failureRedirect:'back',
    })(req, res);
}
})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// ----------------------

router.post("/deactivateaccount",async function(req,res){
 var loginuser = await userModel.findOne({username:req.session.passport.user})

 if(loginuser.otp !== req.body.otp){
  res.send("otp not matched")
 }else{
   if (loginuser.expiringtime > Date.now()) {
    var review = await reviewModel.deleteMany({userid:req.params.userid})
   var order = await orderModel.deleteMany({userid:req.params.userid})
   var user =await userModel.findOneAndDelete({username:req.session.passport.user})
   if(req.body.lenght >0){
   var email = "codecrushers01@gmail.com"
   var subject = "deactivaion review"
   var html =`<p><strong>Reason</strong> ${req.body.reasion} <br> 
   <strong>other</strong> ${req.body.textarea}
   </p>`
   nodemailer(email,subject,html).then(function(){
     res.redirect("back")
   })
   }else{
    res.redirect("back")

   }
   }else{
    res.send("otp expired")
   }
 }

})

router.get("/deleteorder/:orderid/:productid",async function(req,res){
var user =await userModel.findOne({username:req.session.passport.user})
var product = await productModel.findOne({_id:req.params.productid})
var order = await orderModel.findOneAndDelete({_id:req.params.orderid})
product.orderId.splice(product.orderId.indexOf(req.params.productid),1)
user.buyed.splice(user.buyed.indexOf(req.params.orderid),1)
await user.save()
await product.save()
var email = "codecrushers01@gmail.com";
var html = ` <p><h5>ORDER ID : ${req.params.orderid}</h5> 
  <h3>product : ${product.productname}</h3>
  <h3>price: ${product.price}</h3>
  has been cencled.
</p>`;
var subject = "order cencle"
// -------
nodemailer(email,subject,html).then(function(){
  res.redirect("back")
})

 
})

router.get("/reviewdelete/:productid/:id",async function(req,res){
  var user = await userModel.findOne({username:req.session.passport.user})
 var review = await reviewModel.findOneAndDelete({_id:req.params.id})
 var product =await productModel.findOne({_id:req.params.productid})
 product.reviewid.splice(product.reviewid.indexOf(req.params.id),1)
 user.review.splice(user.review.indexOf(req.params.id),1)

await product.save()
await user.save()
res.redirect("back")
})

router.get("/productdelete/:id",async function(req,res){
  var order = await orderModel.find({productid:req.params.id})
  var user = await userModel.find({buyed:order._id})
 
  await orderModel.deleteMany({productid:req.params.id})
  await productModel.findOneAndDelete({_id:req.params.id})
  res.redirect("back")
})

router.get("/addressdelete/:indexof",isLoggedin,function(req,res){
  userModel.findOne({username:req.session.passport.user}).then(function(user){
    user.address.splice(user.address.indexOf(req.params.indexof),1)
      user.save().then(function(){
      res.redirect("back")
    })
  })
})

router.post("/message", function(req,res){
var name = req.body.username
var number = req.body.number
var email = req.body.email
var text = req.body.text

  var email =  "codecrushers01@gmail.com";
  var html = `<h2>Name </h2> ${name}
  <h2>Phone :</h2> ${number}
  <h2>Email :</h2> ${email}
  <h2>Message :</h2> <p> ${text}</p>
  `;
  var subject = "customer request"
  // -------
  nodemailer(email,subject,html).then(function(){
    res.redirect("back")
  })
})

router.post("/review/:productid",isLoggedin,async function(req,res){
var user = await userModel.findOne({username:req.session.passport.user})
var product =await productModel.findOne({_id:req.params.productid})
reviewModel.create({
  userid:user._id,
  productid:product._id,
  review:req.body.review
}).then(async function(review){
  product.reviewid.push(review._id)
  user.review.push(review._id)
  await product.save()
  await user.save()
  res.redirect("back")
})
})

router.get("/deactivate",async function(req,res){
  var user =await userModel.findOne({username:req.session.passport.user})
  var x =Math.random().toString().substr(2, 6); //6digit otp
  user.expiringtime = Date.now() + 300000;  //5mint
  user.otp = x
  await user.save()
  var email = user.username
  var subject = "account deactivation request"
  var html =`<p> your account deactivaion otp is <strong>${x}</strong>
  kindly fill this otp to deactivate your account .if you are not requested for this please ignore this email and your account remain activated</p>`
  nodemailer(email,subject,html).then(function(){
    res.json(user)
  })
})
// -----------------midelware-------------------

function isLoggedin(req,res,next){
  if(req.isAuthenticated()){
    req.isLogged = true
    return next();
  }else{
    res.redirect("/login")
  }
}

function isLoggedout(req,res,next){
  if(req.isAuthenticated() == false){
    return next();
  }else{
    res.redirect("/")
  }
}

module.exports = router;
