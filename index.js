var redis = require('redis');

module.exports = function(options) {
  var redisOptions = options.redis;
  var prefix = (typeof options.prefix === 'string') ? options.prefix : 'yowl-session:';

  var client;
  if (redisOptions instanceof redis.RedisClient) {
    client = redisOptions;
  } else if (typeof redisOptions === "object") {
    client = redis.createClient(redisOptions);
  } else if (typeof redisOptions === "undefined") {
    client = redis.createClient();
  } else {
    throw new Error("Argument must be a Redis client, Redis settings or left blank");
  }

  return function (context, event, next) {
    var id = context.uniqueId();
    client.get(prefix + id, function(err, jsonSession) {
      if (err) {
        next(err);
        return;
      }

      var session = (typeof jsonSession === "string") ? JSON.parse(jsonSession) : {};
      context.mergeSession(session.data);
      next(null, function(context, event, next) {
        var jsonSession = context.jsonDumpSession();
        client.set(prefix + id, jsonSession, next);
      });

    });
  };

};
