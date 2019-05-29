const Promise = require('promise');
const fs = require('fs');


var allfiles = [];  //the array which will store all the filenames
var path = 'C:/Users/mp094062/OneDrive - ENTERTAINMENT PARTNERS/Documents/My Pictures/space_cats';  //path of the directory we want the files of

//reading the files in a directory
function allFiles(dir){
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err,files) => {
            if(err) reject(err);
            else resolve(files);
        });
    });
}

//using stat to get if the file is a directory or not
function getIsDir(dir){
    return new Promise((resolve, reject) => {
        fs.stat(dir, (err, stats) => {
            if(err) reject(err);
            else resolve(stats.isDirectory());
        });
    });
}

module.exports.getAllFiles = 
async function getFilesRec(dir, allfiles){

    const filelist = await allFiles(dir);
    for(var file in filelist){
        var isdir = await getIsDir(dir + '/' + filelist[file]);
        isdir ? await getFilesRec(dir + '/' + filelist[file], allfiles) : allfiles.push(dir + '/' + filelist[file]) 
    }
    return allfiles;
}

//getFilesRec(path, []).then((result) => console.log(result));


/*
//This one works!
function getFilesRec(dir){
    allFiles(dir).then((files) => {
        files.forEach((fname) => {
            getStat(dir + '/' + fname).then((result) => {
                if(result)  getFilesRec(dir + '/' + fname);

                else{
                    allfiles.push(dir + '/' + fname);
                    console.log(allfiles);
                }
            }).catch((error) => {   console.log(`There was an error ${error}`); })
        })
    }).catch((error) => {   console.log(`There was an error! ${error}`); });
}
*/





