ctx.inventory = {};
ctx.inventory._inventories = []
var db = ctx.sql._db;
var sequelize = ctx.sql._sequelize;
const Users_Schema = db.define('k_user', {
    uid: {
        type: sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    permission: {
        type: sequelize.INTEGER,
        defaultValue: 0
    }
});
const Stats_Schema = db.define('k_stats', {
    uid: {
        type: sequelize.STRING,
        primaryKey: true,
        unique: false
    },
    stat_name: {
        type: sequelize.STRING
    },
    count: {
        type: sequelize.INTEGER,
        defaultValue: 0
    }
});

const Channels_Schema = db.define('k_chans', {
    chan_id: {
        type: sequelize.STRING,
        primaryKey: true,
        unique: true
    },
    gid: {
        type: sequelize.STRING,
        unique: false
    },
    enabled: {
        type: sequelize.BOOLEAN
    }
});

module.exports = [];
Users_Schema.sync();
Stats_Schema.sync();
Channels_Schema.sync();