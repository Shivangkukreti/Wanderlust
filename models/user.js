const mongoose=require('mongoose')
const Schema=mongoose.Schema
const passportlocalmongoose=require('passport-local-mongoose')

main().then(()=>{
  console.log('done');
}).catch((err)=>{
  console.log(err);
})


async function main() {
  
}


let usersch=new Schema({
    email:{type:String,
        required: true}
})

usersch.plugin(passportlocalmongoose)

let user=mongoose.model("user",usersch)

module.exports=user










