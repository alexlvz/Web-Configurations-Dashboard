const express = require("express");
const ExperimentController = require("../controllers/experiments");
const router = express.Router();

/** Navigate to desired server action according to recived arguments  */


router.post("/:id/copy", ExperimentController.copyExperiment);

router.post("", ExperimentController.createExperiment);

router.patch("/:id/restore", ExperimentController.restoreVersion);

router.patch("/:id", ExperimentController.updateExperiment);

//router.get("/download/:id", ExperimentController.downloadFile)

router.get("/:id/old", ExperimentController.getOldVersions);

router.get("/:id", ExperimentController.getExperimentByID);

router.get("", ExperimentController.getAllExperiemnts);

router.delete("/:id", ExperimentController.deleteExperiment)


module.exports = router;
