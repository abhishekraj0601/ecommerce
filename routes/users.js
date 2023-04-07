var mongoose = require("mongoose")
var passportLocalMongoose = require("passport-local-mongoose")
mongoose.connect("mongodb+srv://abhishekraj8685:EAde5oz8rHaKpYIP@cluster0.kggti8m.mongodb.net/user?retryWrites=true&w=majority")
.then(()=>{
  console.log("Database connected")
}).catch((err)=>{
  console.log(err)
})
var userSchema = new mongoose.Schema({
  username:{
    type:String,
    require:true,
    unique: true
  },
  email:{
    type:String,
    require:true
  },
  fullname:{
    type:String,
    require:true
  },
  gender:String,
  password:{
    type:String,
  },
  photo:{
    type:String,
    require:false,
    default:'../images/uploads/User_icon_2.svg.png'
  },
  mobilenumber:{
    type:String,
  },
  address:{
    type:Array,
    default:[]
  },
  expiringtime:String,
  otp:String,
  review:[{ type:mongoose.Schema.Types.ObjectId,ref:"review"}],

  cart:[{ type:mongoose.Schema.Types.ObjectId,ref:"product"}],
  buyed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'order' }]

},{
 timestamps: true 
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("user", userSchema);
