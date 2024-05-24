
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { readdirSync } from 'fs';
import dotenv from 'dotenv'; 

import { Server } from 'socket.io';
import http from 'http';


dotenv.config();

const app = express();  

const httpserver = http.createServer(app); 
const io = new Server(httpserver, { 
  cors:{ 
    origin :[process.env.CLIENT_URL], 
    // methods:["GET","POST"], 
    // allowedHeaders:["Content-type"],
  }
});

mongoose.connect(process.env.DATABASE, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
})
  .then(() => console.log('DB Connected'))
  .catch(err => console.log('DB CONNECTION ERROR:', err));

// Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  // origin: ['http://localhost:3000'], 
  origin: ['https://mern-front-rprc.onrender.com'], 
}));
app.use(morgan('dev'));

// Autoload routes
// readdirSync('./routes').map(r => app.use('/api', require(`./routes/${r}`).default)); 

readdirSync('./routes').map(r => import(`./routes/${r}`).then(module => app.use('/api', module.default)));

//socket.io 
// io.on('connect',(socket)=>{ 
//   //  console.log("socket : ",socket.id) 

//   socket.on('send-message',(message)=>{ 
//     // console.log("new message received => ",message) 
    
//     //1st server receives and broadcast it to all clients except who makes req 
//     // take 1 chrome window , 2 incognito window & check 

//     socket.broadcast.emit("receive-message",message)
//   })

// }) 


// socket.io 
io.on('connect',(socket)=>{ 
  //  console.log("socket : ",socket.id) 

  socket.on('new-post',(newPost)=>{ 
    // console.log(" socket new post => ",newPost) 
    
    //1st server receives and broadcast it to all clients except who makes req 
    // take 1 chrome window , 2 incognito window & check 

    socket.broadcast.emit("new-post",newPost)
  })

})


const port = process.env.PORT || 8000; 

httpserver.listen(port, () => {
  console.log(`Server running on ${port}`);
});
