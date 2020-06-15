const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const { o } = require('mongoose');
const jwt = require('jsonwebtoken');
const Chat = require('./model/chat');
const io = require('./socket');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


app.get('/',(req,res,next)=>{
  res.status(200).json({success:true});
});

app.post('/login',(req,res,next)=>{
  let email = req.body.email;
  let pass = req.body.pass; 
  User.findOne({email:email,pass:pass}).then(
      result=>{
        if(!result){
          res.status(200).json({success:false});
        }else{
          const token = jwt.sign({
            userid : result._id,
          },'ShyamTheGreat',{expiresIn:'1h'});
          res.status(200).json({token:token,success:true,userid:result._id+''});
        }
      }    
  ).catch(err=>{
    next(err);
  }
  );
});

app.post('/register',(req,res,next)=>{
  let name = req.body.name;
  let email = req.body.email;
  let pass = req.body.pass;

  User.findOne({
    email:email
  }).then(result=>{
    if(!result){
      bcrypt.hash(pass,12).then((hpass)=>{
        const register = new User({
          name:name,
          email:email,
          pass:pass
        });
        register.save().then((result)=>{
          res.status(200).json({success:true});
        }).catch(err=>{      
          next('Internal server Error');
        })
      }).catch((err)=>{
        next('Internal server Error');
      })
    }
    else{
      res.status(404).json({msg:'Email already registered'});
    }
  })
});

app.post('/postmsg',(req,res,next)=>{
  let token = req.body.token;
  let msg = req.body.msg;
  let dateob = new Date();
  let time = dateob.getHours()+':'+dateob.getMinutes();
  const data = jwt.verify(token,'ShyamTheGreat');
  if(data){
    let userid = data.userid;
    User.findById(userid).then(
      user =>{
        if(!user){
          res.status(200).json({success:false,msg:'Invalid user'});      
        }
        else{
          let username = user.name;
          let chat = new Chat({
            user:userid,
            username:username,
            msg:msg,
            time:time
          });

          chat.save().then(result=>{
            
            io.getIO().emit('posts', {
              action: 'create',
              message: { userid:userid+'',
                      username:username,
                      msg:msg,
                      time:time 
                    }
            });

            res.status(200).json({success:true,time:time,name:username});  
          }).catch(
            err=>{console.log(err)}
          );

        }
      }
    ).catch();
  }
  else{
    res.status(200).json({success:false,msg:'Please do login!'});
  }  
});

app.get('/getmsg',(req,res,next)=>{
  Chat.find().sort({'created_at' : -1 }).limit(0).then(
    msgs=>{
      const resData = msgs.map((data)=>{
        let name = data.username;
        let msg = data.msg;
        let time = data.time;
        return {name:name,msg:msg,time:time}
      });
      res.status(200).json({success:true,messages:resData});
    }
  )
});



app.use((err,req,res,next)=>{
    res.status(500).json({error:true,msg:err});
});


mongoose
  .connect(
    'mongodb+srv://root:root@cluster0-nk8bs.mongodb.net/chat?retryWrites=true&w=majority',
    {useNewUrlParser: true,useUnifiedTopology: true} 
  )
  .then(result => {
    const server = app.listen(8080);
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('Client connected');
    });
  })
  .catch(err => {
    console.log(err);
});