const MinecraftData = require('minecraft-data');
const mineflayer = require('mineflayer');//importing mineflayer
const { pathfinder, Movements, goals,} = require('mineflayer-pathfinder');
const { GoalNear } = require('mineflayer-pathfinder').goals;

const GoalFollow =  goals.GoalFollow;

const locations = {
    base: [323,-60,306]
}

const options = { 
    // config for the bot can be changed if required
    // should be changed from the gui in the final version

    host: 'localhost',
    port: 51203,
    username: 'Obamakarna314', // if bot gona join real minecraft servers it will need a real minecraft account username and password
    //  password: 
    version: '1.19',
};

const bot = mineflayer.createBot(options);

//  functions for chest interactions from https://github.com/PrismarineJS/mineflayer/blob/master/examples/chest.js


function itemToString (item) {
    if (item) {
      return `${item.name} x ${item.count}`
    } else {
      return '(nothing)'
    }
}
  
function itemByType (items, type) {
    let item
    let i
    for (i = 0; i < items.length; ++i) {
      item = items[i]
      if (item && item.type === type) return item
    }
    return null
}
  
function itemByName (items, name) {
    let item
    let i
    for (i = 0; i < items.length; ++i) {
      item = items[i]
      if (item && item.name === name) return item
    }
    return null
}

function itemByName_toss (name) {
    const items = bot.inventory.items()
    if (bot.registry.isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) items.push(bot.inventory.slots[45])
    return items.filter(item => item.name === name)[0]
}
function sayItems (items = bot.inventory.items()) {
    const output = items.map(itemToString).join(', ')
    if (output) {
      bot.chat(output)
    } else {
      bot.chat('empty')
    }
}

bot.on('chat',(username,message)=>{
    if (message == "open chest"){
        watchChest(false, ['chest', 'ender_chest', 'trapped_chest'])
    }
})

async function tossItem (name, amount) {
    amount = parseInt(amount, 10)
    const item = itemByName_toss(name)
    if (!item) {
      bot.chat(`I have no ${name}`)
    } else {
      try {
        if (amount) {
          await bot.toss(item.type, null, amount)
        } else {
          await bot.tossStack(item)
        }
      } catch (err) {
        bot.chat(`unable to toss: ${err.message}`)

      }
    }
}//________________________________

bot.loadPlugin(pathfinder);

function go_to_base_promise() {
    return new Promise((resolve, reject) => {
        const defaultMove = new Movements(bot);
        const targetPoint = new GoalNear(locations.base[0], locations.base[1], locations.base[2], 1);
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(targetPoint);
        bot.on('goal_reached', () => {
            resolve(); // Resolve the promise when the bot reaches its destination
        });
    });
}

function followPlayer_promise(username, message) {
  return new Promise((resolve, reject) => {
      const player = bot.players[username];

      if (!player || !player.entity) {
          bot.chat("I can't see CI!")
          reject("Player not found or has no entity");
      } else {
          const mcData = require('minecraft-data')(bot.version)
          const movements = new Movements(bot, mcData)

          bot.pathfinder.setMovements(movements)

          const goal = new GoalFollow(player.entity, 1)
          bot.pathfinder.setGoal(goal, false)

          bot.on('goal_reached', (goal) => {
              if (goal instanceof GoalFollow) {
                  bot.chat("I am here");
                  resolve("Successfully started following the player");
              }
          });

          
      }
  });
}

async function take_items_from_base(username,message){
    message = message.split(" "); // !getfrombase torch 64
    blocks = ['chest', 'ender_chest', 'trapped_chest']

    chestToOpen = bot.findBlock({
        matching: blocks.map(name => bot.registry.blocksByName[name].id),
        maxDistance: 6
      })
      if (!chestToOpen) {
        return
      }
    
    const chest = await bot.openContainer(chestToOpen)
    // sayItems(chest.containerItems())
    chest.on('updateSlot', (slot, oldItem, newItem) => {
    })
    chest.on('close', () => {
    })

    withdrawItem(message[1], message[2]);
    console.log("message1"+message[1]+" mesagge2"+ message[2])
    closeChest();
    function closeChest () {
        chest.close()
    }
    async function withdrawItem (name, amount) {
        const item = itemByName(chest.containerItems(), name)
        if (item) {
          try {
            await chest.withdraw(item.type, null, amount)
          } catch (err) {
          }
        } else {
        }
      }
}

bot.on('chat',async(username,message)=>{
    command = message.split(" ");
    if (command[0] == "!getfrombase"){ // 
        await go_to_base_promise(); // Wait for the bot to reach its destination
        take_items_from_base(username,message);
        await followPlayer_promise(username,message);
        console.log("0 " + command[0]+"1 " + command[1] + "2 " + command[2])
        await tossItem(command[1],command[2]);
        console.log("tossed");
    }
}) 

function go_to_cordinate(username,message){
    
    message = message.split(" "); 
    // how to use => !goto 323 -60 -322

    const defaultMove = new Movements(bot);
    const targetPoint = new GoalNear(message[1],message[2],message[3],1)
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(targetPoint);

}

bot.on('chat', (username,message)=>{
    if (message.split(" ")[0] == "!goto"){
        go_to_cordinate(username,message)
    }
});

function go_to_base(){
    const defaultMove = new Movements(bot);
    const targetPoint = new GoalNear(locations.base[0],locations.base[1],locations.base[2],1)
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(targetPoint);
}
bot.on('chat',(username,message)=>{
    if (message === "!gotobase"){
        go_to_base();
    }
})



/*bot.once('spawn', () => {
    const defaultMove = new Movements(bot);
    
    const targetPoint = new GoalNear(323, -60, 322, 1);
  
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(targetPoint);
  });
  */