
import express from "express"
import {expressjwt} from 'express-jwt'; 
import User from '../models/user.mjs'
import Post from '../models/post.mjs'
import jwt from 'jsonwebtoken';

export const requireSignin = expressjwt({
    
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
});



export const canEditDeletePost=async(req,res,next)=>{ 
     try{ 
          const post=await Post.findById(req.params._id)  

        const token=req.headers.authorization.split(' ')[1]
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        
        if (decoded._id != post.postedBy){ 
            return res.status(400).send("Unauthorized");
        }
            else{ 
            next(); 
        }

     }catch(err){ 
        console.log(err)
     }
}
 


export const isAdmin=async (req,res,next)=>{ 
    try{  
        const token=req.headers.authorization.split(' ')[1]
        const decoded=jwt.verify(token,process.env.JWT_SECRET) 

        const user=await User.findById(decoded._id);  
       
        if (user.role!=='Admin')
        { 
            return res.status(400).send("Unauthorized");
        }
        else{ 
            next();
        }
    }
    catch(err)
    { 
        console.log(err)

    }
}










