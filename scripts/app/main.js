var groups = [];

function init () {
   initVK();
   initGroups();
   initProcessing();
}

function initProcessing () {
   $('.start-processing').on('click', function () {
      groups = groups.sort(function (a, b) {
         return a.members_count > b.members_count ? 1 : -1;
      });

      calcGroups();
   });
}

function initGroups () {
   var $input = $('.groups-search-input');
   var $button = $('.groups-search-button');

   $button.on('click', function () {
      searchGroups($input.val());
   });

   $input.on('keyup', $.debounce(function () {
      searchGroups($input.val());
   }, 500));

   if($input.val()) searchGroups($input.val());
}

function insertGroups (groups) {
   var $result = $('.groups-result');

   if(!groups.length) $result.html('Nothing found');

   var $groups = groups.map(function (group) {
      var $el = createGroup(group);

      $el.on('click', function () {
         addGroup(group);

         $el.remove();
      });

      return $el;
   });

   $result.html($groups);
}

function createGroup (group) {
   var $el = $('<div>').addClass('group');

   $el.append($('<img>', {src: group.photo_medium}));
   $el.append($('<span>').html('<i>[' + group.members_count + ']</i> ' + group.name));

   return $el;
}

function createUser (user) {
   var $el = $('<div>').addClass('group');

   $el.append($('<img>', {src: user.photo_100}));
   $el.append($('<span>').text(user.first_name + ' ' + user.last_name));

   return $el;
}

function calcGroups () {
   var $result = $('.result');

   if(groups.length < 2) {
      return $result.html('Please select at lest 2 groups');
   }

   getAllUsers(groups[0].gid, function (users1) {
      $result.html('30%');

      getAllUsers(groups[1].gid, function (users2) {
         $result.html('60%');

         var users = compareArrays(users1, users2);

         if(users.length > 1 && groups[2]) {
            searchInGroup(2, users);
         }
         else showUsers(users);
      });
   });

   $result.html(groups);
}

function searchInGroup (id, users) {
   VK.api('groups.isMember', {
      group_id: groups[id].gid,
      user_ids: users
   }, function (res) {
      var users = res.response
         .filter(function (a) { return !!a.member })
         .map(function (a) { return a.user_id });

      if(groups[id + 1]) {
         searchInGroup(id + 1, users);
      }
      else showUsers(users);
   });
}

function showUsers (users) {
   var $result = $('.result');

   if(!users.length) {
      return $result.html('No users found');
   }

   if(users.length > 100) {
      return $result.html('Find ' + users.length + ' users');
   }

   getUsers(users, function (users) {
      insertUsers(users);
   });
}

function insertUsers (users) {
   var $users = users.map(function (user) {
      var $el = createUser(user);

      $el.on('click', function () {
         window.open('https://vk.com/id' + user.uid, '_blank');
      });

      return $el;
   });

   $('.result').html($users);
}

function compareArrays (arr1, arr2) {
   var res = [];

   for(var i = 0; i < arr1.length; i++) {
      for(var k = 0; k < arr2.length; k++) {
         if(arr1[i] === arr2[k]) {
            res.push(arr1[i]);
            break;
         }
      }
   }

   return res;
}

function getAllUsers (group, callback, result) {
   result = result || [];

   VK.api('groups.getMembers', {
      group_id: group,
      sort: 'id_asc',
      offset: result.length,
      count: 1000
   }, function (res) {
      if(!res.error) {
         result = result.concat(res.response.users);
      }

      if(!res.error && result.length >= res.response.count - 1) {
         callback(result);
      }
      else {
         setTimeout(function () {
            getAllUsers(group, callback, result);
         }, 600);
      }
   });
}

function getUsers (users, callback) {
   VK.api('users.get', {
      user_ids: users,
      fields: 'photo_100'
   }, function (res) {
      callback(res.response);
   });
}

function appendReadyGroup (group) {
   var $el = createGroup(group);

   $el.on('click', function () {
      groups = groups.filter(function (g) {
         return g.gid !== group.gid;
      });

      $el.remove();
   });

   $('.selected-groups-result').append($el);
}

function addGroup (group) {
   groups.push(group);

   appendReadyGroup(group);
}

function searchGroups (text) {
   VK.api('groups.search', {
      q: text,
      fields: 'members_count',
      count: 100
   }, function (res) {
      if(res.response) {
         insertGroups(res.response.slice(1));
      }
   });
}

function createButton () {
   var $button = $('<button>').html('Login vk');

   $button.on('click', function () {
      VK.Auth.login(checkAuth);
   });

   $('.login-container').html($button);
}

function showLoginScreen () {
   createButton();
}

function showContent () {
   $('.content').show();
   $('.login-container').remove();
}

function initVK () {
   VK.init({apiId: '5155278'});
   VK.Auth.getLoginStatus(checkAuth);
}

function checkAuth(res) {
   if (res.session) showContent();
   else showLoginScreen();
}

init();