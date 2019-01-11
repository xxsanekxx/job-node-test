const dbmodels = require('dbmodels').default;
const config = require('config');

const pg = config.get(`database.${process.env.NODE_ENV || 'development'}`);
module.exports = dbmodels(pg.database, 'postgres', pg.username, pg.password, pg.host, pg.port || 5432);
