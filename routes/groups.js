const express = require('express');
const router = express.Router();


let Group = require('../models/groups');
let Users = require('../models/newUser');
// let History = require('../models/history');
let Message = require('../models/message');

router.get('/create', function(req, res){
  if(req.user == null){
    res.redirect('/');
  }else{
    res.render('createGroup');
  }
});



router.post('/create', function(req, res){
  const groupname = req.body.groupname;
  const groupPic = '/group-pics/all.png';
  const admin = req.user._id;
  const members = [req.user._id];

  req.checkBody('groupname', 'Group name is required').notEmpty();

  let errors = req.validationErrors();

  if(errors){
    res.render('createGroup', {
      errors: errors
    });
  }else{
    let newGroup = new Group({
      name: groupname,
      admin: admin,
      picture: groupPic,
      members: members
    });

    var gId;

    newGroup.save(function(err, group){
      if(err){
        console.log(err);
        return;
      }else{
        gId = group._id;

        let update = {'$push': {groups: gId}};
        Users.findByIdAndUpdate(req.user._id, update, function(err, user){
          if(err){
            console.log(err);
          }else{
            console.log("Updated " + user.username + ".");
          }
        });

        req.flash('success', 'Your new group has been created');
        res.redirect('/users/chat/' + gId);
      }
    });
  }
});

router.get('/invite/:userName', function(req, res){
  if(req.user == null){
    res.redirect('/');
  }else{
    groups = Group.find({members: req.user._id}, function(err, grp){
      if(err){
        console.log(err);
        res.redirect('/');
        return;
      }else{
        users = Users.findOne({username: req.params.userName}, function(err, usr){
          if(err){
            console.log(err);
            return;
          }else{
            if(usr == null){
              res.redirect('/');
            }else{
              res.render('invite', {groups: grp, username:usr.username});
            }
          }
        });

      }
    });

  }
});

router.post('/invite/:userName', function(req, res){
  const username = req.params.userName;
  const group = req.body.groupsSelect;

  Group.findOne({name: group}, function(err, result){
    if(err){
      console.log(err);
      return;
    }else{
      Users.findOne({username: username}, function(err, usr){
        let update = {'$push': {members: usr._id}};
        for(user in result.members){
          if(user.toString() == usr._id.toString()){
            res.redirect('/');
          }else{
            Group.findByIdAndUpdate(result._id, update, function(err){
              if(err){
                console.log(err);
                return;
              }
            });
          }
        }
      });
    }
  });

  res.redirect('/');
});

router.get('/addFriend/:friendName', function(req, res){
  if(req.params.friendName != req.user.username){
    Users.findOne({username: req.params.friendName}, function(err, result){
      if(err){
        console.log(err);
        return;
      }
      if(result){
        var conditions ={
          _id: req.user._id,
          friends: {$ne: result._id}
        };

        Users.findOneAndUpdate(conditions, {'$push':{friends: result._id}}, function(err){
          if(err){
            console.log(err);
            return;
          }
        });
      }

      res.redirect('/');
    });
  }else{
    res.redirect('/');
  }
});

router.get('/invite', function(req, res){
  res.redirect('/');
});

module.exports = router;
