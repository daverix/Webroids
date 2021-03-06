/*
	Webroids

	Version: 1.0
	Author: David Laurell <david@laurell.nu>
	License: GPLv3

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

importScripts("common.js");

var game, gameWidth=0, gameHeight=0, lastUpdate=0, lastShot=0, lastEnemy=0, keyboardState = {};

function makeData(type, obj) {
   return {
      type: type,
      data: {
         x: obj.x,
         y: obj.y,
         rot: obj.rot,
         alive: obj.alive,
         radius: obj.radius,
         color: obj.color
      }
   };
}

function update() {
	var timeNow = new Date().getTime();

   if(lastUpdate != 0)
   {
      var elapsed = timeNow - lastUpdate;
      if(elapsed > 0)
         game.currentFPS = Math.round(1000 / elapsed);
/*
 * New Wave
 */
      if(game.asteroids.length == 0) {
         for(var i=0;i<3 + game.lvl; i++) {
            var vertical = Math.round(Math.random()) == 1;
            var ax,ay;
            if(vertical) {
               ax = Math.round(Math.random()) * gameWidth;
               ay = Math.random() * gameHeight;
            }
            else {
               ax = Math.random() * gameWidth;
               ay = Math.round(Math.random()) * gameHeight;
            }
            
            game.asteroids.push(new Asteroid(ax,ay,Math.random() * Math.PI * 2,10 + game.lvl * 2,3));
         }
         game.lvl++;
			postMessage({type: EVENT_TYPE_NEWLEVEL, lvl: game.lvl});
      }

      //new enemy
      if(lastEnemy == 0)
         lastEnemy = timeNow;

      if(timeNow - lastEnemy > 20000) {
         var vertical = Math.round(Math.random()) == 1;
         var ax,ay;
         if(vertical) {
            ax = Math.round(Math.random()) * gameWidth;
            ay = Math.random() * gameHeight;
         }
         else {
            ax = Math.random() * gameWidth;
            ay = Math.round(Math.random()) * gameHeight;
         }

         game.enemies.push(new Enemy(ax,ay));
         lastEnemy = timeNow;
      }


      if(game.player.alive) {

/*
 * Turn ship
 */
		   if(keyboardState.left) {
			   game.player.rot -= 200 * (elapsed / 1000.0) * Math.PI / 180;
            game.player.dir = game.player.rot;
         }
		   else if(keyboardState.right) {
			   game.player.rot += 200 * (elapsed / 1000.0) * Math.PI / 180;
            game.player.dir = game.player.rot;
         }
/*
 * Fire new shot
 */
         if(keyboardState.fire && timeNow - lastShot > 500) {
            var shotX = Math.cos(game.player.rot) * game.player.radius;
            var shotY = Math.sin(game.player.rot) * game.player.radius;
            game.shots.push(new Shot(game.player.x + shotX,game.player.y + shotY,game.player.rot,350, timeNow, "rgb(255,255,192)"));
            lastShot = timeNow;
         }
      }

      for(var i=0;i<game.enemies.length;i++) {
         if(game.enemies[i].lastShot == 0)
            game.enemies[i].lastShot == timeNow;

         if(timeNow - game.enemies[i].lastShot > 1500) {
            var shotX = Math.cos(game.enemies[i].rot) * game.enemies[i].radius;
            var shotY = Math.sin(game.enemies[i].rot) * game.enemies[i].radius;
            game.enemyshots.push(
               new Shot(
                  game.enemies[i].x,
                  game.enemies[i].y,
                  game.enemies[i].rot,
                  300,
                  timeNow,
               "rgb(255,64,64)")
            );
            game.enemies[i].lastShot = timeNow + Math.random() * 1000;
         }
      }

/*
 * Move objects
 */
      if(game.player.alive) {
         var velocity = 0;
         if(keyboardState.up) {
            velocity = 1;
         }
         else if(keyboardState.down) {
            velocity = -1;
         }
         game.player.speed = velocity * 3;

         game.player.move(elapsed);
      }

      for(var i=0;i<game.shots.length;i++)
         game.shots[i].move(elapsed);

      for(var i=0;i<game.enemyshots.length;i++)
         game.enemyshots[i].move(elapsed);

      for(var i=0;i<game.asteroids.length;i++)
         game.asteroids[i].move(elapsed);

      for(var i=0;i<game.asteroids.length;i++)
         game.asteroids[i].rot += (4-game.asteroids[i].size) * 50 * (elapsed / 1000.0) * Math.PI / 180;

      for(var i=0;i<game.enemies.length;i++) {
         if(game.enemies[i].lastMove == 0)
            game.enemies[i].lastMove = timeNow;

         if(timeNow - game.enemies[i].lastMove > 500) {
            game.enemies[i].dir = Math.random() * 360;
            game.enemies[i].speed = 50;
            game.enemies[i].lastMove = timeNow;
         }
         game.enemies[i].move(elapsed);
         if(game.player.alive)
            if(game.enemies[i].x - game.player.x > 0)
               game.enemies[i].rot = Math.atan( (game.enemies[i].y - game.player.y) / (game.enemies[i].x - game.player.x) ) - Math.PI;
            else
               game.enemies[i].rot = Math.atan( (game.enemies[i].y - game.player.y) / (game.enemies[i].x - game.player.x) );
         else
            game.enemies[i].rot = game.enemies[i].dir;
      }
/*
 * Check collisions between objects
 */
      var newAsteroids = [];

      //asteroids vs player & enemies
      for(var i=0;i<game.asteroids.length;i++) {
         if(game.player.alive && game.asteroids[i].alive && game.asteroids[i].isCollision(game.player)) {
            game.asteroids[i].alive = false;

            game.player.die();

				if(game.lives == 0) {
					postMessage({type: EVENT_TYPE_GAMEOVER});
				}
				else {
					postMessage({type: EVENT_TYPE_LIFELOST, lives: game.lives});
				}

            break;
         }
         
         for(var j=0;j<game.enemies.length;j++) {
            if(game.asteroids[i].alive && game.enemies[j].alive && game.enemies[j].isCollision(game.asteroids[i])) {
               game.asteroids[i].alive = false;
               game.enemies[j].alive = false;
               break;
            }
         }

         if(!game.asteroids[i].alive && game.asteroids[i].size > 1) {
            var ax = game.asteroids[i].x;
            var ay = game.asteroids[i].y;
            var size = game.asteroids[i].size-1;
            var speed = 110 + game.lvl * 10;
            for(var k=0;k<(4-size);k++) {
               newAsteroids.push(new Asteroid(ax, ay, game.player.rot - (45/(4-size) + k*45/(4-size)) / Math.PI / 180, speed, size));
            }
         }

      }

      //shots vs asteroids & enemies
      for(var i=0;i<game.shots.length;i++) {
         for(var j=0;j<game.asteroids.length;j++) {
            if(game.shots[i].alive && game.asteroids[j].alive && game.shots[i].isCollision(game.asteroids[j])) {
               game.asteroids[j].alive = false;
               game.shots[i].alive = false;
               game.points += Math.pow(2,3-game.asteroids[j].size);

               if(game.asteroids[j].size > 1) {
                  var ax = game.asteroids[j].x;
                  var ay = game.asteroids[j].y;
                  var size = game.asteroids[j].size-1;
                  var speed = 110 + game.lvl * 10;
                  for(var k=0;k<(4-size);k++) {
                     newAsteroids.push(new Asteroid(ax, ay, game.shots[i].rot - ((Math.PI/4)/(4-size) + k*(Math.PI/4)/(4-size)), speed, size));
                  }
               }
               break;
            }
         }

         for(var j=0;j<game.enemies.length;j++) {
            if(game.shots[i].alive && game.enemies[j].alive && game.shots[i].isCollision(game.enemies[j])) {
               game.enemies[j].alive = false;
               game.shots[i].alive = false;
               game.points += 100;
               break;
            }
         }
      }

      //enemyshots vs asteroids & player
      for(var i=0;i<game.enemyshots.length;i++) {
         for(var j=0;j<game.asteroids.length;j++) {
            if(game.enemyshots[i].alive && game.asteroids[j].alive && game.enemyshots[i].isCollision(game.asteroids[j])) {
               game.enemyshots[i].alive = false;
               game.asteroids[j].alive = false;

               if(game.asteroids[j].size > 1) {
                  var ax = game.asteroids[j].x;
                  var ay = game.asteroids[j].y;
                  var size = game.asteroids[j].size-1;
                  var speed = 110 + game.lvl * 10;
                  for(var k=0;k<(4-size);k++) {
                     newAsteroids.push(new Asteroid(ax, ay, game.enemyshots[i].rot * Math.PI / 180 - 45/(4-size) + k*45/(4-size), speed, size));
                  }
               }
               break;
            }
         }

         if(game.enemyshots[i].alive && game.player.alive && game.enemyshots[i].isCollision(game.player)) {
            game.enemyshots[i].alive = false;
            game.player.die();

				if(game.lives == 0) {
					postMessage({type: EVENT_TYPE_GAMEOVER});
				}
				else {
					postMessage({type: EVENT_TYPE_LIFELOST, lives: game.lives});
				}
         }
      }

      //add the new asteroids to the old ones.
      if(newAsteroids.length > 0)
         game.asteroids = game.asteroids.concat(newAsteroids);

      //delete asteroids that isnt "alive"
      for(var i=0;i<game.asteroids.length;i++) {
         if(!game.asteroids[i].alive)
            game.asteroids.splice(i,1);
      }

      //delete shots that isnt "alive"
      for(var i=0;i<game.shots.length;i++) {
         if(timeNow - game.shots[i].created > 1000) //check lifetime of shot
            game.shots[i].alive = false;

         if(!game.shots[i].alive)
            game.shots.splice(i,1);
      }
      for(var i=0;i<game.enemyshots.length;i++) {
         if(timeNow - game.enemyshots[i].created > 750) //check lifetime of shot
            game.enemyshots[i].alive = false;

         if(!game.enemyshots[i].alive)
            game.enemyshots.splice(i,1);
      }

      //delete enemies that isnt alive
      for(var i=0;i<game.enemies.length;i++) {
         if(!game.enemies[i].alive)
            game.enemies.splice(i,1);
      }

/*
 * Preparing data to send back to the main thread...
 */
      var objects = [];
      objects.push( makeData("player", game.player) );

      for(var i=0;i<game.asteroids.length;i++) {
         objects.push( makeData("asteroid", game.asteroids[i]) );
      }
      for(var i=0;i<game.shots.length;i++) {
         objects.push( makeData("shot", game.shots[i]) );
      }

      for(var i=0;i<game.enemyshots.length;i++) {
         objects.push( makeData("shot", game.enemyshots[i]) );
      }

      for(var i=0;i<game.enemies.length;i++) {
         objects.push( makeData("enemy", game.enemies[i]) );
      }

   	postMessage({
			type: EVENT_TYPE_UPDATE,
			data: {
	         objects: objects,
	         points: game.points,
	         currentFPS: game.currentFPS
			}
      });
   }

	lastUpdate = timeNow;
}
var intervalId = -1;
var updatemessage = function(e) {
	if(e.data.type == "init") {
		if(intervalId != -1) {
			clearInterval(intervalId);
		}
      gameWidth = e.data.message.width;
      gameHeight = e.data.message.height;
		game = {
         player: new Player(gameWidth/2, gameHeight/2),
         asteroids: [],
         shots: [],
         enemyshots: [],
         enemies: [],
         lvl: 0,
         points: 0,
         lives: 3,
         currentFPS: 0,
         ended: false
      };
      keyboardState = new KeyboardState();

      intervalId = setInterval(function() {
         update();
      }, 1000/60);
	}
	else if(e.data.type == "move") {
      var msg = e.data.message;

	   if(msg.key == 37) //left
		   keyboardState.left = msg.down;

	   if(msg.key == 38) //up
		   keyboardState.up = msg.down;

	   if(msg.key == 39) //right
		   keyboardState.right = msg.down;
	
      if(msg.key == 40) //down
         keyboardState.down = msg.down;

      if(msg.key == 32) //space
         keyboardState.fire = msg.down;
	}
};

onmessage = updatemessage;
