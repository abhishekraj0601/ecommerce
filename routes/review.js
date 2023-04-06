var mongoose = require("mongoose")

var reviewSchema = new mongoose.Schema({
    userid:[{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    productid:[{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }],
    review:String
},{
    timestamps:true
})
module.exports = mongoose.model("review" , reviewSchema);
