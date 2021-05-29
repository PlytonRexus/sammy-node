const Queue = require('bull');

const { redisOpts } = require('./xtools')

const sdQueue = new Queue('sd', redisOpts);
const upQueue = new Queue('up', redisOpts);

module.exports = {sdQueue, upQueue}
