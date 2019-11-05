//modul mongodb utk koneksi mongo db database
var url = 'mongodb://127.0.0.1:27017/indahnyadata';
var mongoose = require('mongoose');
mongoose.connect(url, { useNewUrlParser: true });

const CekBRI = require('./CekBRI');
const cek_bri = new CekBRI();