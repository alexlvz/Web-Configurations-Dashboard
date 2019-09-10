const Experiment = require("../models/experiment");
const fs = require('fs')
const mongooseTypes = require('mongoose').Types;


/** creates an experiment on server and saves it in DB */ 
exports.createExperiment = (req, res, next) => {
    
    var newExp = true;
    const experiment = new Experiment({
        name: req.body.name,
        categories: req.body.categories,
        // filters: req.body.filters,
        first_ver_id: "",
        version: req.body.version,
        latest_ver: true,
        prev_ver_exp_id: req.body.prev_exp_ver_id,
        date_of_creation: new Date().toUTCString() // Full date of creation - according to server time
    });
    
    // If it's not a new experiment, get the first version id
    if (req.body.first_ver_id) {
        experiment.first_ver_id = req.body.first_ver_id;
        if (experiment.version) {
            experiment.version++
        }
        
        newExp = false;
    }
    if (req.body.viewed_tab_when_saved){
        experiment.viewed_tab_when_saved = req.body.viewed_tab_when_saved;
    }
    
    Experiment.updateOne({_id:req.body.prev_exp_ver_id},{$set:{latest_ver: false}}).then().catch(err=>console.log(err))
    
    // We did an update, so we need to save again
    experiment.save().then(createdExperiment => {
        
        if (newExp) {
            experiment.first_ver_id = createdExperiment.id;
            experiment.latest_ver = true
            
            experiment.save().then(
                res.status(201).json({
                    message: "Experiment added successfully",
                    experimentId: createdExperiment._id
                })
                ).catch(error => {
                    experiment.deleteOne({ _id: createdExperiment._id })
                    res.status(500).json({
                        message: "Creating an experiment failed!"
                    });
                })
            }
            else {
                res.status(201).json({
                    message: "Experiment added successfully",
                    experimentId: createdExperiment._id,
                    experimentVersion: createdExperiment.version
                })
            }
        }
        //,oldVersionsController.getAllExperiemnts(experiment)
        )
        .catch(error => {
            res.status(500).json({
                message: "Creating an experiment failed!"
            });
        });
    };
    
    /** Updates on DB selected experiment with modified files*/ 
    exports.updateExperiment = (req, res, next) => {
        console.log("in server update")

        for (var index = 0; index < req.body.modifiedFiles.length; index++){
            var i =  req.body.modifiedFiles[index].location.i;
            var j =  req.body.modifiedFiles[index].location.j;
            var k =  req.body.modifiedFiles[index].location.k;
            var category = "categories."+i+"."+j+".file_objects."+k;
            var file = req.body.modifiedFiles[index].file
            
           Experiment.updateOne({ _id: req.params.id }, { $set: { [category] : file } }).catch(error => {
                //  console.log(error)
                res.status(500).json({
                    message: "Updating an experiment failed!"
                });
            });
            
        }

        // In case we had a successfull update, lets update the which tab was viewed when saved
        if (res.statusCode != 500){
            Experiment.updateOne({ _id: req.params.id }, { $set: {'viewed_tab_when_saved': req.body.viewed_tab_when_saved }}).then(retData => { 
               console.log(retData)
                res.status(200).json({
                    message: "Update successful!" });

            }).catch(error => {
                res.status(500).json({
                    message: "failed to save last viewed tab!"
                });
            })
        }
        
    };
    
    /** Copies an existing experiment as a template for a new experiment.
    * New experiement will be initialized properly
    */
    exports.copyExperiment = (req, res, next) => {
        
        Experiment.findById(req.params.id).then(expToCopy => {
            
            
            expToCopy._id = mongooseTypes.ObjectId();
            expToCopy.name = req.body.name;
            expToCopy.version = 1;
            expToCopy.isNew = true; 
            expToCopy.date_of_creation =  new Date().toUTCString();
            
            expToCopy.save().then(createdExperiment => {
                
                expToCopy._id = createdExperiment._id;
                expToCopy.first_ver_id = createdExperiment._id;
                expToCopy.prev_exp_ver_id = null;
                
                expToCopy.save().then(
                    res.status(201).json({
                        message: "Experiment copied successfully",
                        experimentId: createdExperiment._id
                    })
                    )
                    
                    
                })
                
            })
        }
        
        
        /**  Loads the latest version of all experiments from DB that matches a given query */
        exports.getAllExperiemnts = (req, res, next) => {
            console.log("All")
            
            Experiment.find().select(req.query.cols).where('latest_ver').equals(true).then(documents => {
                
                res.status(200).json({
                    message: "Experiments fetched successfully!",
                    experiments: documents
                });
                
            })
            .catch(error => {
                console.log(error)
                res.status(500).json({
                    message: "Fetching experiments failed!"
                });
            });
            
        }
        
        /** Load a single experiment from DB according to given ID */ 
        exports.getExperimentByID = (req, res, next) => {
            console.log("ID")
            // console.log(req.params.id)
            Experiment.findById(req.params.id)
            .then(experiment => {
                if (experiment) {
                    res.status(200).json(experiment);
                } else {
                    res.status(404).json({ message: "Experiment not found!" });
                }
            })
            .catch(error => {
                res.status(500).json({
                    message: "Fetching experiment failed!"
                });
            });
        };
        
        /** Deletes all the versions of the experiment from DB according to given ID */ 
        exports.deleteExperiment = (req, res, next) => {
           // Experiment.deleteOne({ _id: req.params.id })

            Experiment.deleteMany().where('first_ver_id').equals(req.params.id)
            .then(result => {
                res.status(200).json({
                    message: "Experiment deleted successfully!"
                });
            })
            .catch(error => {
                res.status(500).json({
                    message: "Deleting experiment failed!"
                });
            });
        };
        
        /** Gets all previous versions of selected experiment */
        exports.getOldVersions = (req, res, next) => {
            
            // console.log("Old Versions")

            Experiment.find().select(req.query.cols)
            .where('first_ver_id').equals(req.params.id)
            .where('latest_ver').equals(false)
            .then(olderVersions =>{
                res.status(200).json({
                    message: "Versions fetched successfully!",
                    olderVersions: olderVersions
                });
            } )
            .catch(error => {
                console.log(error)
                res.status(500).json({
                    message: "Fetching versions failed!"
                });
            });
        }
        
        /** Restores an experiment to older version */
        exports.restoreVersion = (req, res, next) => {

            var version = Number(req.body.version)
            
            Experiment.deleteMany().where('first_ver_id').equals(req.params.id)
            .where('version').gt(version) // deletes all experiments with higher version number
            .then(result =>{
                
                // Updating that this version is now the latest version
                Experiment.find().where('first_ver_id').equals(req.params.id)
                .where('version').equals(version)
                .then(result =>{
                    Experiment.updateOne({ _id: result[0]._id }, { $set: { "latest_ver": true}}).then(result => console.log(""))
                    // result[0].latest_ver = true;
                    res.status(200).json(result);
                })
            })
            .catch(error => {
                console.log(error)
                res.status(500).json({
                    message: "Restore failed!"
                });
            });
        }
     
        
        
        