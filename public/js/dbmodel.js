
ann.db = {}
ann.waitForGlobal('Dexie', function(){
  
    ann.db = new Dexie("aria");

    ann.db.version(1).stores({
        ticker: `
          id,
          created,
          prices`
      });
      ann.db.version(1).stores({
        currency: `
            id,
            type,
            request,
            created`
        });

    ann.db.get = async function get(db, key) {        
        return await db.get(key)
    }
    ann.db.update = async function get(db, data, key) {        
        return await db.update(key,data)
    }

    ann.db.bulkPut = async function bulkPut(db, json) {
            db.bulkPut([json])
    }
    ann.db.bulkGet = async function bulkGet(db, keys) {
        if(!keys) {
            return db.toArray()
        }
        return db.bulkGet(keys)
    }
    ann.db.bulkDelete = async function bulkDelete(db, keys) {
        console.log('db, keys :', db, keys);
        if(!keys) {
            return;
        }
        return db.bulkDelete(keys)
    }

})