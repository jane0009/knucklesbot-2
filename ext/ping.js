module.exports = {
    'event': 'command',
    'name': 'ping',
    'execute': function(ctx, args, msg) {
        msg.channel.createMessage("ping pong");
    }
}