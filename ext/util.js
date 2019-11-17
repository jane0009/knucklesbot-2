module.exports = [{
        'prerequisites': [],
        'event': 'command',
        'name': 'pull',
        'description': 'dev only',
        'permission': 2,
        'execute': function(ctx, args, msg) {
            var exec = require('child_process').exec;
            exec('git pull', (err, stdout) => {
                if (err) {
                    console.error(err);
                    msg.channel.createMessage("```bash\nERROR!\n" + stdout + "\n```");
                }
                else {
                    msg.channel.createMessage("```bash\n" + stdout + "\n```");
                }
            });
        }
    },
    {
        'prerequisites': [],
        'event': 'command',
        'name': 'reload',
        'description': 'dev only',
        'permission': 2,
        'execute': function(ctx, args, msg) {
            msg.channel.createMessage("reloading.");
            ctx._forceReloadAll();
        }
    },
    {
        'prerequisites': [],
        'event': 'command',
        'name': 'perm',
        'description': 'superdev only',
        'permission': 3,
        'execute': async function(ctx, args, msg) {
            var db = ctx.sql._db;
            var c = args.split(" ");
            var id = c[0];
            var val = c[1] || 0;
            await db.models.k_user.update({
                permission: val
            }, {
                where: {
                    uid: id
                }
            });
            ctx._invalidate_perm_cache(id);
            msg.channel.createMessage('done. ' + id + " " + val);
        }
    },
    {
        'event': 'command',
        'name': 'die',
        'description': 'superdev only',
        'permission': 3,
        'execute': async function(ctx, args, msg) {
            await msg.channel.createMessage('ok');
            await ctx._save_stats();
            process.exit(0);
        }
    },
    {
        'event': 'command',
        'name': 'eval',
        'description': 'superdev only',
        'permission': 3,
        'execute': async function(ctx, args, msg) {
            let opt;
            if (args.includes("bot.token"))
                args = "\"AAAAAAAAAAAAAAAAAAAAAAAA.AAAAAA._AAAAAAAAAAAAAAAAAAAAAAAAAB\""
            try {
                opt = eval(args);
            }
            catch (e) {
                opt = "!! ERROR !! " + e;
            }
            if (opt == "" && typeof opt == String) {
                opt = "no output...";
            }
            else if (opt == undefined) {
                opt = 'undefined';
            }
            else if (opt == "") {
                opt = opt + "";
            }
            msg
                .channel
                .createMessage("returns: " + opt);
        }
    },
    {
        'event': 'command',
        'name': 'stats',
        'description': 'get user stats',
        'permission': 2,
        'execute': async function (ctx, args, msg) {
            var stats = await ctx.sql._db.models.k_stats.findAll({
                where: {
                    uid: msg.author.id
                }
            });
            var str = 'stats for ' + msg.author.username + '`';
            if (Object.keys(stats).length == 0) {
                str += "no stats found";   
            }
            for (var value in stats) {
                str += stats[value].dataValues.stat_name + "\t" + stats[value].dataValues.count + "\n";
            }
            str += '`';
            if (str.length >= 2000) {
                var arr = [];
                for (var i = 0; i < str.length; i += 1000) {
                    msg.channel.createMessage((i > 500 ?'`' : '') + str.slice(i, i + 1000) + (i + 1000 < str.length ? '`' : ''));
                }
            }
            else {
                msg.channel.createMessage(str);
            }
        }
    }
];