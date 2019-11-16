module.exports = [{
    'event': 'command',
    'name': 'help',
    'description': 'get some help.',
    'execute': async function(ctx, args, msg) {
        var commands = ctx._handlers.commands;
        var msgArray = [];
        var helpStr = "```\n";
        var dm = await msg.author.getDMChannel();
        for (var c in commands) {
            var hp = await ctx._hasPerm(msg.author.id, commands[c].permission, msg);
            if (hp) {
                var toAdd = c + (commands[c].description ? "\t" + commands[c].description : "") + "\n";
                if (helpStr.length + toAdd.length > 1900) {
                    helpStr += "```";
                    msgArray.push(helpStr);
                    helpStr = "```\n";
                }
                helpStr += toAdd;
            }
        }
        helpStr += "```";
        if (msgArray.length) {
            for (var a in msgArray) {
                if (dm) {
                    dm.createMessage(msgArray[a]);
                }
            }
        }
        if (dm) {
            dm.createMessage(helpStr);
            msg.channel.createMessage("I sent you help in your DMs!");
        }
        else {
            msg.channel.createMessage("Sorry, I can't dm you!");
        }
    }
}];