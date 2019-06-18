//mohana palaka
//a program that creates a user group(group of actors) with permissions to view/edit only their own 'folder'
//this is for console access; need to update for programmatic access

const aws = require('aws-sdk');
const iam = new aws.IAM({apiVersion : '2010-05-08'});
const s3 = new aws.S3({apiVersion : '2006-03-01'});

//creating a new policy (for console access)
var default_policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid : "ListAllBucketsInConsole",
        Effect : "Allow",
        Action : [
            "s3:ListAllMyBuckets",
            "s3:GetBucketLocation"
        ],
        Resource : "arn:aws:s3:::*"
      },
      {
        Sid : "ListBucketContents",
        Action: [
            "s3:ListBucket",
            "s3:GetBucketLocation",
        ],
        Effect: "Allow",
        Resource: "arn:aws:s3:::the-ep-project-bucket"
      },
      
      {
        Sid : "AccessUserFolder",
        Effect : "Allow",
        Action : [
          "s3:AbortMultipartUpload",
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:GetObject",
          "s3:GetObjectAcl",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:PutObjectVersionAcl"
        ],
        Resource : "arn:aws:s3:::the-ep-project-bucket/${aws:username}/*"
        
      }
    ]
  };

var policy_params = {
    PolicyName : 'ViewYours',
    PolicyDocument : JSON.stringify(default_policy),
    Description : 'A policy that allows you to edit and view objects in only your own folder.'
 }

//group parameters
var group_params = {
    GroupName : 'actors'
};


//making the new group
iam.createGroup(group_params, (err, data) => {
    if(err) console.log(err);
    else {
        console.log("The group was created!");

        //create policy
        iam.createPolicy(policy_params, (err, data) => {
            if (err) console.log(err);
            else{
                console.log("Created the policy!");
                var policy_arn = data.Policy.Arn;

                //attach policy to group parameters
                var attach_policy = {
                  GroupName : "actors",
                  PolicyArn : policy_arn,
                };

                //attach the policy to the group
                iam.attachGroupPolicy(attach_policy, (err, data) => {
                    if(err) console.log(err);
                    else console.log("Policy attached!");
                });
            }
        });

    }
})

// {
//   Effect : "Allow",
//   Action : [
//     "s3:ListBucket"
//   ],
//   Resource : "arn:aws:s3:::the-ep-project-bucket/*",
//   Condition : {
//     StringLike : {
//         "s3:prefix" : [
//           "",
//           "${aws:username}/*"
//         ]
//     }
//    } 
// },