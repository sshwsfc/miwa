$ma.controller({

  routes: {
    "": "index",
    "user_home": "index",
    "user_info/:user_id": "user_info"
  },

  index : function(){ $ma.pm.to('user_home'); },
  user_info: function(user_id){ $ma.pm.to('user_info', {user_id: user_id}); }

});