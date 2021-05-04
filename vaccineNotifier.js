require('dotenv').config()
const moment = require('moment');
const cron = require('node-cron');
const axios = require('axios');
const notifier = require('./notifier');
var pm2 = require('pm2');
/**
 Step 1) Enable application access on your gmail with steps given here:
 https://support.google.com/accounts/answer/185833?hl=en

 Step 2) Enter the details in the file .env, present in the same folder

 Step 3) On your terminal run: npm i && pm2 start vaccineNotifier.js

 To close the app, run: pm2 stop vaccineNotifier.js && pm2 delete vaccineNotifier.js
 */

const PINCODE = process.env.PINCODE
const AGE = process.env.AGE
const FROM_DAY = process.env.FROM_DAY
const TO_DAY = process.env.TO_DAY
const cronExpression = process.env.CRON
count=0;

async function main(){
    try {
        console.log('Environment variables = ', process.env)
        var task = cron.schedule(cronExpression, async () => {
            await checkCount(count);
            await checkAvailability();
        });
    } catch (e) {
        console.log('an error occured: ' + JSON.stringify(e, null, 2));
        throw e;
    }
}

async function checkAvailability() {

    let datesArray = await fetchNextNDays();
    datesArray.forEach(date => {
        getSlotsForDate(date);
    })
}

function getSlotsForDate(DATE) {
    let pincode = PINCODE.split(',');
    pincode.forEach(pincode=>{
        let config = {
            method: 'get',
            url: 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=' + pincode + '&date=' + DATE,
            headers: {
                'accept': 'application/json',
                'Accept-Language': 'hi_IN'
            }
        };
        axios(config)
            .then(function (slots) {
                let sessions = slots.data.sessions;
                let validSlots = sessions.filter(slot => slot.min_age_limit <= AGE &&  slot.available_capacity > 0)
                if(validSlots.length > 0) {
                    console.log('slot found!!', JSON.stringify(validSlots))
                    notifyMe(validSlots,DATE);
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    })
}

async function

notifyMe(validSlots,date){
    let slotDetails = JSON.stringify(validSlots, null, '\t');
    notifier.sendEmail('VACCINE AVAILABILITY '+date, validSlots, (err, result) => {
        if(err) {
            console.error({err});
        }
    })
};

async function fetchNextNDays(){
    let dates = [];
    let today = moment();
    for(let i = FROM_DAY ; i < TO_DAY ; i ++ ){
        let dateString = today.format('DD-MM-YYYY')
        dates.push(dateString);
        today.add(1, 'day');
    }
    return dates;
}

async function checkCount(countt){
    if(countt>=9){
        console.log("Stop");
        pm2.delete('vaccineNotifier.js', function (err, proc) {
            pm2.disconnect(); // Disconnects from PM2
            if (err) {
                throw err;
            }
        });
    }
}
main()
    .then(() => {console.log('Vaccine availability checker started.');});
