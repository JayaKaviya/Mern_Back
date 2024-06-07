
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
    
  }
});

mongoose.connect(process.env.DATABASE, {
 
})
  .then(() => console.log('DB Connected'))
  .catch(err => console.log('DB CONNECTION ERROR:', err));


app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  
  origin: ['https://mern-front-rprc.onrender.com'], 
}));
app.use(morgan('dev'));

 

readdirSync('./routes').map(r => import(`./routes/${r}`).then(module => app.use('/api', module.default)));


io.on('connect',(socket)=>{ 
  
  socket.on('new-post',(newPost)=>{ 
    

    socket.broadcast.emit("new-post",newPost)
  })

})


const port = process.env.PORT || 8000; 

httpserver.listen(port, () => {
  console.log(`Server running on ${port}`);
});
