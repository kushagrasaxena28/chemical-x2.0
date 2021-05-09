

// start of file


require('dotenv').config();
const option  ="start";
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const request = require("request");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const _ = require("lodash");

const rxl = require("routexl-client")({
    username: 'Kucumber',
    password: '12345'
  });

const FBO_OIL_RATE_PER_LITRE_UPTO_100 = 4;
const FBO_OIL_RATE_PER_LITRE_UPTO_200 = 4.25;
const FBO_OIL_RATE_PER_LITRE_UPTO_500 = 4.75;
const FBO_OIL_RATE_PER_LITRE_UPTO_1000 = 5.5;
const FBO_OIL_RATE_PER_LITRE_MORE_THAN_1000 = 6.5;

const FACTORY_OIL_RATE_PER_LITRE_UPTO_100 = 4.54;
const FACTORY_OIL_RATE_PER_LITRE_UPTO_200 = 4.82;
const FACTORY_OIL_RATE_PER_LITRE_UPTO_500 = 5.39;
const FACTORY_OIL_RATE_PER_LITRE_UPTO_1000 = 6.47;
const FACTORY_OIL_RATE_PER_LITRE_MORE_THAN_1000 = 7.64;


const app = express();


app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
app.use(session({   //session to start with these settings
    secret:process.env.SECRET_STRING, //used to encrypt session variables
    resave:false,
    saveUninitialized: false,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    } //stores cookie for one year
}));

app.use(passport.initialize()); //initializes passport
app.use(passport.session());    //begins session


mongoose.set('useNewUrlParser', true); //remove deprecation warning
mongoose.set('useFindAndModify', false); //remove deprecation warning
mongoose.set('useCreateIndex', true); //remove deprecation warning
mongoose.set('useUnifiedTopology', true); //remove deprecation warning
mongoose.connect("mongodb://localhost:27017/chemicalx"); //connects to mongodb

const userSchema =new mongoose.Schema({
    fboNumber : String,
    coordinates:{
        lat:String,
        lng:String
    },
    mobNumber : String,
    addr1: String,
    addr2: String,
    pincode: String,
    username : String
});


const factorySchema = new mongoose.Schema({
    username:String,
    password:String,
    coordinates:{
        lat: String,
        lng: String
    },
    name : String,
    addr: String,
    pinCode:String,
    
});

const requestSchema = new mongoose.Schema({
        dateOfPickup: Date,
        dateOfRequest:Date,
        coordinates:{
            lat:String,
            lng:String
        },
        oilQuantity: Number,
        fboOilCost: Number,
        factoryOilCost: Number,
        addr1: String,
        addr2: String,
        pinCode:String,
        username:String,
        mobNo:String,
        fboNumber:String,
        status:String,
        assignedFactory : String,
        assignedFactoryName: String,
        assignedDriver: String,
        deliverySuccessful: Boolean,
        expired: Boolean

})

const ppSchema = new mongoose.Schema({
        firstName: String,
        lastName: String,
        mobNumber: String,
        addr: String,
        username: String,
        assignedFactory: String,
        assignedFactoryCoordinates:{
            lat:String,
            lng:String
        },
        password:String,
        requests:[{
            dateOfPickup: Date,
            requestId: String,
            pickUpAddr: String,
            coordinates:{
                lat: String,
                lng: String
            },
            oilQuantity: Number,
            fboOilCost: Number,
            factoryOilCost: Number,
            pinCode: String,
            username: String,
            mobNo: String,
            fboNumber: String,
            assignedFactory: String,
            assignedFactoryName: String
        }]
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("userAccount", userSchema);
const Factory = mongoose.model('factory',factorySchema);
const Request = mongoose.model('request',requestSchema);
const PickUpPerson = mongoose.model('pickupPerson',ppSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) { //sets user id as cookie in browser
    done(null, user.id);
});

passport.deserializeUser(function(id, done) { //gets id from cookie and then user is fetched from database
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

//-------------------------
//------GET REQUESTS------
//-------------------------


app.get("/",(req,res)=>{
    res.render("index");
});

app.get("/login",(req,res)=>{
    res.render("login",{admin:2});
});

app.get("/signup",(req,res)=>{
    res.render("signUp");
});

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect('/');
});


app.get("/user",(req,res)=>{
    if(req.isAuthenticated()){
        Request.find({username:req.user.username},(err,requests)=>{
            if(err){
                console.log(err);
            }else{
                res.render("fboUser",{requests:requests});
            }
        })
        
    }else{
        res.redirect("/");
    }
});


app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect('/');
});


app.get("/admin",(req,res)=>{
    res.render("login",{admin:1});
});

app.get("/ppUser",(req,res)=>{
    PickUpPerson.findById(req.query.userID,(err,user)=>{
        res.render("ppUser",{pickupPerson:user});
    })
})

app.get('/admin/user',(req,res)=>{
    Request.find({assignedFactory:req.query.userID},(err,requests)=>{
        if(err){
            console.log(err);
        }else{
            Factory.findById(req.query.userID,(err,factory)=>{
                if(err){
                    console.log(err)
                }else{
                    PickUpPerson.find({assignedFactory:req.query.userID},(err,drivers)=>{
                        if(err){
                            console.log(err);
                        }else{
                            res.render('adminUser',{requests:requests,factory:factory,drivers:drivers});
                        }
                    })
                }
            })
        }
    })
    
    
});

app.get('/pickupPerson', function(req, res){
    res.render("login",{admin:3});
})


//-------------------------
//------POST REQUESTS------
//-------------------------


app.post("/newReq",(req,res)=>{
    const pickupRequest = {
        oilAmount : req.body.oilAmount,
        dateOfPickup : new Date(req.body.dateOfPickup)
    };

    
    Factory.find({},(err,factories)=>{
        let distances = [];

        function requestDistance(factory){
            const options = {
                url:"https://maps.googleapis.com/maps/api/distancematrix/json",
                qs:{
                    origins:`${req.user.coordinates.lat},${req.user.coordinates.lng}`,
                    destinations:`${factory.coordinates.lat},${factory.coordinates.lng}`,
                    language:"en-US",
                    key:process.env.GOOGLE_API_KEY
                },
                timeout: 0
            }
            console.log(options);
            request(options,(error,response,body)=>{
                if(error){
                    console.log(error);
                }else{
                    console.log(body);
                    body = JSON.parse(body);
                    if(body.rows[0].elements[0].status=='OK'){
                        distances.push({
                            distance:body.rows[0].elements[0].distance.value,
                            factoryId:factory._id,
                            factoryName: factory.name
                        })
                    }else{
                        distances.push({
                            distance:99999999999,
                            factoryId: null
                        });
                    }
                    if(factories.length==distances.length)
                    {
                        let min = {
                            distance:distances[0].distance,
                            factoryId: distances[0].factoryId,
                            factoryName: distances[0].factoryName
                        };

                        for(let i=1;i<distances.length;i++){
                            if(distances[i].distance<min.distance){
                                min.distance = distances[i].distance;
                                min.factoryId = distances[i].factoryId;
                                min.factoryName = distances[i].factoryName;
                            }
                        }

                        if(min.factoryId == null){
                            res.redirect('/user');
                        }else{
                                const oilRequest = new Request({
                                dateOfPickup: pickupRequest.dateOfPickup,
                                dateOfRequest:new Date(),
                                coordinates:{
                                    lat:req.user.coordinates.lat,
                                    lng:req.user.coordinates.lng
                                },
                                oilQuantity: pickupRequest.oilAmount,
                                addr1: req.user.addr1,
                                addr2: req.user.addr2,
                                pinCode:req.user.pincode,
                                username:req.user.username,
                                mobNo:req.user.mobNumber,
                                fboNumber:req.user.fboNumber,
                                status:'Pending Approval',
                                assignedFactory : min.factoryId,
                                assignedFactoryName: min.factoryName,
                                deliverySuccessful: false,
                                expired:false
                            });

                            if(pickupRequest.oilAmount<=100)
                            {
                                oilRequest.set('fboOilCost',FBO_OIL_RATE_PER_LITRE_UPTO_100*pickupRequest.oilAmount);
                                oilRequest.set('factoryOilCost', FACTORY_OIL_RATE_PER_LITRE_UPTO_100*pickupRequest.oilAmount);
                            
                            }else if(pickupRequest.oilAmount<=200)
                            {
                                oilRequest.set('fboOilCost',FBO_OIL_RATE_PER_LITRE_UPTO_200*pickupRequest.oilAmount);
                                oilRequest.set('factoryOilCost', FACTORY_OIL_RATE_PER_LITRE_UPTO_200*pickupRequest.oilAmount);

                            }else if(pickupRequest.oilAmount<=500)
                            {
                                oilRequest.set('fboOilCost',FBO_OIL_RATE_PER_LITRE_UPTO_500*pickupRequest.oilAmount);
                                oilRequest.set('factoryOilCost', FACTORY_OIL_RATE_PER_LITRE_UPTO_500*pickupRequest.oilAmount);

                            }else if(pickupRequest.oilAmount<=1000)
                            {
                                oilRequest.set('fboOilCost',FBO_OIL_RATE_PER_LITRE_UPTO_1000*pickupRequest.oilAmount);
                                oilRequest.set('factoryOilCost', FACTORY_OIL_RATE_PER_LITRE_UPTO_1000*pickupRequest.oilAmount);

                            }else{
                                oilRequest.set('fboOilCost',FBO_OIL_RATE_PER_LITRE_MORE_THAN_1000*pickupRequest.oilAmount);
                                oilRequest.set('factoryOilCost', FACTORY_OIL_RATE_PER_LITRE_MORE_THAN_1000*pickupRequest.oilAmount);
                            }

                            oilRequest.save(()=>{
                                console.log(oilRequest);
                                res.redirect("/user");
                            })
                        }
                    }
                }
            
            });
        }
        
        factories.forEach((factory,index)=>{
            requestDistance(factory)
        })

    })
    
    
    

    console.log(pickupRequest);
});


app.post("/signup",(req,res)=>{
    console.log(req.body);
    
    const newUser = {
        fboNumber : req.body.fboNumber,
        coordinates:{
            lat:req.body.lat,
            lng:req.body.lng
        },
        mobNumber : req.body.phoneNo,
        addr1: req.body.addr1,
        addr2: req.body.addr2,
        pincode: req.body.pinCode,
        username : req.body.username,
        password: req.body.password
    }

    
    const password = req.body.password;

    User.register(newUser, password , (err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/");
            });
        }
    });
        
});



app.post("/ppSignup",(req,res)=>{
    console.log(req.body);
    
    Factory.findById(req.body.loggedInFactoryId,(err,factory)=>{
        if(err){
            console.log(err);
        }else{
            
            let newDriver = new PickUpPerson({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                mobNumber: req.body.mobNumber,
                addr: req.body.addr1 + req.body.addr2,
                username: req.body.username,
                assignedFactory: req.body.loggedInFactoryId,
                password: req.body.username,
                assignedFactoryCoordinates:{
                    lat:factory.coordinates.lat,
                    lng:factory.coordinates.lng
                }
            })
    
            newDriver.save(err=>{
                if(err){
                    consolee.log(err)
                }else{
                    res.redirect(`/admin/user/?userID=${req.body.loggedInFactoryId}`);
                }
            })
        }
    })
})

app.post("/pickupPerson",(req,res)=>{
    PickUpPerson.findOne({username:req.body.username},(err,user)=>{
        console.log(user);
        if(user){
            console.log(req.body.password,user.password);
            if(req.body.password == user.password){
                console.log(req.body.password,user.password);
                res.redirect(`/ppUser/?userID=${user._id}`);
            }else{
                res.redirect("/pickupPerson");
            }
        }else{
            res.redirect("/pickupPerson");
        }
    })
})
app.post("/login",(req,res)=>{
    passport.authenticate('local')(req,res,()=>{
        res.redirect(`/user/?userID=${req.user._id}`);
    });
})

app.post('/admin',(req,res)=>{
    Factory.findOne({username:req.body.username},(err,user)=>{
        if(err){
            console.log(err);
        }else{
            if(user){
                if(user.password == req.body.password){
                    res.redirect(`/admin/user/?userID=${user._id}`);
                }else{
                    res.redirect("/admin");
                }
            }else{
                res.redirect("/admin");
            }
        }
    })
})

app.post("/acceptrequest",(req,res)=>{
    console.log(req.body);
    Request.findById(req.body.requestId,(err,foundRequest)=>{
        if(err){
            console.log(err);
        }else{
            foundRequest.status = 'Accepted';
            PickUpPerson.find({assignedFactory:foundRequest.assignedFactory},(err,drivers)=>{
                let freqArray = [];
                console.log(foundRequest.dateOfPickup);
                for(let i=0;i<drivers.length;i++){
                    let freq = 0;
                    for(let j=0;j<drivers[i].requests.length;j++){
                        if(foundRequest.dateOfPickup.getDate() == drivers[i].requests[j].dateOfPickup.getDate()&&
                           foundRequest.dateOfPickup.getMonth() == drivers[i].requests[j].dateOfPickup.getMonth()&&
                           foundRequest.dateOfPickup.getYear() == drivers[i].requests[j].dateOfPickup.getYear()
                        ){
                            freq++;
                        }
                    }
                    freqArray.push(freq);
                }

                let tempFreq, tempDriver;
                for(let i=0;i<freqArray.length;i++){
                    for(let j=1;j<freqArray.length-i;j++){
                        if(freqArray[j-1]<freqArray[j]){
                            tempFreq=freqArray[j-1];
                            freqArray[j-1]=freqArray[j];
                            freqArray[j]=tempFreq;

                            tempDriver = drivers[j-1];
                            drivers[j-1] = drivers[j];
                            drivers[j] = tempDriver;
                        }
                    }
                }
                console.log(drivers);
                let i=0;
                while(freqArray[i]>=5){
                    i++;
                }
                drivers[i].requests.push({
                    dateOfPickup: foundRequest.dateOfPickup,
                    requestId: foundRequest._id,
                    pickUpAddr: foundRequest.addr1 + foundRequest.addr2,
                    coordinates:{
                        lat: foundRequest.coordinates.lat,
                        lng: foundRequest.coordinates.lng
                    },
                    oilQuantity: foundRequest.oilQuantity,
                    fboOilCost: foundRequest.fboOilCost,
                    factoryOilCost: foundRequest.factoryOilCost,
                    pinCode: foundRequest.pinCode,
                    username: foundRequest.username,
                    mobNo: foundRequest.mobNo,
                    fboNumber: foundRequest.fboNumber,
                    assignedFactory: foundRequest.assignedFactory,
                    assignedFactoryName: foundRequest.assignedFactoryName
                })
                
                drivers[i].save(()=>{
                    foundRequest.assignedDriver = drivers[i]._id;
                    foundRequest.save(()=>{
                        res.redirect(`/admin/user/?userID=${req.body.factoryId}`);
                    })
                })
                /* drivers.forEach(driver=>{
                    if(driver.requests.length<=5){
                        driver.requests.push({
                            dateOfPickup: foundRequest.dateOfPickup,
                            requestId: foundRequest._id,
                            pickUpAddr: foundRequest.addr1 + foundRequest.addr2,
                            coordinates:{
                                lat: foundRequest.coordinates.lat,
                                lng: foundRequest.coordinates.lng
                            }
                        });
                        driver.save(()=>{
                            foundRequest.set('assignedDriver',`${driver._id}`);
                            foundRequest.save(()=>{
                                res.redirect(`/admin/user/?userID=${req.body.factoryId}`);
                            })
                        })
                    }
                }) */
            })
        }
    })
});

app.post("/rejectrequest",(req,res)=>{
    Request.findById(req.body.requestId,(err,foundRequest)=>{
        if(err){
            console.log(err);
        }else{
            foundRequest.status = 'Rejected';
            foundRequest.expired = true;
            foundRequest.save(()=>{
                res.redirect(`/admin/user/?userID=${req.body.factoryId}`);
            });
        }
    })
});

app.post('/pickedUp', (req,res)=>{
    console.log(req.body);
    Request.findById(req.body.requestId,(err,foundRequest)=>{
        if(err){
            console.log(err);
        }else{
            foundRequest.deliverySuccessful = true;
            foundRequest.expired = true;
            foundRequest.status = 'Pick up successful';
            foundRequest.save(()=>{
                res.redirect(`/admin/user/?userID=${req.body.factoryId}`);
            })
        }
    })
});

app.post('/notPickedUp',(req,res)=>{
    Request.findById(req.body.requestId,(err,foundRequest)=>{
        if(err){
            console.log(err);
        }else{
            foundRequest.expired = true;
            foundRequest.status = 'Pick up unsuccessful'
            foundRequest.save(()=>{
                res.redirect(`/admin/user/?userID=${req.body.factoryId}`);
            })
        }
    })
})
app.listen(3000, ()=>{
    console.log("Server running at port 3000");
})


//FACTORY DATA SEEDER

/* const factory1 = new Factory({
    username:"ibe@gmail",
    password:"123",
    coordinates:{
        lat: "13.352310",
        lng: "77.539140"
    },
    name : "Indian BioEnergy",
    addr: "Nagadenahalli, NH207, Bangalore, Karnataka",
    pinCode:"561205",
});

factory1.save(); 


const factory2 = new Factory({
    username:"abl@gmail",
    password:"123",
    coordinates:{
        lat: "17.426637",
        lng: "78.449620"
    },
    name : "Advaith Biofuels Limited",
    addr: "Lakshmi Tower, Plot No.13, 1st Floor, ‘A’ Block, Nagarjuna Hills, Punjagutta, Hyderabad, Telangana",
    pinCode:"500082",
});

factory2.save(); 


const factory3 = new Factory({
    username:"abl@gmail",
    password:"123",
    coordinates:{
        lat: "12.550086",
        lng: "80.079125"
    },
    name : "Yantra Fintech India Ltd",
    addr: "Naduvakkarai, Mullakolathur, Tamil Nadu ",
    pinCode:"603109",
});

factory3.save();

const factory4 = new Factory({
    username:"mbpl@gmail",
    password:"123",
    coordinates:{
        lat: "19.115750",
        lng: "72.854959"
    },
    name : "Muenzer Bharat Private Limited",
    addr : "Kaledonia, Unit 1B, 5th Floor, Sahar Road, Off, Western Express Hwy, Andheri East, Mumbai, Maharashtra",
    pinCode:"400069",
});

factory4.save();


const factory5 = new Factory({
    username:"mipl@gmail",
    password:"123",
    coordinates:{
        lat: "18.781435",
        lng: "73.302256"
    },
    name : "Monopoly Innovations Private Limited",
    addr : "42-45 Emerald Industrial Estate, Dheku, Taluka, Khalapur, Maharashtra",
    pinCode:"410203",
});

factory5.save(); 



const factory6 = new Factory({
    username:"kripl@gmail",
    password:"123",
    coordinates:{
        lat: "13.045033",
        lng: "80.272129"
    },
    name : "Kaleesuwari Refinery And Industry Private Limited",
    addr : "Phase-III,Industrial Park, Vakalapudi, Kakinada, Andhra Pradesh",
    pinCode:"533005",
});
factory6.save(); */
