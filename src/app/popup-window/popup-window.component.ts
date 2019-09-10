import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Catagory } from '../classes/catagory';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DatabaseService } from '../Services/database.service';

@Component({
  selector: 'app-popup-window',
  templateUrl: './popup-window.component.html',
  styleUrls: ['./popup-window.component.css']
})
export class PopupWindowComponent implements OnInit {

  constructor(public popupWindow: MatDialogRef<PopupWindowComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private database: DatabaseService) { }

  dataToSend = {}; //holds the data that is collected from the popup window and will be sent to the main screens
  // For new node popup
  addingParent; //boolean
  parent; //parent node name
  key; // child node key
  value; // child node value
  emptyFields = true; //boolean for validation

  // For new Experiment popup
  experimentName = '';
  num_of_categories: number; //total number of categories
  files = []; //all selected files
  selected_files = []; //files under specific category
  category_index = 0; //holds the current index of the category that files are added to
  categories = []; //holds categories with their files (collected from the user)
  dataForm: FormGroup // used for validations on the create experiment popup
  skabat_pass = "skabat" //holds skabat password. It's only for demonstration purposes. This method has to be changed.

  //For loading filters
  selected_filter;

  //For loading experiment
  selected_experiment;

  //For restoring experiment
  selected_version;

  //For cloning experiment
  cloning_status;


  ngOnInit() {
    this.validateInputData(); // loads the validators for the experiment creation popup
  }

  /**
   * operations that will happen after dialog box (popup window) is closed - in different ways  
   * @param save if user have chosen to save the data that was entered in the popup window or not
   */
  closePopup(save: boolean) {
    var isEmptyFields = false;
    if (this.data.sender == "newNode") { //close popup for new xml node
      this.dataToSend = {
        addingParent: this.addingParent,
        parent: this.parent,
        key: this.key,
        value: this.value
      };
    }
    if (this.data.sender == "createEx") { //close popup for new experiment
      this.dataToSend = {
        categories: this.categories,
        name: this.experimentName,
        files: this.files,
        value: this.value,
        files_tree: this.selected_files,
        filters: [],
        newExp: true
      };
    }
    if (this.data.sender == "filtering") { //close filtering popup
      this.dataToSend = {
        filterToActivate: this.selected_filter
      }
    }
    if (this.data.sender == "loadEx") { // close load experiments popup
      if (this.selected_experiment) {
        this.dataToSend = {
          id: this.selected_experiment.id
        }
      }
    }
    if (this.data.sender == "restore") { // close restore popup
      if (this.selected_version) {
        this.dataToSend = {
          restoreTo_data: this.selected_version
        }
      }
    }
    if (this.data.sender == "skabat") { // close skabat password popup
      this.dataToSend = {
        skabat_pass: this.skabat_pass
      }
    }
    if (save && this.data.sender == "createEx") { //input validation for the create experiment popup
      if (confirm("Are you sure?")) {
        for (let i = 0; i < this.categories.length; i++) {
          for (let j = 0; j < this.categories[i].length; j++) {
            if (!this.categories[i][j].name)
              isEmptyFields = true;
            break;
          }

        }
        if (!isEmptyFields) { // no empty fields in create experiment popup. window will be closed and saved
          this.popupWindow.close(this.dataToSend);
        }
        else {
          alert("Name of category cannot be empty!")
        }
      }
    }
    else if (save && this.data.sender == "restore") {
      if (confirm("This cannot be undone. Are you sure?")) {
        this.popupWindow.close(this.dataToSend);
      }
    }
    else if (save) {
      this.popupWindow.close(this.dataToSend);
    }
    else if (this.data.sender == "createEx" && this.experimentName != "") {
      if (confirm("All changes will be lost. Are you sure?")) {
        this.popupWindow.close();
      }
    }
    else
      this.popupWindow.close();
  }

  /** Checking if user has entered data. form is ready ONLY if all input fields have value */
  isFormReady() {
    // Will return true ONLY if those fields has value.
    if (this.key && this.value) {
      // If we're adding a parent, we need to check that parent field has a value too
      if (this.addingParent) {
        if (this.parent) {
          this.emptyFields = false;
        }
        else {
          this.emptyFields = true;
        }
      }
      // We're adding a son, and key & value has value.
      else {
        this.emptyFields = false;
      }
    }
    else {
      this.emptyFields = true;
    }
  }

  /**
   * Input file listener that calls sub function that adds files to a given category
   * @param $event holds the input files that user selected (xml files)
   * @param index main category index
   * @param parentIndex sub category index
   */
  public fileListener($event, index, parentIndex): void {
    this.readFileContent($event.target, index, parentIndex);
  }
  /**
   * adds the selected files to the array by the corresponding category index that was selected 
   * @param selected_files files that were selected
   * @param index main category index
   * @param parentIndex sub category index
   */
  readFileContent(selected_files: any, index, parentIndex): void {

    for (var i = 0; i < selected_files.files.length; i++) {
      this.files.push(selected_files.files[i])
      this.categories[index][parentIndex].files.push(selected_files.files[i])
    }

    this.category_index++;
  }

  /**
   * adds/removes main categories, according to the number of categories that was set by the user at the input-number box
   */
  addCatagory() {

    for (var i = this.categories.length; i < this.num_of_categories; i++) {
      var catagory = new Catagory;
      this.categories.push([catagory])
    }

    if (this.num_of_categories < this.categories.length) {
      this.categories = this.categories.slice(0, this.num_of_categories);
    }
  }

  /**
   * Adds new sub-catagory to incoming catagory 
   * @param index - main category index
   * @param parentIndex - sub-index where the new category should be inserted
   */
  addSubCatagory(index: number, parentIndex: number) {

    var catagory = new Catagory;

    catagory.level = this.categories[index][parentIndex].level + 1;

    if (catagory.level > 1)
      catagory.show_selected_category = "-" //add it closed

    this.categories[index].splice(parentIndex + 1, 0, catagory);
  }

  /**
   * Deletes a category by given index's 
   * @param i index of main category
   * @param j index of sub-category if exists
   */
  deleteCategory(i: number, j: number) {
    if (confirm("This and all child categories will be deleted. Proceed?")) {
      if (this.categories[i][j].level == 1) { //if main category is selected for delition. delete it with the childs
        this.categories.shift()
        this.num_of_categories -= 1
      }
      else { // sub category is selected. delete it with all its childs
        var how_much_to_delete = 0
        for (let k = j + 1; k < this.categories[i].length; k++) {
          if (this.categories[i][k].level <= this.categories[i][j].level)
            break;
          how_much_to_delete++
        }
        this.categories[i].splice(j, how_much_to_delete + 1)
      }
    }
  }

  /** allows an multiple char input in the categories names */
  trackByFn(index: any, item: any) {
    return index;
  }

  /**
   * validates the data that the user provided for the epxeriment name and for
   * the number of categories
   */
  validateInputData() {
    this.dataForm = new FormGroup({
      'experiment_name': new FormControl(this.experimentName, [
        Validators.required
      ]),
      'number_of_categories': new FormControl(this.num_of_categories, [
        Validators.required
      ])
    })
  }

  /** send a request to database service to copy selected experiment */
  copyExperiment() {
    if (this.selected_experiment && this.experimentName) {
      this.database.copyExperiment(this.experimentName, this.selected_experiment.id).then((status) => {
        this.cloning_status = status;
      })

    }
  }
  /**
   * Deletes a file by user click form the experiment creation popup
   * @param i index of main category
   * @param j index of sub-category
   * @param k index of file
   */
  deleteFileFromCategory(i, j, k) {
    this.categories[i][j].files.splice(k, 1)
  }

  get experiment_name() { return this.dataForm.get('experiment_name'); }
  get number_of_categories() { return this.dataForm.get('number_of_categories'); }

}
