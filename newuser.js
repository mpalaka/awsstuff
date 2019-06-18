//mohana palaka
//a program to create a user and add them to a group which gives its members permission to view/edit files only in their own folder
//this program also creates a folder with the name of the user

const aws = require('aws-sdk');
const iam = new aws.IAM();
const s3 = new aws.S3({apiVersion : '2006-03-01'});

//get all the information about an aws account
// iam.getAccountSummary(params, (err, data) => {
//      if(err) console.log(err);
//      else console.log(data);
// })

//MAIN FLOW
//0.create a central casting account / give some name as input
//1.create a user
//2.create a 'folder' with the name of the user
//3.give permissions to the user such that the user can view/edit ONLY the files in their given 'folder'


//0
const uname = process.argv[2];

//1
var user_params = {
    //Path :
    UserName : uname,
    //Tags : [{Key: , Value: }]
};

iam.createUser(user_params, (err, data) => {
    if(err) console.log(err);
    else{

        console.log(`Created user ${uname} !`);

        //giving the user a default password
        var login_params = {
            Password : 'mypass1',
            UserName : uname,
            PasswordResetRequired : false, //change to true later
        };

        iam.createLoginProfile(login_params, (err, data) => {
            if(err) console.log(err);
            else console.log("Your default password is 'mypass1'");
        })

        //2
        //var file = `${uname}/`;
        var obj_params = {
            Bucket : 'the-ep-project-bucket',
            Key : `${uname}/`,
        };

        s3.putObject(obj_params, (err, data) => {
            if(err) console.log(`There was an error! ${err}`);
            else console.log(`Success! Made the folder ${data}`);
        });

        //3
        var group_params = {
            GroupName : 'actors',
            UserName : uname,
        };

        iam.addUserToGroup(group_params, (err, data) => {
            if(err) console.log(err);
            else console.log(`${uname} was added to the group ! `);
        });
    } 
});

