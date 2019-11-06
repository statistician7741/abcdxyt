var url = 'mongodb://127.0.0.1:27017/indahnyadata';
var mongoose = require('mongoose');
mongoose.connect(url, { useNewUrlParser: true });
const XlsxPopulate = require('xlsx-populate');
const Ytuber = require('./model/mutasi.model')
const fs = require('fs')
const moment = require('moment')

XlsxPopulate.fromFileAsync(__dirname + "/youtuber.xlsx")
    .then(workbook => {
        let sheet = workbook.sheet(0);
        let row = 2;
        Ytuber.find({}, (e,youtubers)=>{
            console.log(youtubers.length);
            youtubers.forEach((youtuber, j) => {
                let r = sheet.cell(`A${row++}`);
                // console.log(youtuber.subscribers);
                const sorting_subs_gain = youtuber.subscribers.sort(function(a, b){return b[0] - a[0]});
                // console.log(sorting_subs_gain);
                const subs_gain = sorting_subs_gain.map(subsc => {
                    // console.log(subsc);
                    return subsc[1]
                })
                const total_subs_gain = subs_gain.reduce( (a,b)=> a+b )
                const total_subs_before = youtuber.total_subs_monthly[0][1] - total_subs_gain
                let sum = total_subs_before>-1?total_subs_before:0;
                let final_subs_gain = subs_gain.map(s => {
                    sum += s;
                    return sum;
                })
                r.value(
                    [[youtuber.nama_channel, youtuber.img_link].concat(final_subs_gain)]
                );
                if (fs.existsSync(__dirname + `/youtuber_ok.xlsx`)) {
                    fs.unlinkSync(__dirname + `/youtuber_ok.xlsx`);
                }
            })
            workbook.toFileAsync(__dirname + `/youtuber_ok.xlsx`);
        })
    }).then(dataa => {
        console.log('Finished');
    })