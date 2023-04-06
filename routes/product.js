var mongoose = require("mongoose")


var propertySchema = mongoose.Schema({
    price:{
      type:Number,
      require:true
    },
    photo:{
      type:Array,
      default:[]
    },
    orderId:[{type: mongoose.Schema.Types.ObjectId, ref:'order'}],
    username:String,
    productname:String,
    category:String,
    brand:String,
    reviewid: [{ type: mongoose.Schema.Types.ObjectId, ref: 'review' }]
    },{
      timestamps:true
    })

    module.exports = mongoose.model("product" , propertySchema);
