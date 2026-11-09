/**
 * IndexedDB Progress Storage
 * Stores SRS card states, quiz history, and user settings.
 */

var DB_NAME = 'insidethebrain';
var DB_VERSION = 1;

function openDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = function() { reject(request.error); };
    request.onsuccess = function() { resolve(request.result); };
    request.onupgradeneeded = function(event) {
      var db = event.target.result;
      if (!db.objectStoreNames.contains('cards')) {
        db.createObjectStore('cards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        var sessions = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessions.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

/** Save a card state */
export async function saveCard(card) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readwrite');
    tx.objectStore('cards').put(card);
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

/** Save multiple cards */
export async function saveCards(cards) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readwrite');
    var store = tx.objectStore('cards');
    cards.forEach(function(c) { store.put(c); });
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

/** Get all card states */
export async function getAllCards() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readonly');
    var request = tx.objectStore('cards').getAll();
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

/** Get a single card */
export async function getCard(id) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readonly');
    var request = tx.objectStore('cards').get(id);
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

/** Save a quiz session */
export async function saveSession(session) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('sessions', 'readwrite');
    tx.objectStore('sessions').add(Object.assign({ date: Date.now() }, session));
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

/** Get all sessions */
export async function getAllSessions() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('sessions', 'readonly');
    var request = tx.objectStore('sessions').getAll();
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

/** Clear all data */
export async function clearAll() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(['cards', 'sessions', 'settings'], 'readwrite');
    tx.objectStore('cards').clear();
    tx.objectStore('sessions').clear();
    tx.objectStore('settings').clear();
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}
