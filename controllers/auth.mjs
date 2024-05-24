import User from "../models/user.mjs" 

import { hashPassword,comparePassword } from "../helpers/auth.mjs";

import jwt from 'jsonwebtoken';  

import {nanoid} from "nanoid"; // random chars



export  const register=async (req, res) => {
    // console.log('REGISTERED ENDPOINT =>', req.body);
     
    const {name,email,password,secret}=req.body; 

    //validation 
    if(!name) { 
        return res.json({ 
            error: "Name is required",
        })
    }
    
    if(!email)
    { 
        return res.json({ 
            error: "Email is required"
        })
    }

    if(!password || password.length < 6)
     { 
        return res.json({ 
           error : "Password is required and should have a minimum of 6 characters."
        })
     }
    
    if(!secret) 
    { 
        return res.json({ 
            error: "Answer is required"
        })
    }



                                 //email:email(both key value same)
    const exist= await User.findOne({email}) 
    if(exist) { 
        return res.json({ 
            error : "Email is taken"
        })
    }

    //hash password 
    const hashedPassword=await hashPassword(password);
     
   
    const user = new User({
        name,
        email,
        password: hashedPassword,
        secret,
        username:nanoid(6)}); 
    try{ 
        //to save  
        await user.save(); 
        console.log("REGISTERED USER =>",user);
        return res.json({
          
            ok:true,
        })

    }catch(err){ 
        console.log('REGISTERED FAILED =>',err); 
        return res.json({ 
            error : "Error, Try Again"
        })
    }


}; 

export const login= async (req,res)=>{ 
    // console.log(req.body)
   try{ 
      //check if our db has user with that email 
      const {email,password}=req.body; 
      
      const user=await User.findOne({email}); //hashed version from the db
      if (!user) 
      { 
        return res.json({ 
           error: "No user found" 
        })
      }
    //   console.log("user",user) 

      //check password 
      const match=await comparePassword(password,user.password); 
 
      if(!match) 
      { 
        return res.json({ 
            error: "Wrong Password"
        })
      } 
    //   console.log("match",match) 


      //create signed JWT token 
      //const token = jwt.sign(payload, secretKey, { expiresIn: expiresInInSeconds });
                          // user's 
      const token=jwt.sign({_id:user._id},process.env.JWT_SECRET,{
        expiresIn:"7d", //"1200" - 20sec * 60
     }); 
    //after 7 days, the user has to login again..bcoz the token will expiry
     user.password=undefined; 
     user.secret=undefined; 
     res.json({
        token, //storing this in client side
        user,
    });
   } 
   catch (err){ 
    console.log(err) 
    return res.json({ 
       error:  'Error. try again !'
    })
   }

};  


export const currentUser = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token not provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};


// export const currentUser=async(req,res) =>{ 

    
//     const token=req.headers.authorization.split(' ')[1]
//     //  console.log(req.headers.authorization.split(' ')[1])
//     const decoded=jwt.verify(token,process.env.JWT_SECRET)
//      console.log(decoded)  

//      if (!token) {
//         return res.status(401).json({ error: 'Unauthorized: Token not provided' });
//     }


//      try{ 
//           const user=await User.findById(decoded._id)  
//         //   res.json(user);
//           res.json({ok : true})
//      } 
//      catch(err){ 
//         console.log(err); 
//         res.sendStatus(400).json({ error: 'Unauthorized: Invalid token' });
//      }
// }
 
 

export const forgotPassword=async(req,res)=>{ 
    // console.log(req.body); 

 
 
        const {email,newPassword,secret}=req.body; 

        //validation 

        if(!newPassword || newPassword.length < 6) 
        { 
            return res.json({ 
                error: 'New password is required and should be minimum 6 characters long',
            });
        } 
        if(!secret) 
        { 
            return res.json({ 
                error: 'Secret is required',
            });
        }

        const user=await User.findOne({email,secret});  

        if(!user){ 
            return res.json({ 
                error: "We can't verify you with those details"
            })
        } 

        try{ 
           const hashed=await hashPassword(newPassword); 
            
           await User.findByIdAndUpdate(user._id,{password: hashed}); 
           return res.json({ 
            success: 'Congrats,Now you can login with your new password'
           });

        }catch(err)
        { 
           console.log(err) 
           return res.json({ 
            error : "Something wrong.Try again."
           }) 
        }

   
}











export const profileUpdate=async(req,res)=>{ 
    try{ 
        // console.log("profile update ",req.body) 
        
        const data={}; 

        if(req.body.username){ 
            data.username=req.body.username;
        }
        if(req.body.about){ 
            data.about=req.body.about;
        } 

        if(req.body.name){ 
            data.name=req.body.name;
        } 

        if(req.body.password){  

            if(req.body.password.length < 6){ 
                return res.json({ 
                    error: 'Password is required and should be minimum 6 characters long'
                })
            }
            else{ 
                data.password=await hashPassword(req.body.password);
            }

            
        }
        if(req.body.secret){ 
            data.secret=req.body.secret;
        } 
        if(req.body.image){ 
            data.image=req.body.image;
        }
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(decoded);
                                           //req.user._id alternative
        let user=await User.findByIdAndUpdate(decoded._id,data,{new : true}) 
        // console.log('updated user',user); 
        user.password=undefined; 
        user.secret=undefined; 
        res.json(user);
    }
    catch(err){ 
        // if 2 user enters the same name mongodb throws an error 
        // i.e duplicate error . its code is 11000
        if(err.code == 11000){ 
           return res.json({error : "Duplicate username"});
        }
        console.log(err);
    }
} 

export const findPeople=async(req,res)=>{ 
  try{ 
    
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user=await User.findById(decoded._id);

    //user.following 
    let following=user.following; 
    following.push(user._id); //pushing himself as following 
         
                                    //not including             //without pswrd and secret so '-'
    const people=await User.find({_id:{$nin : following}}).select('-password -secret').limit(10); 
    res.json(people);
  } 
  catch(err){ 
    console.log(err);
  }
}
 
//middleware - addFollower 

export const addFollower=async(req,res,next)=>{ 
   try{ 
      
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

      const user=await User.findByIdAndUpdate(req.body._id,{ 
        $addToSet: { followers : decoded._id},
      });
    next();

   } catch(err){ 
         console.log(err)
   }
};

export const userFollow=async(req,res)=>{ 
    try{ 
      
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
                                             //find the requested user
          const user=await User.findByIdAndUpdate(decoded._id,{ 
          //unique values
            $addToSet: { following : req.body._id},
          }, { new : true}).select("-password -secret");
       
        res.json(user);

       } catch(err){ 
             console.log(err)
       }
}; 


export const userFollowing=async(req,res)=>{ 
    try{ 
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
                                             //find the requested user
          const user=await User.findById(decoded._id); 

          const following =await User.find({_id : user.following}).limit(100);  

          res.json(following);

    } catch(err){ 
        console.log(err)
    }
} 



//middleware
export const removeFollower=async(req,res,next)=>{ 
   try{ 

       const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  

     const user=await User.findByIdAndUpdate(req.body._id,{ 
        $pull: {followers: decoded._id},
     }) 
     next();
   }
   catch(err){ 
    console.log(err);
   }

} 

export const  userUnfollow=async(req,res,next)=>{ 
    try{ 
          
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        const user=await User.findByIdAndUpdate(decoded._id,
            { 
            $pull: {following: req.body._id}, 
            },
            {new : true}
        
        ); 
        res.json(user);


    }
    catch(err){ 
     console.log(err);
    }
} 

//Ryan in db - ryan from user , then send Ryan
export const searchUser=async(req,res)=>{ 
   
    const {query}=req.params 
    if(!query) return; 

    try{ 
        const user=await User.find({ 
         $or:[              
      //special methd from mongodb ,case insensitive matching modifier - i
            {name :{$regex:query, $options:"i"}}, 
            {username: {$regex:query, $options:"i"}}
         ]   
        }).select("-password -secret");  //deselecting

        // .select("_id name username image");

        res.json(user);
    }catch(err){ 
        console.log(err);
    }
} 

export const getUser=async(req,res)=>{ 
    try{ 
        const user=await User.findOne({username: req.params.username})
        .select('-password -secret') 
        // console.log(user);
        res.json(user);
    } 
    catch(err){ 
         console.log(err);
    }
}