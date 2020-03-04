const cron = require('node-cron');
const Candidate = require('../models/candidate');
const moment = require('moment');
const notificationMail = require('./notificationMail');
const reminderSchedule = () => {
    let reminder = cron.schedule('* * * * * *', () => {

        Candidate.aggregate([
            {$unwind: '$accessor'},
            {
                $project: {
                    surname: 1,
                    other: 1,
                    name : '$accessor.accessorname',
                    date: '$accessor.date',
                    status: "$accessor.status"
                }
            },{
                $match: {
                    status: "invitation sent"
                }
            },
            {$sort: {"date": -1}}
        ], (err, data) => {
            if (err) {
                throw err
            }else {
                // console.log(data);
                const currentDate = moment(new Date());
                data.map(item => {
                    const prevDate = moment(new Date(item.date));
                    const diff = currentDate.diff(prevDate, 'minutes');
                    console.log(diff);
                });
                // const diffDuration = moment.duration(diff)
                
            }
        })
    //     console.log("I run every second")
    });
    return reminder.start();
}

module.exports = reminderSchedule;
