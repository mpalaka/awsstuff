const aws = require('aws-sdk');
const uuid = require('uuid');
const rec = require('./dirwalk');
//const fs = require('fs');

var s3 = new aws.S3({apiVersion: '2006-03-01'});
const thisbucket = 'example-bucket-' + uuid.v4();   //the name of the bucket that we will be uploading into

path = 'C:/Users/mp094062/OneDrive - ENTERTAINMENT PARTNERS/Documents/My Pictures/space_cats';  //path of the folder that contains all the files to be uploaded
var files = [];  //files to be uploaded

//making the bucket
s3.createBucket({Bucket : thisbucket}, (err, data) => {
    if(err) console.log(`Error! ${err}`);

    else {
        console.log(`Made a bucket! ${data}`);

        //getting all the files from path
        rec.getAllFiles(path, files)
        .then((files) => {

            files.forEach(file => {

                var params = {
                    Bucket : thisbucket,
                    Key : file,
                };

                //putting all the files into the bucket
                s3.putObject(params, (err, data) => {
                    if(err) console.log(`There was an error! ${err}`);
                    else console.log(`Success! ${data}`);
                });
            });
        })
        .catch(err => console.log(`There was an error getting the files :( ${err})`));
    }
});






