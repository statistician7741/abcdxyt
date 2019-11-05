const moment = require('moment');
const cheerio = require('cheerio');
const async = require('async');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Mutasi = require('./model/mutasi.model')
const puppeteer = require('puppeteer');
const cloudscraper = require('cloudscraper');

const Ytuber = require('./model/mutasi.model')

const { Curl, CurlFeature } = require('node-libcurl');
Curl.defaultUserAgent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36";

module.exports = class CekBRI {

    constructor() {
        //target link
        this._urlList = 'https://socialblade.com/youtube/top/country/id/mostsubscribed';
        // this._urlPrefix = 'https://socialblade.com/youtube/channel/UCaKLg1ELiX0zTJ6Je3c5esA/monthly'
        this._links = [];
        this._step = 1;
        //cookie path
        this._cookiePath = path.join(__dirname, 'cookiejar.txt');
        if (!fs.existsSync(this._cookiePath)) {
            fs.writeFileSync(this._cookiePath)
        }

        //new agent
        this.curl = new Curl();
        //set default options
        this.curl.setOpt(Curl.option.COOKIEJAR, this._cookiePath);
        this.curl.setOpt(Curl.option.COOKIEFILE, this._cookiePath);
        this.curl.setOpt(Curl.option.SSL_VERIFYHOST, 0);
        this.curl.setOpt(Curl.option.SSL_VERIFYPEER, 0);
        this.curl.setOpt(Curl.option.FOLLOWLOCATION, 1);
        //error handler
        this.curl.on('error', (err) => {
            console.log(err);
        })

        this.run();
    }

    run() {
        async.auto({
            getListHtml: (cb) => {
                this._step = 1;
                this.getListHtml(cb)
            },
            getYtuberData: ['getListHtml', (prev, cb) => {
                // cb(null, 'getListHtml ok')
                this._step = 2;
                let task = [];
                this._links.forEach((link, i) => {
                    task.push((cb_1) => {
                        if (link) {
                            this.getYtuberHtml(link, cb_1)
                        } else {
                            cb_1(null, `Invalid: ${link}`)
                        }
                    })
                })

                async.series(task, (e_f, final) => {
                    if (e_f) console.log(e_f)
                    else {
                        console.log(final);
                        cb(null, 'ok')
                    };
                })
            }
            ]
        }, (err, finish_result) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Done.');
                this.curl.close();
            }
        })
    }

    getListHtml(cb) {
        //set url login
        this.curl.setOpt(Curl.option.URL, this._urlList);
        let loginRawHTML = '';
        this.curl.setOpt(Curl.option.WRITEFUNCTION, (buff, nmemb, size) => {
            loginRawHTML += buff.toString();
            return buff.length;
        })
        this.curl.on('end', () => {
            this._loginRawHTML = loginRawHTML;
            const $ = cheerio.load(this._loginRawHTML)
            const divs = $('#sort-by').nextAll()
            let i = 1;
            divs.each((i, div) => {
                const results = $(div).html().match(/\/youtube\/user\/.*(?=\"\>)/);
                if (results) {
                    this._links.push(results[0])
                    // console.log((i++)+'. '+results[0]);
                }
            })
            if (this._step === 1) {
                cb(null, 'getListHtml ok')
            }
        })
        //perform request
        console.log('1. Opening list page...');
        this.curl.perform();
    }

    getYtuberHtml(channel, cb) {
        console.log('2. Opening ' + channel + ' page...');
        let ytuber_link = `https://socialblade.com${channel.replace(/\/user\//, '/channel/UC')}/monthly`
        Ytuber.findOne({ _id: ytuber_link }, (e, res_f) => {
            if (e) console.log(e);
            else if (res_f) {
                cb(null, `Done`);
                return;
                console.log(`3. Updating `, ytuber_name);
                Ytuber.updateOne({
                    "_id": ytuber_link
                }, {
                    "nama_channel": ytuber_name,
                    "img_link": ytuber_img,
                    "subscribers": ytuber_subscribers_data,
                    "views": ytuber_views_data,
                }, (err, res) => {
                    if (err) console.log(err);
                    if (this._step === 2) {
                        cb(null, `Done: ${ytuber_name}`)
                    }
                })
            } else {
                cloudscraper.get(ytuber_link).then((html) => {
                    const pages = html.replace(/\r?\n|\r|\s/g, '');
                    const $ = cheerio.load(html);
                    const element = $('#YouTubeUserTopInfoAvatar');
                    const ytuber_img = element.attr('src');
                    const ytuber_name = element.attr('alt');
                    const data = pages.match(/(?<=data:)(\[.*?\]\])/g)
                    //jika link valid
                    if (data) {
                        const ytuber_subscribers_data = data[0];
                        const ytuber_views_data = data[1];
                        Ytuber.findOne({ _id: ytuber_link }, (e, res_f) => {
                            if (e) console.log(e);
                            else if (res_f) {
                                cb(null, `Done: ${ytuber_name}`);
                                return;
                                console.log(`3. Updating `, ytuber_name);
                                Ytuber.updateOne({
                                    "_id": ytuber_link
                                }, {
                                    "nama_channel": ytuber_name,
                                    "img_link": ytuber_img,
                                    "subscribers": ytuber_subscribers_data,
                                    "views": ytuber_views_data,
                                }, (err, res) => {
                                    if (err) console.log(err);
                                    if (this._step === 2) {
                                        cb(null, `Done: ${ytuber_name}`)
                                    }
                                })
                            } else {
                                console.log(`3. Creating `, ytuber_name);
                                Ytuber.create({
                                    "_id": ytuber_link,
                                    "nama_channel": ytuber_name,
                                    "img_link": ytuber_img,
                                    "subscribers": ytuber_subscribers_data,
                                    "views": ytuber_views_data,
                                }, (err, res) => {
                                    if (err) console.log(err);
                                    if (this._step === 2) {
                                        cb(null, `Done: ${ytuber_name}`)
                                    }
                                })
                            }
                        })
                    } else { //jika tdk valid
                        ytuber_link = `https://socialblade.com${channel.replace(/\/user\//, '/channel/')}/monthly`
                        cloudscraper.get(ytuber_link).then((html) => {
                            const pages = html.replace(/\r?\n|\r|\s/g, '');
                            const $ = cheerio.load(html);
                            const element = $('#YouTubeUserTopInfoAvatar');
                            const ytuber_img = element.attr('src');
                            const ytuber_name = element.attr('alt');
                            const data = pages.match(/(?<=data:)(\[.*?\]\])/g)
                            const ytuber_subscribers_data = data[0];
                            const ytuber_views_data = data[1];
                            Ytuber.findOne({ _id: ytuber_link }, (e, res_f) => {
                                if (e) console.log(e);
                                else if (res_f) {
                                    cb(null, `Done: ${ytuber_name}`);
                                    return;
                                    console.log(`3. Updating `, ytuber_name);
                                    Ytuber.updateOne({
                                        "_id": ytuber_link
                                    }, {
                                        "nama_channel": ytuber_name,
                                        "img_link": ytuber_img,
                                        "subscribers": ytuber_subscribers_data,
                                        "views": ytuber_views_data,
                                    }, (err, res) => {
                                        if (err) console.log(err);
                                        if (this._step === 2) {
                                            cb(null, `Done: ${ytuber_name}`)
                                        }
                                    })
                                } else {
                                    console.log(`3. Creating `, ytuber_name);
                                    Ytuber.create({
                                        "_id": ytuber_link,
                                        "nama_channel": ytuber_name,
                                        "img_link": ytuber_img,
                                        "subscribers": ytuber_subscribers_data,
                                        "views": ytuber_views_data,
                                    }, (err, res) => {
                                        if (err) console.log(err);
                                        if (this._step === 2) {
                                            cb(null, `Done: ${ytuber_name}`)
                                        }
                                    })
                                }
                            })
                        }, console.error);
                    }
                }, console.error);
            }
        })

    }
}