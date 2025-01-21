const express = require('express');
const app = express();
const router=express.Router()
require('dotenv').config()
let mongourl=process.env.uri
const port = 3000;
const path = require('path');
const methodOverride = require('method-override')
const {storage} = require('./cloudconfig');
const multer = require('multer');
const upload = multer({ storage });
const mongostore=require('connect-mongo')
const session=require('express-session')
const cookieparser=require('cookie-parser')
const flash=require('connect-flash')
const mongoose=require('mongoose')
const passport=require('passport')
const localstrategy = require('passport-local').Strategy;
let user=require("./models/user.js")
let listings=require("./models/listing.js")
let review=require("./models/review.js");
const listingschjoi=require('./schemajoi.js')
main().then(()=>{
    console.log('done');
}).catch((err)=>{
    console.log(err);
})
async function main() {
    await mongoose.connect(mongourl);
}

const store=mongostore.create({
    mongoUrl:mongourl,
    secret:process.env.secret,
    touchAfter:24*3600
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({store,secret:process.env.secret,saveUninitialized:true,resave:false,cookie:{secure: false}}))
app.use(passport.session())
app.use(cookieparser())
app.use(passport.initialize())
passport.use(new localstrategy(user.authenticate()))
passport.serializeUser(user.serializeUser())
passport.deserializeUser(user.deserializeUser())
app.use(flash())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.locals.any=req.session.any
    res.locals.currentuser=req.user
    res.locals.success = req.flash("success");
    res.locals.fail = req.flash("fail")
    next(); 
});
app.use('/', router)


//middlewares---------------------------------------------------------------------------------------------------------------------------------

let ifauth=(req,res,next)=>{
    if (!req.isAuthenticated()) {
        req.session.any=req.originalUrl;
        req.flash("fail","Login First!!!");
        res.redirect("/listings/login");
    } else {
       next();
    }
}

let ifownlist=async (req,res,next)=>{
    let {id}=req.params;
    let x=await listings.findById(id).populate("owner");
    if (req.user && req.user.username===x.owner.username){
         next()
    } else {
        req.flash("fail","You Aren't The Owner!!!");
        return res.redirect(`/listings/${id}`);
    }
}

let ifownreview=async (req,res,next)=>{
    let {id,rid}=req.params;
    let x=await review.findById(rid);
    if (req.user && req.user.username===x.author){
       return  next();
    } else {
        req.flash("fail","You Aren't The Owner!!!");
        res.redirect(`/listings/${id}`);
    }
}

//------------------------------------------------------------------------------------------------------------------------------




app.listen(port, () => {
console.log(`http://localhost:${port}/listings`)});



app.get("/",(req,res)=>{
    res.render("home.ejs")
})

//start---------------------------------------------------------
app.get("/listings",async(req,res,next)=>{
    try{let alllistings = await listings.find()
    res.render("index.ejs",{alllistings})}catch(err){
        next(err)
    }
}) 
//----------------------------------------------------------------------------


//sign up---------------------------------------------------------------------------
router.route("/listings/signup")
.get((req,res)=>{
    res.render("signup.ejs")
})
.post(async (req,res,next)=>{
   try{ let {username,email,password}=req.body
    let x= new user({username,email,password})
    await user.register(x,password)
    req.logIn(x,(err)=>{
        if (err) {
            next(err)
        } else {
            req.flash("success","Welcome to Wanderlust!!!")
            res.redirect("/listings")
        }
    })
   }catch(err){
        req.flash("fail",err.message)
        res.redirect("/listings/signup")
    }
})
//-------------------------------------------------------------------------------------------





//new -------------------------------------------------------------------------------------
router.route("/listings/new")
.get(ifauth,(req,res)=>{
    res.render("new.ejs")
    
})
.post(upload.single('image'),async (req,res,next)=>{
    try {let {title,description,price,location,country,category}=req.body
    let image=req.file.path
    let result=listingschjoi.validate(req.body)
    if(result.error){
        throw new Error(result.error)
    }    
     let owner=req.user.id
     let x= new listings({title,description,image,price,location,country,owner,category})    
     await x.save()
     req.flash("success","New Listing Added!!!")
     res.redirect("/listings")
     
     }catch(err){
         next(err)
     }
 })
//-----------------------------------------------------------------------------------


//search-----------------------------------------------------------------------------------------------------------
app.get("/listings/explore",async(req,res)=>{
    let {search}=req.query
    if (search) {
        let lowerSearch = search.trim().toLowerCase();
       let all = await listings.find()
    let alllistings=all.filter((ele)=>{
        return (
            ele.location.trim().toLowerCase().includes(lowerSearch) ||
            ele.country.trim().toLowerCase().includes(lowerSearch) ||
            ele.title.trim().toLowerCase().includes(lowerSearch) ||
            ele.category===lowerSearch ||
            search  >=ele.price
        );
      })
      if (alllistings.length===0) {
        req.flash("fail","No Results!!!")
        res.redirect("/listings")
      }
    res.render('index.ejs',{alllistings}) 
    }else{
        req.flash("fail","Enter Something!!!")
        res.redirect("/listings")
    }
    
})
//-----------------------------------------------------------------------------------------------------------------------


//login--------------------------------------------------------------------------------------------
router.route("/listings/login")
.get((req,res)=>{  
    res.render("login.ejs")
})
.post( passport.authenticate("local",{failureRedirect:"/listings/login",failureFlash: true}),
        (req,res)=>{
                  req.flash("success", "Welcome Back To Wanderlust!!!"); 
                    res.redirect(res.locals.any|| "/listings"); } 
    )
//----------------------------------------------------------------------------------------------------


//logout----------------------------------------------------------------------------------------
app.get("/logout",(req,res,next)=>{
    req.logOut((err)=>{
        if (err) {
           next(err) 
        } else {
           req.flash("success","Logged Out!!!")
           res.redirect("/listings") 
        }
    })
})
//----------------------------------------------------------------------------------------------------




//each--------------------------------------------------------------------------------------
app.get("/listings/:id",async(req,res,next)=>{  
    try{let {id}=req.params
    let x=await listings.findById(id).populate("reviews").populate("owner")
    if (!x) {
        req.flash("fail","No Such Listing Exists!!!")
        res.redirect("/listings")
    }
    let y =x.owner
    res.render("each.ejs",{x,y} )   
    
}catch(err){next(err)}})
   
    

//-----------------------------------------------------------------------------------------




//edit-------------------------------------------------------------------------------
router.route("/listings/:id/edit")
.get(ifauth,ifownlist,async(req,res,next)=>{
    try{ 
    let {id}=req.params
    let x=await listings.findById(id)
    res.render("edit.ejs",{x})
}catch(err){next(err)}

})
.put(upload.single('image'),async (req,res,next)=>{
   try{ let {id}=req.params
    let {title,description,image,price,category,location,country}=req.body
    if (req.file) {
     image=req.file.path
   }
   let result=listingschjoi.validate(req.body)
    if(result.error){
        throw new Error(result.error)
    }
    await listings.findByIdAndUpdate(id,{title,description,image,price,location,country,category})
    req.flash("success","Listing Edited!!!")
    res.redirect("/listings")}catch(err){
        next(err)
    }
})
//-----------------------------------------------------------------------------------------------------






//delete-------------------------------------------------------------------------------------



app.delete("/listings/:id",ifownlist,async(req,res)=>{
   let {id}=req.params
    await listings.findByIdAndDelete(id)
    req.flash("success","Listing Deleted!!!")
    res.redirect("/listings")})
//-----------------------------------------------------------------------------------------------------






//review-------------------------------------------------------------------------------------------------
router.route("/listings/:id/reviews")
.get((req,res)=>{
    let {id}=req.params
    res.redirect(`/listings/${id}`)
})
.post(ifauth,async (req,res,next)=>{
    try{ let {id}=req.params
         let {rating,comment}=req.body
         let author=req.user.username   
     let each = await listings.findById(id) 
     let x=  new review({rating,comment,author})
     each.reviews.push(x)
     await x.save()
     await each.save()
     req.flash("success","Review Added!!!")
     res.redirect(`/listings/${id}`)}catch(err){
         next(err)
     }
 })
 
app.delete("/listings/:id/reviews/:rid",ifownreview,async (req,res)=>{
        let {id,rid}=req.params
         await listings.findByIdAndUpdate(id,{$pull:{reviews:rid}})
            await review.findByIdAndDelete(rid)
            req.flash("success","Review Deleted!!!")
         res.redirect(`/listings/${id}`)}
        
)

//-------------------------------------------------------------------------------------------------------





//others-------------------------------------------------------------------------------

app.all("*",(req,res,next)=>{
    next( new Error("Page not found!!!"))
})

app.use((err,req,res,next)=>{
    let{status=500,message="error"}=err
    res.status(status).render("error.ejs",{message})
})








