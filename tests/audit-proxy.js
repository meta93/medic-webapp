var auditProxy = require('../audit-proxy.js'),
  events = require('events');

exports['filter does not match request for different db'] = function(test) {
  var db = {
    name: '/kujua-lite'
  }
  var req = {
    url: '/somedb/do-something'
  };
  auditProxy.setup({db: db, audit: {}});
  test.equals(auditProxy.filter(req), false);
  test.done();
};

exports['filter does not match GET request'] = function(test) {
  var dbName = '/kujua-lite';
  var db = {
    name: dbName
  }
  var req = {
    url: dbName + '/do-something',
    method: 'GET'
  };
  auditProxy.setup({db: db, audit: {}});
  test.equals(auditProxy.filter(req), false);
  test.done();
};

exports['filter matches POST request'] = function(test) {
  var dbName = '/kujua-lite';
  var db = {
    name: dbName
  }
  var req = {
    url: dbName + '/do-something',
    method: 'POST'
  };
  auditProxy.setup({db: db, audit: {}});
  test.equals(auditProxy.filter(req), true);
  test.done();
};

exports['filter matches DELETE request'] = function(test) {
  var dbName = '/kujua-lite';
  var db = {
    name: dbName
  }
  var req = {
    url: dbName + '/do-something',
    method: 'DELETE'
  };
  auditProxy.setup({db: db, audit: {}});
  test.equals(auditProxy.filter(req), true);
  test.done();
};

exports['filter matches PUT request'] = function(test) {
  var dbName = '/kujua-lite';
  var db = {
    name: dbName
  }
  var req = {
    url: dbName + '/do-something',
    method: 'PUT'
  };
  auditProxy.setup({db: db, audit: {}});
  test.equals(auditProxy.filter(req), true);
  test.done();
};

exports['onMatch audits the request'] = function(test) {
  test.expect(5);
  var target = 'http://localhost:4444';
  var generatedId = 'abc';
  var username = 'steve';
  var doc = {
    first: 'one',
    second: 'two'
  };
  var auditedDoc = {
    first: 'one',
    second: 'two',
    _id: generatedId
  };
  var audit = {
    withNode: function(db, cb) {
      cb(function(err, _username) {
        test.same(username, _username);
      });
      return {
        log: function(docs, _cb) {
          test.same(docs[0], doc);
          docs[0]._id = generatedId;
          _cb();
        }
      }
    }
  };
  var proxy = {
    web: function(req, res, options) {
      test.equals(target, options.target);
      test.equals(
        Buffer.byteLength(JSON.stringify(auditedDoc)), 
        options.headers['content-length']
      );
    }
  };
  var passStreamFn = function(writeFn, endFn) {
    var chunks = JSON.stringify(doc).match(/.{1,4}/g);
    chunks.forEach(function(chunk){
      writeFn(chunk, 'UTF-8', function() {});
    });
    endFn.call({push: function(body) {
      test.equals(body, JSON.stringify(auditedDoc));
    }}, function(err) {});
  };
  var req = {
    pipe: function(ps) {
      return {};
    }
  };
  var db = {
    client: {
      host: 'localhost',
      port: 5984
    }
  };
  var res = new events.EventEmitter();
  var http = {
    get: function(options, cb) {
      cb(res);
      res.emit('data', '{"userCtx": {"name": "' + username + '"}}');
    }
  };
  auditProxy.setup({audit: audit, passStream: passStreamFn, db: db, http: http});
  auditProxy.onMatch(proxy, req, {}, target);
  test.done();
};

