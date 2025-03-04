const { collection, addDoc, getDocs, doc, query, where} = require("firebase/firestore"); 

module.exports = {
  write: async (database, itemId, user, type) => {
    try {
      const ref = database.ref('recipies'); 
      const newRef = await ref.add({
        itemId: itemId,
        user: user,
        type: type
      });
      console.log("Document written with ID: ", newRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  },
  exists: async (database, itemId, user) => {
    try {
      const ref = database.ref("recipies") 
      const query = ref.query({
        where: [['itemId', '==', itemId], ["user", "==", user]],
      });     
      const results = await query.run();  
      return results.length > 0;
    } catch (e) {
      console.error(`Error adding document: '${itemId}' for user '${user}'`, e);
    }
  },
  getCrafters: async (database, itemId) => {
    try {
      const ref = database.ref("recipies") 
      //const query = ref.query({
      //  where: [['itemId', '==', itemId]],
      //});
      console.log(itemId) 
      const query = ref.query({
        where: [['itemId', '==', itemId]]
      });

      const results = await query.run(); 
      return results.map(e => e.user);
    } catch (e) {
      console.error(`Error getting crafters for item: '${itemId}'`, e);
    }
  },
  getAllRecipies: async (database) => {
    try {
      const q = database.ref("recipies");
      const querySnapshot = await q.list();
      return querySnapshot.documents;
    } catch (e) {
      console.error(`Error getting all crafters for all recipies'`, e);
    }
  }
};