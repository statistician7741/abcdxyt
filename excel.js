var url = 'mongodb://127.0.0.1:27017/indahnyadata';
var mongoose = require('mongoose');
mongoose.connect(url, { useNewUrlParser: true });
const XlsxPopulate = require('xlsx-populate');
const Ytuber = require('./model/mutasi.model')
const fs = require('fs')
const moment = require('moment')
moment.locale('id')

XlsxPopulate.fromFileAsync(__dirname + "/youtuber.xlsx")
    .then(workbook => {
        let sheet = workbook.sheet(0);
        let row = 1;
        //ambil semua youtuber
        Ytuber.find({}, (e, all_youtubers) => {
            console.log(all_youtubers.length);
            //ambil semua timestamp
            let all_rows = [];
            let all_timestamp_temp = [];
            all_youtubers.forEach((youtubers, j) => {
                youtubers.subscribers.forEach((subsByTime, i) => {
                    all_timestamp_temp.push(subsByTime[0]);
                })
            })

            //urutkan timestamp
            all_timestamp_temp = all_timestamp_temp.sort(function (a, b) { return a - b });

            //finalisasi pembentukan timestamp
            let all_timestamp = {};

            all_timestamp_temp.forEach((ts, j) => {
                all_timestamp[ts] = '';
            })

            // console.log(all_timestamp);
            // return;

            //kosongkan semua channel timestamp
            all_youtubers.forEach((youtubers, j) => {
                youtubers.subscribers.forEach((subsByTime, i) => {
                    all_timestamp[subsByTime[0]] = '';
                })
            })
            // console.log(all_timestamp);

            //isi semua timestamp
            all_youtubers.forEach((youtuber, j) => {
                let sum = 0;
                all_rows[youtuber.id] = Object.assign({ nama_channel: '', img: '', total_subs: 0 }, all_timestamp);
                all_rows[youtuber.id]['nama_channel'] = youtuber.nama_channel;
                all_rows[youtuber.id]['img'] = youtuber.img_link;
                all_rows[youtuber.id]['total_subs'] = +youtuber.total_subs_monthly[0][1];
                youtuber.subscribers.forEach((subsByTime, i) => {
                    all_rows[youtuber.id][subsByTime[0]] = +subsByTime[1];
                })
            })

            // console.log( all_rows[ all_youtubers[0]._id ] );

            //TIMESTAMP ROWS
            let r = sheet.cell(`A${row++}`);
            let all_columnsts = ['nama_channel', 'img', 'total_subs']
            for (var ts in all_timestamp) {
                if (all_timestamp.hasOwnProperty(ts)) {
                    if( ts === 'nama_channel' || ts === 'img' || ts === 'total_subs' ) all_columnsts.push(ts)
                     else{
                         all_columnsts.push(moment.unix((+ts)/1000).format('DD MMM YYYY'))
                     }
                }
            }
            r.value(
                [all_columnsts]
            );

            //CHANNEL ROWS
            for (var channel in all_rows) {
                //posisi baris
                let r = sheet.cell(`A${row++}`);
                if (all_rows.hasOwnProperty(channel)) {
                    let all_columns = []
                    for (var prop in all_rows[channel]) {
                        if (all_rows[channel].hasOwnProperty(prop)) {
                            all_columns.push(all_rows[channel][prop])
                        }
                    }
                    // //ambil total gain
                    const all_columns_temp = all_columns.map((c, i) => {
                        if( c === '' || i < 3 ) return 0;
                            else return c
                    })
                    const total_subs_gain = all_columns_temp.reduce((a, b) => a + b)
                    //ambil selisih yg tdk dicakup gain
                    const total_subs_before = all_rows[channel]['total_subs'] - total_subs_gain;
                    let sum = total_subs_before;
                    all_columns = all_columns.map((c, i) => {
                        if( c === '' || i < 3 ) return c;
                            else{
                                sum += c;
                                return sum;
                            }
                    })
                    r.value(
                        [all_columns]
                    );
                }
            }

            workbook.toFileAsync(__dirname + `/youtuber_ok.xlsx`);

            // all_youtubers.forEach((youtuber, j) => {
            //     //posisi baris
            //     let r = sheet.cell(`A${row++}`);
            //     //urutkan berdasarkan waktu
            //     const sorting_subs_gain = youtuber.subscribers.sort(function(a, b){return b[0] - a[0]});
            //     //ambil gain subsnya aja
            //     const subs_gain = sorting_subs_gain.map(subsc => {
            //         // console.log(subsc);
            //         return subsc[1]
            //     })
            //     //ambil total gain
            //     const total_subs_gain = subs_gain.reduce( (a,b)=> a+b )
            //     //ambil selisih yg tdk dicakup gain
            //     const total_subs_before = youtuber.total_subs_monthly[0][1] - total_subs_gain
            //     //total kumulatif awal
            //     let sum = total_subs_before>-1?total_subs_before:0;
            //     //hitung kumulatif tiap gain
            //     let final_subs_gain = subs_gain.map(s => {
            //         sum += s;
            //         return sum;
            //     })
            //     //tulis ke excel
            //     r.value(
            //         [[youtuber.nama_channel, youtuber.img_link].concat(final_subs_gain)]
            //     );
            //     //write file
            //     if (fs.existsSync(__dirname + `/youtuber_ok.xlsx`)) {
            //         fs.unlinkSync(__dirname + `/youtuber_ok.xlsx`);
            //     }
            // })
            // workbook.toFileAsync(__dirname + `/youtuber_ok.xlsx`);
        })
    }).then(dataa => {
        console.log('Finished');
        // process.exit();
    })