// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");

if (Meteor.isClient) {
  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });

  Template.leaderboard.rendered = function () {
    var tmpl = this;

    var gridDiv = tmpl.find('#grid');
    if (!gridDiv)
      throw Error("No div #grid?");

    var columns = [
      {name: "Name", id: "name", field: "name", minWidth: 200},
      {name: "Score", id: "score", field: "score"}
    ];

    var slickGrid = new Slick.Grid(gridDiv, [], columns,
                                   {enableColumnReorder: false,
                                    enableCellNavigation: true});
    slickGrid.onClick.subscribe(function (e, info) {
      Session.set("selected_player", slickGrid.getData()[info.row]._id);
    });

    tmpl.slickGridAutorun = Deps.autorun(function () {
      var cursor = Players.find({}, {sort: {score: -1, name: 1}});
      var players = cursor.fetch();
      slickGrid.setData(players);
      slickGrid.invalidate();
    });
  };

  Template.leaderboard.destroyed = function () {
    var tmpl = this;
    tmpl.slickGridAutorun.stop();
  };
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Players.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
}
