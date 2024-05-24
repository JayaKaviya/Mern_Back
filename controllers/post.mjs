import Post from "../models/post.mjs";
import jwt from 'jsonwebtoken'; 
import cloudinary from 'cloudinary'; 
import post from "../models/post.mjs"; 
import User from "../models/user.mjs";
import { json } from "express";

cloudinary.config({ 
    cloud_name : process.env.CLOUDINARY_NAME , 
    api_key : process.env.CLOUDINARY_KEY, 
    api_secret : process.env.CLOUDINARY_SECRET,
});

export const createPost=async(req,res)=>{ 

    // console.log('post=> ',req.body)  

    const {content,image}=req.body; 
    if(!content.length){ 
        return res.json( 
            { 
             error: 'Content is required' ,  //sending frontend- data.error in dashboard
            }
        );
    }

    try{  

        const token=req.headers.authorization.split(' ')[1]
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        console.log(decoded)  

        // console.log(req.headers) // req.users._id -not
     const post=new Post({content,image, postedBy: decoded._id}); 
     await post.save();  
     
     const postWithUser=await Post.findById(post._id)
     .populate(
        "postedBy", 
        "-password -secret"
     );

     res.json(postWithUser); // sending data to frontend
    }
    catch(err){ 
       console.log(err); 
       res.sendStatus(400);
    }
} 

export const uploadImage=async(req,res)=>{ 
    //  console.log("req",req.files) 

    try{ 
        const result=await cloudinary.uploader.upload(req.files.image.path); 
        // console.log("uploaded image url =>",result); 
        res.json({ 
            url : result.secure_url, 
            public_id : result.public_id,
        });
    }catch(err){ 
        console.log(err)
    }
} 

export const postsByUser=async(req,res)=>{ 
    try{  
        const token=req.headers.authorization.split(' ')[1]
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        console.log(decoded)  
      
        // const posts=await Post.find({postedBy :decoded._id }) - currently loggedin user posts

         const posts=await Post.find()
         .populate("postedBy", "_id name image")
            .sort({createdAt :-1}) //-1 to give u the latest post
            .limit(10); //10 posts
       
            // console.log('posts : ',posts) 
            res.json(posts);
    } 
    catch(err){ 
        console.log(err);
    }
} 


export const userPost=async (req,res)=>{ 
    try{ 
         const post=await Post.findById(req.params._id)
         .populate('postedBy','_id name image')
         .populate('comments.postedBy',"_id name image") 
         res.json(post);
    }
    catch(err){ 
        console.log(err)
    }
} 

export const updatePost=async(req,res)=>{ 
    // console.log('Post updated =>',req.body); // data from frontend-image,content 

    try{                      //id from frontend(postid),
        const post=await Post.findByIdAndUpdate(req.params._id,req.body,{ 
             new:true //must to update & return the updated argument
        });  
        //  console.log(post)

        res.json(post);

    } catch(err){ 

    }
} 

export const deletePost=async(req,res)=>{ 
  
    try{ 
        const post=await Post.findByIdAndDelete(req.params._id); 
        //remove the image from cloudinary 
        if(post.image && post.image.public_id){ 
            const image=await cloudinary.uploader.destroy(post.image.public_id);
        } 
        res.json({ok : true})
    } 
    catch(err){ 
        console.log(err)
    }

} 


export const newsFeed=async(req,res)=>{ 
    try
    {  
        const token=req.headers.authorization.split(' ')[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        const user=await User.findById(decoded._id); 
        
        let following=user.following; 
        following.push(decoded._id); //adding the req. user as following 


        //pagination 
        const currentPage=req.params.page || 1; //taking defalt value 1 if nothing recieved 
        const perPage=3;

        const posts=await post.find({postedBy: {$in : following} })
        .skip((currentPage-1)*perPage)
        .populate('postedBy','_id name image')
        .populate('comments.postedBy',"_id name image")
         .sort({createdAt : -1}) //getting latest posts 
         .limit(perPage); 
         
        //  .limit(10); //limiting 10 posts

        res.json(posts);

    }
    catch(err)
    { 
        console.log(err)
    }
}
 

export const likePost=async(req,res)=>{ 
    try{ 
        const token=req.headers.authorization.split(' ')[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        const post=await Post.findByIdAndUpdate(req.body._id,
            { 
                     //likes array
            $addToSet: {likes : decoded._id},
            },
            {new : true}
        );
        res.json(post);

    }catch(err){ 
        console.log(err);
    }
} 


export const unlikePost=async(req,res)=>{ 
    try{ 

        const token=req.headers.authorization.split(' ')[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        

        const post=await Post.findByIdAndUpdate(req.body._id,
            { 
                    //likes array now will have the liked user's id
            $pull: {likes : decoded._id},
            },
            {new : true}
        ); 

        res.json(post); 

    }catch(err){ 
        console.log(err);
    }
} 


export const addComment=async(req,res)=>{ 
    try{ 
        
        const token=req.headers.authorization.split(' ')[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET); 


        const {postId, comment} =req.body; 
        const post=await Post.findByIdAndUpdate(postId, { 
            $push : { comments: {text : comment, 
            postedBy : decoded._id}}
        },{  new : true}
        ).populate('postedBy',"_id name image") //post postedby
        .populate('comments.postedBy',"_id name image");  //comments postedby

        res.json(post); //post updated with the comment

    }catch(err){ 
        console.log(err);
    }
} 

export const removeComment=async(req,res)=>{ 
    try{ 
            

        const token=req.headers.authorization.split(' ')[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET); 


        const {postId, comment} =req.body; 
        const post=await Post.findByIdAndUpdate(postId, { 
            $pull : { comments: {_id : comment._id }}, //pull based on comment id
        },{  new : true}
        );

        res.json(post); //post updated with the comment 

    }catch(err){ 
        console.log(err);
    }
} 


export const totalPosts=async(req,res)=>{ 
    try{ 
      const total=await Post.find().estimatedDocumentCount(); 
      res.json(total);
    }
    catch(err){ 
        console.log(err);
    }
} 


export const posts=async(req,res)=>{ 
    try{ 
      const posts=await Post.find()
    .populate('postedBy',"_id name image") 
    .populate('comments.postedBy',"_id name image") 
    .sort({createdAt:-1}) 
    .limit(12);  

    res.json(posts)

    }catch(err)
    { 
        console.log(err)

    }
} ;

export const getPost= async(req,res) => { 
    try{ 
       const post=await Post.findById(req.params._id)
       .populate('postedBy',"_id name image") 
    .populate('comments.postedBy',"_id name image")  

    res.json(post);
    }
    catch(err)
    { 
        console.log(err);
    }
}