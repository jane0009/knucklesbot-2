module.exports = [{
    'event': 'messageCreate',
    'permission': '1',
    'execute': async function(ctx, msg) {
        if (!msg.content.includes("knuckles")) return;
        if (!ctx._chans || !ctx._chans[msg.channel.id]) {
            var c = await ctx.sql._db.models.k_chans.findOne({
                where: {
                    chan_id: msg.channel.id
                }
            });
            if (!ctx._chans) ctx._chans = {};
            ctx._chans[msg.channel.id] = c ? c.dataValues.enabled : false;
        }
        //console.log(ctx._chans);
        if (!ctx._chans || !ctx._chans[msg.channel.id]) return;
        msg.channel.sendTyping();
        var dirname = ctx.util.path.join(__dirname, "..", "images");
        let dir = ctx.util.fs.readdirSync(dirname);
        let n = Math.floor(Math.random() * (dir.length));
        if (n >= dir.length) n = dir.length - 1;
        let p = ctx.util.path.join(dirname, dir[n]);
        try {
            msg.channel.createMessage("", {
                file: ctx.util.fs.readFileSync(p),
                name: "knuckles.png"
            });
        }
        catch (e) {
            console.error(e);
        }
    }
}, {
    'event': 'command',
    'name': "enable",
    'permission': '2',
    'execute': async function(ctx, args, msg) {
        if (!msg.channel || !msg.channel.guild) {
            console.log('error', !!msg.channel, !!msg.channel.guild);
            return;
        }
        var c = await ctx.sql._db.models.k_chans.findOrCreate({
            where: {
                chan_id: msg.channel.id
            },
            defaults: {
                chan_id: msg.channel.id,
                gid: msg.channel.guild.id,
                enabled: false
            }
        });
        if (!c[0] || (c[0].dataValues && c[0].dataValues.enabled)) return;
        await ctx.sql._db.models.k_chans.update({
            enabled: true
        }, {
            where: {
                chan_id: msg.channel.id
            }
        });
        if (!ctx._chans) ctx._chans = {};
        ctx._chans[msg.channel.id] = true;
        msg.channel.createMessage("done");
    }
}, {
    'event': 'command',
    'name': "disable",
    'permission': '2',
    'execute': async function(ctx, args, msg) {
        if (!msg.channel || !msg.channel.guild) {
            console.log('error', !!msg.channel, !!msg.channel.guild);
            return;
        }
        var c = await ctx.sql._db.models.k_chans.findOrCreate({
            where: {
                chan_id: msg.channel.id
            },
            defaults: {
                chan_id: msg.channel.id,
                enabled: false
            }
        });
        if (!c[0] || !(c[0].dataValues && c[0].dataValues.enabled)) return;
        await ctx.sql._db.models.k_chans.update({
            enabled: false
        }, {
            where: {
                chan_id: msg.channel.id
            }
        });
        if (!ctx._chans) ctx._chans = {};
        ctx._chans[msg.channel.id] = false;
        msg.channel.createMessage("done");
    }
}]