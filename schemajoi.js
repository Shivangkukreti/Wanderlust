const joi =require('joi')


let listingschjoi=joi.object({
    title:joi.string().required(),
    description:joi.string().required(),
    image:joi.string(),
    price:joi.number().positive().required(),
    location:joi.string().required(),
    country:joi.string().required(),
    category:joi.string().required(),
})

module.exports=listingschjoi