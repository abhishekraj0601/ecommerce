var mongoose = require("mongoose")


var orderSchema = mongoose.Schema({
    address:{
        type:Array,
        default:[]
    },
    payment:String,
    productid: [{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }],
    userid: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
    },{
      timestamps:true
    })

    module.exports = mongoose.model("order" , orderSchema);
