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

var EVENT_TYPE_UPDATE = 0;
var EVENT_TYPE_GAMEOVER = 1;
var EVENT_TYPE_NEWLEVEL = 2;
var EVENT_TYPE_LIFELOST = 3;

function KeyboardState() {
   this.left = false;
	this.right = false;
   this.up = false;
   this.down = false;
   this.fire = false;
}

function GameObject() {
   this.x = 0;
   this.y = 0;
   this.vx = 0;
   this.vy = 0;
   this.speed = 0;
   this.rot = 0;
   this.dir = 0;
   this.alive = true;
   this.color = "white";
   this.move = function(elapsed) {
      var tvx = this.vx + Math.cos(this.dir) * this.speed;
      var tvy = this.vy + Math.sin(this.dir) * this.speed;

      //change velocity
      if(!this.maxVelocity || (tvx <= this.maxVelocity && tvx >= -this.maxVelocity))
         this.vx = tvx;
      if(!this.maxVelocity || (tvy <= this.maxVelocity && tvy >= -this.maxVelocity))
         this.vy = tvy;

      this.speed = 0;

      //change position
      this.x += this.vx * (elapsed / 1000.0);
      this.y += this.vy * (elapsed / 1000.0);

      //teleports the object to the other side if outside
      if(this.x > gameWidth)
         this.x -= gameWidth;
      else if(this.x < 0)
         this.x += gameWidth;

      if(this.y > gameHeight)
         this.y -= gameHeight;
      else if(this.y < 0)
         this.y += gameHeight;
   };
   this.isCollision = function(obj) {
      var len = Math.sqrt(Math.pow(this.x - obj.x,2) + Math.pow(this.y - obj.y,2));

      return len <= (this.radius + obj.radius);
   };
   this.isOutside = function(obj) {
      return (obj.x < 0 || obj.x > gameWidth || obj.y < 0 || obj.y > gameHeight);
   };
}

function Player(x, y) {
	this.x = x;
	this.y = y;
   this.radius = 12;
   this.lives = 3;
   this.points = 0;
   this.invulnerable = false;
   this.fire = false;
   this.maxVelocity = 250;
   this.color = "yellow";
   this.die = function() {
      if(!this.invulnerable) {
         this.alive = false;
         game.lives--;
         var p = this;

         if(game.lives > 0) {
            setTimeout(function() {
               var oldColor = game.player.color;
               p.color = "rgb(128,255,128)";

               p.alive = true;
               p.invulnerable = true;
               p.x = gameWidth/2;
               p.y = gameHeight/2;
               p.vx = 0;
               p.vy = 0;

               setTimeout(function() {
                  p.color = oldColor;
                  p.invulnerable = false;
               },1500);
            },1000);
         }
         else
            game.ended = true;
      }
   };
}
Player.prototype = new GameObject();

function Enemy(x, y) {
	this.x = x;
	this.y = y;
   this.radius = 12;
   this.lastShot = 0;
   this.lastMove = 0;
   this.maxVelocity = 200;
   this.color = "rgb(255,128,128)";
}
Enemy.prototype = new GameObject();

function Asteroid(x, y, rot, speed, size) {
	this.x = x;
	this.y = y;
   this.rot = rot;
   this.dir = rot;
   this.speed = speed;
   this.radius = size * 10;
   this.size = size;
   this.color = "rgb(128,192,255)";
}
Asteroid.prototype = new GameObject();

function Shot(x, y, rot, speed, created) {
   this.x = x;
   this.y = y;
   this.rot = rot;
   this.speed = speed;
   this.radius = 4;
   this.created = created;
   this.dir = rot;
}
Shot.prototype = new GameObject();
