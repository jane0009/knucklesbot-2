const Eris = require('eris');
const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');
//
var config = require('./config.json');
var bot = new Eris(config.token);
var extpath = config.extdir || path.join(__dirname, 'ext');
//
var msgQ = [];
bot.on('ready', () => {
    console.log('logged in');
});
global.ctx = { bot: bot, oid: config.oid, settings: { prefix: config.prefix || "knuckles " }, util: {fs: fs, path: path}, sql: { _sequelize: sequelize } };
ctx.sql._db = new sequelize(config.sql.dbname || 'postgres', config.sql.username || "postgres", config.sql.password || "", {
    host: config.sql.host || 'localhost',
    port: config.sql.port || '5432',
    dialect: 'postgres',
    logging: false
});
var db = ctx.sql._db;
//
ctx._handlers = {};
ctx._handlers.events = {};
ctx._handlers.commands = {};
ctx._stat_cache = {};
perm_cache = { _timeout: 4 };
var fucked = {};

function reload(event) {
    fucked = {};
    if (event) {
        _rl(event);
    }
    else {
        for (var h in ctx._handlers.events) {
            _rl(h);
        }
    }
}
ctx.reload = reload;

function _rl(e) {
    bot.removeAllListeners(e);
    bot.on(e, (main, ...ev) => {
        var eventName = e;
        var hnd = ctx._handlers.events[eventName];
        for (var func in hnd) {
            hnd[func].execute(ctx, main, ...ev);
        }
    });
}

function addListener(ev, func) {
    var t = !!ctx._handlers.events[ev];
    if (!t) ctx._handlers.events[ev] = [];
    ctx._handlers.events[ev].push(func);
    if (!t) reload(ev);
}

function loadExt(extension) {
    var x = path.join(extpath, (extension.endsWith('.js') ? extension : extension + ".js"));
    if (require.cache[x]) delete require.cache[x];
    if (!fucked[extension]) {
        var loaded_ext;
        try {
            loaded_ext = require(x);
        }
        catch (e) {
            console.error(e);
            var m = e.message + (e.stack || "");
            msgQ.push("ERROR! loading " + x + ":\n```bash\n" + (m.length > 1000 ? m.slice(0, 1000) + "..." : m) + "\n```");
            fucked[extension] = true;
        }
        if (loaded_ext) {
            if (Array.isArray(loaded_ext)) {
                for (var xt in loaded_ext) {
                    loaded_ext[xt]._path = x;
                    loaded_ext[xt]._name = extension + "/" + (loaded_ext[xt].name || xt);
                    _load(loaded_ext[xt]);
                }
            }
            else {
                loaded_ext._path = x;
                loaded_ext._name = extension;
                _load(loaded_ext);
            }
        }
    }
}

function _load(loaded_ext) {
    if (!loaded_ext.disabled && loaded_ext.event && loaded_ext.execute) {
        if (loaded_ext.event == 'command') {
            if (loaded_ext.name || loaded_ext._name) {
                if (!loaded_ext.permission) loaded_ext.permission = 0;
                ctx._handlers.commands[loaded_ext.name || loaded_ext._name] = loaded_ext;
            }
            else {
                console.warn('no command name!' + loaded_ext._path);
            }
        }
        else {
            addListener(loaded_ext.event, loaded_ext);
        }
        console.log('loaded', loaded_ext._name + "!");
    }
}
ctx.loadExt = loadExt;

function loadAllExt() {
    var list = fs.readdirSync(extpath);
    for (var file in list) {
        if (list[file].endsWith('.js')) {
            loadExt(list[file]);
        }
    }
}

function forceReloadAll() {
    ctx._handlers.events = {};
    ctx._handlers.commands = {};
    addListener('messageCreate', { execute: command, event: 'messageCreate' });
    loadAllExt();
}
ctx._forceReloadAll = forceReloadAll;
ctx.addListener = addListener;

function parse(command) {
    var retn = {};
    var c = command.split(" ");
    if (ctx._handlers.commands[c[0]]) {
        retn.cmd = c[0];
        retn.args = command.slice(c[0].length + 1);
    }
    return retn;
}

function isAdmin(id, guild) {
    if (!guild) return false;
    var perm = guild.members.get(id).permission.has('administrator');
    return perm;
}
async function permission(id, perm, msg) {
    if (!perm_cache._timeout) {
        perm_cache = { _timeout: 4 };
    }
    else {
        perm_cache._timeout--;
    }
    if (!perm_cache[id]) {
        var user = await db.models.k_user.findOrCreate({
            where: {
                uid: id
            }
        });
        perm_cache[id] = user[0].dataValues.permission || 0;
    }
    return (perm_cache[id] >= perm) || (perm <= 1 && isAdmin(id, msg.channel.guild || undefined) || (id == ctx.oid));
}
ctx._hasPerm = permission;

function invalidate_perm_cache(id) {
    if (id) {
        delete perm_cache[id];
    }
    else {
        perm_cache = { _timeout: 4 };
    }
}
ctx._invalidate_perm_cache = invalidate_perm_cache;
async function save() {
    console.log('save stats');
    for (var user in ctx._stat_cache) {
        var u = ctx._stat_cache[user];
        for (var stat in u) {
            var s = u[stat];
            await db.models.k_stats.findOrCreate({
                where: {
                    uid: user,
                    stat_name: stat
                },
                defaults: {
                    uid: user,
                    stat_name: stat,
                    count: 0
                }
            }).catch(e => { console.error(e) });
            await db.models.k_stats.update({
                count: s
            }, {
                where: {
                    uid: user,
                    stat_name: stat
                }
            });
        }
    }
}
ctx._save_stats = save;
async function load_stats() {
    var all_stats = await db.models.k_stats.findAll();
    for (var s in all_stats) {
        var st = all_stats[s];
        if (st && st.dataValues) {
            var dv = st.dataValues;
            if (!ctx._stat_cache[dv.uid]) ctx._stat_cache[dv.uid] = {};
            console.log('load stat', dv.uid, dv.stat_name, dv.count);
            ctx._stat_cache[dv.uid][dv.stat_name] = dv.count;
        }
    }
}

function inc_stat(id, stat_name) {
    if (!ctx._stat_cache[id]) ctx._stat_cache[id] = {};
    if (!ctx._stat_cache[id][stat_name]) ctx._stat_cache[id][stat_name] = 0;
    ctx._stat_cache[id][stat_name]++;
}
ctx._increment_stat = inc_stat;

function command(ctx, msg) {
    if (msg.content.startsWith(ctx.settings.prefix)) {
        var res = parse(msg.content.slice(ctx.settings.prefix.length));
        if (res.cmd) {
            permission(msg.author.id, ctx._handlers.commands[res.cmd].permission, msg).then(p => {
                if (p) {
                    ctx._handlers.commands[res.cmd].execute(ctx, res.args, msg)
                    inc_stat(msg.author.id, "cmd_" + res.cmd);
                }
                else {
                    msg.channel.createMessage("disallowed");
                }
            });
        }
    }
}
bot.connect();
forceReloadAll();
load_stats();
setInterval(save, (5 * 60 * 1000));
setInterval(() => {
    if (msgQ.length) {
        for (var msg in msgQ) {
            bot.createMessage('532719289778569237', msgQ[msg]);
            delete msgQ[msg];
        }
    }
}, 300);