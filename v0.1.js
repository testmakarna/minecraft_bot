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
    port: 64391,
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

async function take_items_from_base(username,message){
    message = message.split(" "); // !getfrombase torch 64
    blocks = ['chest', 'ender_chest', 'trapped_chest']

    chestToOpen = bot.findBlock({
        matching: blocks.map(name => bot.registry.blocksByName[name].id),
        maxDistance: 6
      })
      if (!chestToOpen) {
        bot.chat('no chest found')
        return
      }
    
    const chest = await bot.openContainer(chestToOpen)
    sayItems(chest.containerItems())
    chest.on('updateSlot', (slot, oldItem, newItem) => {
      bot.chat(`chest update: ${itemToString(oldItem)} -> ${itemToString(newItem)} (slot: ${slot})`)
    })
    chest.on('close', () => {
      bot.chat('chest closed')
    })

    withdrawItem(message[1], message[2]);
    closeChest();
    function closeChest () {
        chest.close()
    }
    async function withdrawItem (name, amount) {
        const item = itemByName(chest.containerItems(), name)
        if (item) {
          try {
            await chest.withdraw(item.type, null, amount)
            bot.chat(`withdrew ${amount} ${item.name}`)
          } catch (err) {
            bot.chat(`unable to withdraw ${amount} ${item.name}`)
          }
        } else {
          bot.chat(`unknown item ${name}`)
        }
      }
}

bot.on('chat',async(username,message)=>{
    command = message.split(" ");
    if (command[0] == "!getfrombase"){
        await go_to_base_promise(); // Wait for the bot to reach its destination
        take_items_from_base(username,message)
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