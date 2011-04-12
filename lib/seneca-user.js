/* Copyright (c) 2010 Ricebridge */

var common  = require('./common');
var E = common.E;

var util    = common.util;
var eyes    = common.eyes;
var assert  = common.assert;
var uuid    = common.uuid;


function User(seneca) {
  var self = this


  seneca.add({on$:'user',cmd$:'prepare'},function(args,cb){
    util.debug('user/prepare')

    var prep = args.entity$.make$({tenant$:args.tenant$,base$:'sys',name$:'prepare'})
    prep.pr = uuid().toLowerCase()
    prep.ip = args.req.remoteAddress
    prep.ua = args.req.headers['User-Agent']
    prep.at = new Date()

    // state
    prep.st = 'new'

    // verifier - captcha result?
    // early invite coupon?
    // FIX: call a cmd to do this - on$:user,cmd$:verifier
    prep.vf = args.verify  // from
    prep.vt = args.verify   // to

    prep.save$(function(err,prep){ 
      cb(err,{prep:prep.pr,verify:prep.vf})
    })
  })


  seneca.add({on:'user',cmd:'signup'},function(args,cb){
    util.debug('seneca:signup:'+JSON.stringify(args));
    var signup = args.entity$.make$({tenant$:args.tenant,base$:'sys',name$:'signup'});
    signup.email = args.email;
    signup.token = (''+Math.random()).substring(2);
    signup.save$(function(err,signup){
      cb(err,signup);
    });
  });


  seneca.add({on:'user',cmd:'activate'},function(args,cb){
    util.debug('seneca:activate:'+JSON.stringify(args));
    args.entity$.find$({tenant$:args.tenant,base$:'sys',name$:'signup',token:args.signup},function(err,signup){
      E(err);
      util.debug('signup:'+signup)
      if( signup ) {
        var user = args.entity$.make$({tenant$:args.tenant,base$:'sys',name$:'user',email:signup.email});
        user.activation = (''+Math.random()).substring(2);

        user.save$(function(err,user){
          cb(err,{email:user.email,activation:user.activation});
        });
      }
      else {
        cb(err,null);
      }
    });
  });

  seneca.add({on:'user',cmd:'load-activated'},function(args,cb){
    util.debug('seneca:load-activated:'+JSON.stringify(args));
    args.entity$.find$({tenant$:args.tenant,base$:'sys',name$:'user',activation:args.activation},function(err,user){
      E(err);
      if( user ) {
        cb(err,{email:user.email});
      }
      else {
        cb(err,null);
      }
    });
  });

  seneca.add({on:'user',cmd:'setup-activated'},function(args,cb){
    util.debug('seneca:setup-activated:'+JSON.stringify(args));
    args.entity$.find$({tenant$:args.tenant,base$:'sys',name$:'user',activation:args.activation,email:args.email},function(err,user){
      E(err);
      if( user ) {
        if( args.password == args.confirm ) {
          if( '' == args.password ) {
            cb({user:true,code:'password-empty'},null);
          }
          else if( '' == args.name ) {
            cb({user:true,code:'name-empty'},null);
          }
          else {
            user.name = args.name;
            user.password = args.password;
            user.login = (''+Math.random()).substring(2);
            delete user.activation;
            user.save$(function(err,user){
              cb(err,user);
            });
          }
        }
        else {
          cb({user:true,code:'password-nonmatch'},null);
        }
      }
      else {
        cb({user:true,code:'unknown-user'},null);
      }
    });
  });

  seneca.add({on:'user',cmd:'load-login'},function(args,cb){
    util.debug('seneca:load-login:'+JSON.stringify(args));
    args.entity$.find$({tenant$:args.tenant,base$:'sys',name$:'user',login:args.login},function(err,user){
      E(err);
      if( user ) {
        cb(err,user);
      }
      else {
        cb(err,null);
      }
    });
  });

  seneca.add({on:'user',cmd:'login'},function(args,cb){
    util.debug('seneca:login:'+JSON.stringify(args));
    args.entity$.find$({tenant$:args.tenant,base$:'sys',name$:'user',email:args.email,password:args.password},function(err,user){
      E(err);
      if( user ) {
        cb(err,user);
      }
      else {
        cb(err,null);
      }
    });
  });

}

exports.User = User