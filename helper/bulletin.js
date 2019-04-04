const axios = require('axios');

let bulletin={};

bulletin.getlastbulletin = (url)=>{
    return axios.get(`${ url }/api/bulletin`,{
        params: {
          lastest: true
        }
      });
}



module.exports = bulletin;