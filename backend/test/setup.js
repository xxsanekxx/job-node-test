const fixtures = require('./fixtures');
const { sequelize, db } = require('../lib/connection');

module.exports = () => {
  sequelize.sync({ force: true })
    .then(() => Promise.all(Object.entries(fixtures).map(val => db[val[0]].bulkCreate(val[1]))))
    .then(() => sequelize.close());
};
