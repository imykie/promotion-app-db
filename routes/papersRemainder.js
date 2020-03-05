const cron = require('node-cron');
const Candidate = require('../models/candidate');
const moment = require('moment');
const remainderMail = require('./remainderMail');
const reminderSchedule = () => {
    let reminder = cron.schedule('* * * * *', () => {
        
        //fetches the data with invitation sent
        Candidate.aggregate([
            {$unwind: '$accessor'},
            {
                $project: {
                    surname: 1,
                    other: 1,
                    fac: 1,
                    dep: 1,
                    lev: 1,
                    accessorId: '$accessor._id',
                    name : '$accessor.accessorname',
                    date: '$accessor.date',
                    status: "$accessor.status"
                }
            },{
                $match: {
                    status: "paper sent"
                }
            },
            {$sort: {"date": -1}}
        ], (err, data) => {
            if (err) {
                throw err
            }else {
                // console.log(data);

                //gets current date
                const currentDate = moment(new Date());
                data.map(item => {
                    const prevDate = moment(new Date(item.date));
                    const diff = currentDate.diff(prevDate, 'minutes'); //must be changed to days
                    console.log(diff);
                    if(diff >= 5){
                        message = `${item.name} of ${item.surname} ${item.other} is yet to return papers after ${diff} minutes`;
                        console.log(message);
                        remainderMail(item, message);
                    }
                });
                // const diffDuration = moment.duration(diff)
                
            }
        })
    });
    return reminder.start();
}

module.exports = reminderSchedule;
