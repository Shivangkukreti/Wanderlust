const mongoose=require('mongoose')
const Schema=mongoose.Schema




let reviewsch= new Schema({
    comment:
    {type:String,required: true},
    rating:{
        type:Number,
        required: true,
        min:1,
        max:5,
    },
    createdat:{
        type:Date,
        default: Date.now()
    },
    author:{
      type:Schema.Types.String,
      ref:"user"
    }
})

let review=mongoose.model("review",reviewsch)
module.exports=review

