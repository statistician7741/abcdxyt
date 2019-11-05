var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var YtuberSchema = new Schema({
    "_id": String,
    "nama_channel": String,
    "img_link": String,
    "subscribers": Array,
    "views": Array,
    "total_subs_weekly": Array,
    "total_views_weekly": Array,

}, { collection: 'ytuber' });

module.exports = mongoose.model('Ytuber', YtuberSchema);