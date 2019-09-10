const mongoose = require('mongoose');

const experimentSchema = mongoose.Schema({
  name: { type: String },
  categories: { type: Array},
  first_ver_id: {type: String},
  version: {type: Number},
  latest_ver: {type: Boolean},
  prev_ver_exp_id: {type: String},
  date_of_creation: {type: String},
  viewed_tab_when_saved: {type: Object}
});


module.exports = mongoose.model('Experiment', experimentSchema);
