//mohana palaka
//a program that gives someone temporary access to their own folder in aws s3
//using aws sts and assume role 
//to add: a function to list files in the designated folder

const fs = require('fs');
const path = require('path');
const aws = require('aws-sdk');
const sts = new aws.STS({apiVersion : '2011-06-15'});
const iam = new aws.IAM({apiVersion : '2010-05-08'});

//for console inputs
const rl = require('readline').createInterface({
    input : process.stdin,
    output: process.stdout
});

var file;
const userid = process.argv[2]; //a command line agrument that takes the name of the user
const folder = process.argv[3]; //a command line argument that takes the name of the folder the user wants to upload to; if the userid and the folder name do not match, access will be denied

//the policy document which allows access only their own folder and explicitly denies access to any other folder
const policy_doc = {
    "Version": "2012-10-17",
    "Statement":[
       {
          Sid : "ListYourOwnFolder",
          Action : [
              "s3:ListBucket"
            ],
          Effect : "Allow",
          Resource : [
              "arn:aws:s3:::the-ep-project-bucket"
            ],
          Condition : {
             "StringLike": {
                "s3:prefix" : [`${folder}/*`]
             }
          }
       },
       {
         Sid : "FullAccessInOwnFolder", 
         Action : [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
        ],
        Effect : "Allow",
        Resource : [
            `arn:aws:s3:::the-ep-project-bucket/${folder}/*`
        ]
       },
       {
        Sid : "ExplicitlyDenyAccessToOtherFolder",
        Action : [
            "s3:ListBucket"
        ],
        Effect : "Deny",
        Resource : [
            "arn:aws:s3:::the-ep-project-bucket"
        ],
        Condition : {
            "StringNotLike": {
                "s3:prefix": [
                    `${folder}/*`,
                    ""
                    ] 
                },
                "Null" : {
                    "s3:prefix" : false 
                }
           }
       }
    ]
 }

//parameters of assume role function
const role_params = {
    DurationSeconds : 900,
    RoleArn : 'arn:aws:iam::624723861307:role/sample_role', //arn of the role that we want to assume; to be changed
    RoleSessionName : `${userid}`,
    Policy : JSON.stringify(policy_doc),
    ExternalId : '123'
};

//a promise that takes the file to be uploaded
//currently assumed to be in the same folder; to be changed to path of the file
function askFileName(){
    return new Promise((resolve, reject) => {

        rl.question('filename : ' ,(fname) => {
            //if(err) reject(err);
            resolve(fname);
            rl.close();
        });
        
    })
}

//a promise that calls the assume role function and returns the credentials
function getCredentials(params){
    return new Promise((resolve, reject) => {
        sts.assumeRole(params, (err, data) => {
            if(err) reject(err);
            else resolve(data.Credentials);
        })
    })
}


askFileName()   //input the name of the file
.then((fname) => {
    file = fname;

    return (getCredentials(role_params).then((creds) => {return creds}));
})
.then((creds) => {

    //using the temp credentials to create an s3 session
    const s3 = new aws.S3({
        apiVersion : '2006-03-01', 
        accessKeyId : creds.AccessKeyId,
        secretAccessKey : creds.SecretAccessKey,
        sessionToken : creds.SessionToken
    });
    
    fs.readFile(file, (err, data) => {
        if(err) console.log(err);
        else{

            var put_params = {
                Bucket : 'the-ep-project-bucket',
                Key : `${folder}/${path.basename(file)}`,
                Body : data
            }
        
            //upload the file to s3            
            s3.putObject(put_params, (err, data) => {
                if(err) console.log(err);
                else {
                    console.log("Successfully uploaded ! ");

                    //list object in the folder listObjects(<folder i have access to>)
                    const self_list_params = {
                        Bucket : 'the-ep-project-bucket',
                        Prefix : `${folder}/`,
                        StartAfter : `${folder}/`
                    }
                    s3.listObjectsV2(self_list_params, (err, data) => {
                        if(err) console.log(err);
                        else {
                            console.log(`Listing contents of directory ${folder} ...`);
                            console.log(data.Contents);
                        }
                    });
                    
                    //list objects in another folder listObjects(<folder i don'thave access to>) : ACCESS DENIED
                    const other_list_params = {
                        Bucket : 'the-ep-project-bucket',
                        Prefix : 'bob/',
                        StartAfter : 'bob/'
                    }

                    s3.listObjectsV2(other_list_params, (err, data) => {
                        if(err) console.log(`You cannot access the directory 'bob' ! ${err}`);
                        else {
                            console.log("Listing contents of directory bob ...");
                            console.log(data.Contents);
                        }
                    });
                }
            });
        }
    });

    //set timer to 3 seconds
    setTimeout(()=> {

        const revoke_params = {
            RoleArn : 'arn:aws:iam::624723861307:role/LoggedOut',
            RoleSessionName : `${userid}`,
            DurationSeconds : 900,
            ExternalId : '456'
        };

        getCredentials(revoke_params)   //assuming another role that denies all permissions
        .then((creds) => {
            
            //using the temp credentials to create an s3 session
            const s3 = new aws.S3({
                apiVersion : '2006-03-01', 
                accessKeyId : creds.AccessKeyId,
                secretAccessKey : creds.SecretAccessKey,
                sessionToken : creds.SessionToken
            });

            //trying to list the objects again
            const self_list_params = {
                Bucket : 'the-ep-project-bucket',
                Prefix : `${folder}/`,
                StartAfter : `${folder}/`
            }

            s3.listObjectsV2(self_list_params, (err, data) => {
                if(err){
                    console.log(`You are logged out ! `);
                    console.log(`Cannot list contents of directory ${userid} again ! ${err}`);
                } 
                else {
                    console.log(`Trying again ...Listing contents of directory ${folder} ...`);
                    console.log(data.Contents);
                }
            });
        });
    }, 3000);
})
.catch((err) => {console.log(err)});



