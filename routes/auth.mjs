
import express from 'express';
import { register,login,currentUser, 
        forgotPassword,
        profileUpdate,findPeople,addFollower,userFollow,
        userFollowing,removeFollower,userUnfollow, 
        searchUser,getUser    } from '../controllers/auth.mjs';


import  {isAdmin, requireSignin} from '../middleware/index.mjs';


const router = express.Router();

router.post('/register', register); 
router.post('/login',login);
        //endpoint, validating token using middleware
router.get('/current-user',requireSignin,currentUser); 
 
router.post('/forgot-password',forgotPassword);


router.put('/profile-update',requireSignin,profileUpdate); 
                    //only for logedin users
router.get('/find-people',requireSignin,findPeople); 
                                        //follower  //following
router.put('/user-follow',requireSignin,addFollower,userFollow);

router.put('/user-unfollow',requireSignin,removeFollower,userUnfollow);

router.get('/user-following',requireSignin,userFollowing);

router.get('/search-user/:query',searchUser);  

router.get('/user/:username',getUser); 

router.get('/current-admin',requireSignin,isAdmin,currentUser)

export default router;
