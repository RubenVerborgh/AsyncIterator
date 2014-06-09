var Iterator = require('../pullme').Iterator;

var EventEmitter = require('events').EventEmitter;

describe('Iterator', function () {
  describe('The Iterator module', function () {
    it('should make Iterator objects', function () {
      Iterator().should.be.an.instanceof(Iterator);
    });

    it('should be a Iterator constructor', function () {
      new Iterator().should.be.an.instanceof(Iterator);
    });

    it('should make EventEmitter objects', function () {
      Iterator().should.be.an.instanceof(EventEmitter);
    });

    it('should be a EventEmitter constructor', function () {
      new Iterator().should.be.an.instanceof(EventEmitter);
    });
  });

  describe('A default Iterator instance', function () {
    var iterator;
    before(function () { iterator = new Iterator(); });

    it('should throw an error when trying to read', function () {
      (function () { iterator.read(); })
      .should.throw('The read method has not been implemented.');
    });

    it('should not have ended', function () {
      iterator.ended.should.be.false;
    });
  });
});
