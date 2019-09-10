import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { XmlConverterService } from '../Services/xml-converter.service';
import { MatDialog, MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material';
import { PopupWindowComponent } from '../popup-window/popup-window.component';
import { DatabaseService } from '../Services/database.service';
import { Subscription, Subject } from 'rxjs';
import { FileObject } from '../classes/file-object';
import { Experiment } from '../classes/experiment';

declare var require: any;


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css'],
  providers: [{
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: { hasBackdrop: false }
  }]
  , encapsulation: ViewEncapsulation.None
})
export class FormComponent implements OnInit {
  
  constructor(public xmlConverter: XmlConverterService, public popupBox: MatDialog, private database: DatabaseService) { }
  
  level_colors = ["#000000", "#000C45", "#001372", "#001CA4", "#0123D1", "#012BFE", "#3658ff"] // for GUI
  show_xml_file = false; //hide/show raw xml file
  popupBoxReference;
  mode: string; //boolean for display mode - home or main screen
  new_tab_name;
  new_tab_key;
  new_tab_value;
  addTab = false; //show/hide the add tab option
  experiment_name;
  expriment_id;
  first_ver_id;
  current_version;
  loaded_experiment; // ?? Stores the experiment that was loaded
  experiment_file_categories = []; //holds categories with their files
  load_file_without_project //displays files if entered not through project creation screen
  selected_element_to_clone;
  changeTabName = false; //show/hide change name input area
  nodesToCollapse = []; //holds the xml nodes that will be collpased  
  filterMode = false; //user gui filter
  filter_disabled = true;
  filters = []; // holds the filters of the currently viewed file
  newFilteredHeaders: string; // storing headers that needs to be added to activated filter
  i_index //i index of the selected category
  J_index //j index of the selected category
  k_index //k index of the seledcted file (of the i,j category)
  first_load = true; //if file is firstly loaded, there is nothing to update in the experiment_file_categories array
  FileSaver = require('file-saver'); //for downloading files
  JSZip = require("jszip"); // for creating ZIP files
  localFileName; // used only for working without an experiment
  fileName_for_download;
  new_filter_name;
  selected_filter_name;
  marked_fields = []; //the fields that was marked while selecting fields to filter
  prev_exp_ver_id;
  private oldVersionsSub: Subscription;
  private newExpSub: Subscription;
  buttonClicked = false;
  skabat_pass = ""
  tab_index
  show_main_tabs = true
  selected_file_location;
  modified_files_locations = []; // For saving only the modified files - in case of a saving without creating a new version
  filteredTabs = [];
  
  //TEMP VARIABLES FOR CUSTOM VIEW FOR MMI_STATIONS//
  
  start_index // first position of the side tab to display
  main_tabs_names = ["Mamagement Stations", "Display Stations", "Safety Stations", "Skabat Stations"] // main horizontal tab names
  station_ids_array = [] // 2d array with the size of xml_object_tree. in relevant places for each tab there will be the station id value
  station_names_array = [] // 2d array with the size of xml_object_tree. in relevant places for each tab there will be the station name value
  presetNames = ["preset 1", "preset 2", "preset 3", "preset 4", "preset 5"] // for the presetName tag
  coreIds = ["101", "102", "103", "104"] // currently not in use 
  //===============================================//
  
  ngOnInit() {
    this.xmlConverter.currentMode.subscribe(mode => this.mode = mode) //reades the current display mode from the service. should do something better with it
    this.xmlConverter.newHeaders.subscribe(message => {
      this.newFilteredHeaders = message;
      this.handleIncomingData(this.newFilteredHeaders)
    });
  }
  //==============================================///
  //TEMP FUNCTION FOR CUSTOM VIEW FOR MMI_STATIONS//
  /**
  * calculates the indexes of station names that will be displayed on the left tabs , when changing between the horizontal tabs
  * this function can be changed to display other xml files in adapted mode
  * @param k // the selected horizontal tab
  * @param t // the selected left tab
  */
  display_mmi_stations_data(k, t) {
    this.start_index = t;
    for (let j = t + 1; j < this.xmlConverter.xmlObjectTree[k].length; j++) {
      if (this.xmlConverter.xmlObjectTree[k][j].level == this.xmlConverter.xmlObjectTree[k][t].level) // we want to display the sub tabs of the selected main tab
      break;
    }
  }
  /**
  * generates an id for a new added station
  * @param i the selected main tab
  */
  findMaxStationId() {
    var maxId = 0;
    for (let i = 0; i < this.xmlConverter.xmlObjectTree.length; i++) {
      for (let k = 0; k < this.xmlConverter.xmlObjectTree[i].length; k++) {
        if (this.xmlConverter.xmlObjectTree[i][k].key == 'id' && maxId < Number(this.xmlConverter.xmlObjectTree[i][k].value[0])) // only if greater than max
        maxId = Number(this.xmlConverter.xmlObjectTree[i][k].value)
      }
    }
    return maxId
  }
  /**
  * When swiping between main tabs, reset the sub tabs
  */
  resetTabs() {
    this.tab_index = undefined
    this.start_index = undefined
  }
  /**
  * Changes left side tab names to display stations id and name
  * id pos and name pos should be provided manually.
  * Also the function can be changed to display any kind of other xml tags
  * @param id_pos position of the id tag in the xml file
  * @param name_pos position of the pos tag in the xml file
  */
  setTabNames(id_pos, name_pos) {
    var id_index = 1
    var name_index = 1
    for (let i = 0; i < this.xmlConverter.xmlObjectTree.length; i++) {
      this.station_ids_array[i] = []
      this.station_names_array[i] = []
      for (let j = 0; j < this.xmlConverter.xmlObjectTree[i].length; j++) {
        if (this.xmlConverter.xmlObjectTree[i][j].key == "id") //searches for station ids
        {
          this.station_ids_array[i][id_index - id_pos] = this.xmlConverter.xmlObjectTree[i][j].value
        }
        else if (this.xmlConverter.xmlObjectTree[i][j].key == "name") // serches for station names
        {
          this.station_names_array[i][name_index - name_pos] = this.xmlConverter.xmlObjectTree[i][j].value
        }
        else // for all other indexes , put a default value
        {
          this.station_ids_array[i][id_index] = 0
          this.station_names_array[i][name_index] = 0
        }
        id_index++;
        name_index++;
      }
      id_index = 1
      name_index = 1
    }
  }
  /**
  * sets the current position of the selected left tab
  * @param i current selected left tab
  */
  setTabIndex(i) {
    this.tab_index = i
  }
  /**
  * Generates a new sub tab from the selected one and updates correspondingly all the relevant changes in the comm_mapping xml file
  * @param xmlNode the node from the display stations mmi that will be cloned
  * @param k the position of the main tab
  * @param j the position of the sub tab
  */
  mmi_stations_clone(xmlNode, k, j) {
    var new_id = this.findMaxStationId() + 1 // new tab should gate a new id for it
    this.xmlConverter.copyParent(xmlNode, { 'i': k, 'j': j });
    this.modifiedFileObjectLoaction() // make changes to the display tree after tab addition
    this.setTabNames(15, 3) // refresh left side tab names
    if(xmlNode.key == 'skabatStation')
    this.xmlConverter.xmlObjectTree[k][this.xmlConverter.xmlObjectTree[k].length - 7].value[0] = new_id // set the new id to the new tab
    else if(xmlNode.key == 'safetyStation')
    this.xmlConverter.xmlObjectTree[k][this.xmlConverter.xmlObjectTree[k].length - 5].value[0] = new_id // set the new id to the new tab
    else
    this.xmlConverter.xmlObjectTree[k][this.xmlConverter.xmlObjectTree[k].length - 2].value[0] = new_id // set the new id to the new tab
    this.xmlConverter.unsavedChanges = true;
    this.xmlConverter.updateValues(false)
    
    var file = this.experiment_file_categories[0][0].file_objects[0] // get the comm_mapping file
    var dispInComm = this.experiment_file_categories[0][0].file_objects[0].xml_object_tree[1][0] // find the location of the node that should be coppied
    if (xmlNode.key == 'managementStation' || xmlNode.key == 'skabatStation')
    var dispOutComm = this.experiment_file_categories[0][0].file_objects[0].xml_object_tree[this.experiment_file_categories[0][0].file_objects[0].xml_object_tree.length - 1][0]
    this.loadFile(file.xml_object, file.xml_object_tree, file.title, file.file_string, file.xml_object_max_id, 0, 0, 0); //load the comm_mapping file
    this.xmlConverter.copyParent(dispInComm, { 'i': 1, 'j': 0 }, this.filter_disabled) //create new dispInComm sub tab
    this.modifiedFileObjectLoaction()
    var found = false
    // loop through the xml tree to find the new tab that has been added (it will be last of his type)
    for (var i = 0; i < this.xmlConverter.xmlObjectTree.length; i++) {
      for (var t = 0; t < this.xmlConverter.xmlObjectTree[i].length; t++) {
        if (this.xmlConverter.xmlObjectTree[i][t].key == 'displayOutComm') {
          this.xmlConverter.xmlObjectTree[i - 1][t + 1].value[0] = new_id // change its id value to the new id that was the at the new management tab
          this.xmlConverter.unsavedChanges = true;
          this.xmlConverter.updateValues(false)
          found = true
          break
        }
      }
      if (found)
      break
    }
    // copy the second tab that should be created
    if (xmlNode.key == 'managementStation' || xmlNode.key == 'skabatStation')
    {
      this.xmlConverter.copyParent(dispOutComm, { 'i': this.experiment_file_categories[0][0].file_objects[0].xml_object_tree.length - 1, 'j': 0 }, this.filter_disabled)
      this.modifiedFileObjectLoaction()
      this.xmlConverter.xmlObjectTree[this.xmlConverter.xmlObjectTree.length - 1][t + 1].value[0] = new_id //in the comm mapping it will be last, update its id value
      this.xmlConverter.unsavedChanges = true;
      this.xmlConverter.updateValues(false)
    }
    var file = this.experiment_file_categories[0][0].file_objects[3] // get the mmi_stations file
    this.loadFile(file.xml_object, file.xml_object_tree, file.title, file.file_string, file.xml_object_max_id, 0, 0, 3); //load back the mmi_stations file
  }
  //==============================================///
  //====================END=======================//
  
  /** Parse actual data and update filter accordingly */
  handleIncomingData(data: string) {
    if (data == 'init')
    return;
    
    var receivedData = JSON.parse(data)
    this.updateFilter(receivedData.headers, receivedData.mode, receivedData.num_of_changes);
  }
  
  
  /** creates new experiment and loads it */
  async setExperiment(experiment_data) {
    
    // Temporary - will be changed after saving files will be done
    if (experiment_data.files) {
      this.xmlConverter.files = experiment_data.files
    }
    else {
      this.expriment_id = experiment_data._id;
      this.xmlConverter.files = [];
    }
    this.experiment_name = experiment_data.name;
    this.experiment_file_categories = experiment_data.categories;
    
    this.current_version = experiment_data.version;
    this.filters = []
    var file_string
    var xml_object
    var file_object
    var xml_object_tree
    
    for (let i = 0; i < this.experiment_file_categories.length; i++) //initializes all categories and files as expanded
    {
      for (let j = 0; j < this.experiment_file_categories[i].length; j++) {
        
        //creating xml objects from the xml files
        for (let file of this.experiment_file_categories[i][j].files) {
          
          // Only in the experiments we have that file
          if (experiment_data.newExp) {
            file_string = await this.xmlConverter.readFile(file);
            xml_object = await this.xmlConverter.parseFile(file_string)
            xml_object_tree = this.xmlConverter.createXmlTree(xml_object, false)
            var file_name = file.name
            
            // full file name contains ".xml", so we are getting a substring to save the name without that suffix
            file_object = new FileObject(xml_object, file_name.substring(0, file_name.length - 4), xml_object_tree, this.xmlConverter.title, file_string, this.xmlConverter.maxId)
            this.experiment_file_categories[i][j].file_objects.push(file_object)
            this.xmlConverter.title = ""
          }
          else {
            file_string = this.experiment_file_categories[i][j].file_objects.file_string
            xml_object = this.experiment_file_categories[i][j].file_objects.xml_object
            xml_object_tree = this.experiment_file_categories[i][j].file_objects.xml_object_tree
            this.xmlConverter.title = ""
            this.xmlConverter.maxId = this.experiment_file_categories[i][j].xml_object_max_id
          }
          
          
        }
      }
    }
    // If it's a new experiment - save it on DB
    if (experiment_data.newExp) {
      this.current_version = 1;
      this.database.addExperiment(this.experiment_name, this.experiment_file_categories, [], [], true, this.current_version, null, null);
      this.newExpSub =  this.database.getExperimentsUpdatedListener().subscribe(experiment => {
        this.expriment_id = experiment[0].id;
        this.first_ver_id = this.expriment_id;
        this.newExpSub.unsubscribe();
      })
      experiment_data.newExp = false;
    }
    else {
      this.first_ver_id = experiment_data.first_ver_id;
    }
    
    if (experiment_data.viewed_tab_when_saved){
      
      let file_i = experiment_data.viewed_tab_when_saved.file_location.i;
      let file_j = experiment_data.viewed_tab_when_saved.file_location.j;
      let file_k = experiment_data.viewed_tab_when_saved.file_location.k;
      
      var file = this.experiment_file_categories[file_i][file_j].file_objects[file_k]
      
      
      
      let tabIndex = experiment_data.viewed_tab_when_saved.tab_location;
      this.loadFile(file.xml_object, file.xml_object_tree, file.title, file.file_string,file.max_id,file_i,file_j,file_k)
      this.setTabIndex(tabIndex)
    }
    
  }
  
  //when files are selected - this is for local files
  onFileLoad($event) {
    this.xmlConverter.xmlObjectTree = []
    this.xmlConverter.title = "";
    this.xmlConverter.fileListener($event);
    this.xmlConverter.object_creation_done = false;
    this.load_file_without_project = true;
  }
  
  /** Opens a popup to add a new node 
  * @param xmlNode the new xml node 
  * @param location the location of the parent node of the added xmlNode
  */
  NewNodePopup(xmlNode: any, location: any) {
    const popup_configurations = new MatDialogConfig();
    popup_configurations.disableClose = true;
    popup_configurations.autoFocus = true;
    
    popup_configurations.data = {
      sender: "newNode"
    }
    
    this.popupBoxReference = this.popupBox.open(PopupWindowComponent, popup_configurations);
    
    this.popupBoxReference.afterClosed().subscribe(result => {
      if (result != null) {
        if (result.addingParent) {
          this.xmlConverter.addParent(xmlNode, result.key, result.value, result.parent, location, this.filter_disabled);
        }
        else {
          this.xmlConverter.addSon(xmlNode, result.key, result.value, location, this.filter_disabled);
        }
        
        // we did changes to that file, so we will store that information
        this.modifiedFileObjectLoaction();
      }
    });
  }
  
  /** Opens a popup login as skabat */
  skabatPopup(isActivated: boolean) {
    if (isActivated) {
      this.skabat_pass = ""
    }
    else {
      const popup_configurations = new MatDialogConfig();
      popup_configurations.disableClose = true;
      popup_configurations.autoFocus = true;
      
      popup_configurations.data = {
        sender: "skabat"
      }
      this.popupBoxReference = this.popupBox.open(PopupWindowComponent, popup_configurations);
      
      this.popupBoxReference.afterClosed().subscribe(result => {
        if (result != null) {
          this.skabat_pass = result.skabat_pass
          if (this.skabat_pass != 'skabat')
          alert("Wrong password, please try again.")
        }
      });
    }
    
  }
  
  /**
  * This is a GUI function for hiding or showing father nodes and children node with their values.
  * If user select the collapse/expand option when standing on a father node the view will collpase/expand according to the opening status
  * here + or - are used as flags. + represents collapsed, minus represents expanded.
  * The loop is made for closing or hiding all children of the selected father node.
  * @param i i'th index
  * @param j j'th index
  */
  
  HideShowNodes(i, j) {
    var collapse_expnad;
    var gui_status;
    
    if (this.xmlConverter.xmlObjectTree[i][j].show_nodes == '-') {
      collapse_expnad = '+';
      gui_status = 'Expand'
    }
    else {
      collapse_expnad = '-'
      gui_status = 'Collapse'
    }
    
    this.xmlConverter.xmlObjectTree[i][j].show_nodes = collapse_expnad;
    this.xmlConverter.xmlObjectTree[i][j].collapse_expand = gui_status
    for (var k = j + 1; k < this.xmlConverter.xmlObjectTree[i].length; k++) {
      if (this.xmlConverter.xmlObjectTree[i][j].level < this.xmlConverter.xmlObjectTree[i][k].level) {
        this.xmlConverter.xmlObjectTree[i][k].show_nodes = collapse_expnad;
        this.xmlConverter.xmlObjectTree[i][k].show_headers = collapse_expnad;
      }
      else
      break;
    }
    
  }
  
  /**
  * This is a GUI function for hiding or showing categories and their related files.
  * If user clicks on category, the open/close sign (+/-) will change and the view will change correspondly
  * The loop is made in order to close/open all sub-categories and their corresponding files. 
  * @param i i'th index
  * @param j j'th index
  */
  HideShowCategories(i, j) {
    
    var collapse_expnad;
    
    if (this.experiment_file_categories[i][j].show_files == '-')
    collapse_expnad = '+'
    else
    collapse_expnad = '-'
    
    this.experiment_file_categories[i][j].show_files = collapse_expnad;
    for (var k = j + 1; k < this.experiment_file_categories[i].length; k++) {
      if (this.experiment_file_categories[i][j].level < this.experiment_file_categories[i][k].level) {
        if (this.experiment_file_categories[i][k].show_files == '-') {
          this.experiment_file_categories[i][k].show_files = collapse_expnad;
        }
        this.experiment_file_categories[i][k].show_selected_category = collapse_expnad;
      }
      else
      break;
    }
  }
  
  /** resets all data from main screen and moves to home page */
  changeMode(restore?: boolean) {
    if (this.xmlConverter.unsavedChanges && !restore) {
      if (!confirm("Go back to home page? ALL CHANGES WILL BE LOST!")) {
        return
      }
    }
    
    if (!restore) {
      this.xmlConverter.changeMode("home_screen")
    }
    this.xmlConverter.xmlObjectTree = []
    this.xmlConverter.title = "";
    this.xmlConverter.files = []
    this.xmlConverter.unsavedChanges = false;
    this.experiment_file_categories = [];
    this.experiment_name = ''
    this.xmlConverter.xmlToObject_clicked = false;
    this.load_file_without_project = false;
    this.selected_filter_name = "";
    this.first_ver_id = null;
    this.expriment_id = null;
    this.prev_exp_ver_id = null
    this.skabat_pass = ""
    this.tab_index = undefined
    this.database.cleanExperimentsListener();
  }
  
  
  /** Adds a new tab the current file menu */
  /*  //////////////// Not in use ///////////////
  addNewTab() {
    //Changing to tab name - if the users has entered new name -- temp function
    if (this.new_tab_name) {
      this.selected_element_to_clone.key = this.new_tab_name;
    }
    this.xmlConverter.copyParent(this.selected_element_to_clone);
  
    this.addTab = false;
  }
  */////////////////////////

  /** shows raw xml */
  showRawXmlFile() {
    this.show_xml_file = true;
  }
  hideRawXmlFile() {
    this.show_xml_file = false;
  }
  
  /** Marks which fields needs to be shown as defualt
  * @param checked indicates if this node was check or not
  * @param nodeData data of the checked node
  */
  markField(checked: any, nodeData: any) {
    if (checked) {
      //this.nodesToCollapse.push(nodeData)
      this.marked_fields.push(nodeData)
    }
    else {
      var index = this.marked_fields.findIndex((element) => {
        return JSON.stringify(element) == JSON.stringify(nodeData);
      })
      // this.nodesToCollapse.splice(this.nodesToCollapse.indexOf(nodeData), 1)
      this.marked_fields.splice(index, 1)
      
    }
  }
  
  /** Gets a request to activate a NEW filter, cancel other filters if needed, and activates the filter  */
  handleActivateRequest() {
    
    // Validation so make sure that there is a filter with unique name
    if (!this.new_filter_name) {
      alert("Please name the new filter")
      return;
    }
    var names = this.filters.map(filter => filter = filter.name)
    if (names.indexOf(this.new_filter_name) != -1) {
      alert("Name already exist. Please select a different name")
      return;
    }
    
    if (this.filter_disabled) {
      this.nodesToCollapse = this.marked_fields;
      this.marked_fields = [];
      this.changeFilterStatus(true, true)
    }
    else {
      // In case of a creating a new filter over an existing one - 
      // Disables current filter, gets the nodes of the new filter, and activates it
      this.changeFilterStatus(false, false)
      this.nodesToCollapse = this.marked_fields;
      this.marked_fields = [];
      this.changeFilterStatus(true, true)
    }
    
    // after we added the filter, we need to inform that fileObject was changed
    this.modifiedFileObjectLoaction(this.selected_file_location);
    this.xmlConverter.unsavedChanges = true;
  }
  
  /** Activates selected filter, shows only the selected nodes
  * @param activate indicates if we are activating the filter
  * @param newFilter indicates if its a fresh new filter
  */
  changeFilterStatus(activate: boolean, newFilter: boolean) {
    
    // For each header that in the filter, activate only non-headers fields
    for (let i = 0, j = 1; i < this.nodesToCollapse.length; i++ , j = 1) {
      var father_node = this.xmlConverter.xmlObjectTree[this.nodesToCollapse[i].iPosition][this.nodesToCollapse[i].jPosition];
      var curr_node = this.xmlConverter.xmlObjectTree[this.nodesToCollapse[i].iPosition][this.nodesToCollapse[i].jPosition + j];
      father_node.filtered = true;
      
      if (!activate) {
        father_node.filtered = false;
      }
      while (curr_node && father_node.level < curr_node.level) {
        // If its an header, we need to skip it - include all of it sons
        if (curr_node.value == "header" || curr_node.value == "h") {
          var iPosition = this.nodesToCollapse[i].iPosition;
          var jPosition = this.nodesToCollapse[i].jPosition + j;
          
          var sons = this.xmlConverter.countSons({ "i": iPosition, "j": jPosition })
          j = j + sons;
        }
        
        else {
          curr_node.filtered = true;
          
          if (!activate) {
            curr_node.filtered = false;
          }
          j += 1;
        }
        
        curr_node = this.xmlConverter.xmlObjectTree[this.nodesToCollapse[i].iPosition][this.nodesToCollapse[i].jPosition + j];
      }
    }
    
    // If its a new filter - save it
    if (newFilter) {
      
      this.filterMode = false;
      this.filter_disabled = false;
      
      var filter = { name: this.new_filter_name, filter: this.nodesToCollapse }
      this.filters.push(filter)
      this.selected_filter_name = this.new_filter_name
      this.new_filter_name = ""
    }
    this.filter_disabled = false;
    this.filteredTabs = this.getFilteredTabs(this.nodesToCollapse)
    
    if (!activate) {
      this.nodesToCollapse = []
      this.filteredTabs = [];
    }
    
  }
  
  /** Disables selected filter */
  disableFilter() {
    this.changeFilterStatus(false, false)
    this.filter_disabled = true;
    this.nodesToCollapse = [];
    this.selected_filter_name = ""
  }
  
  /** Load a filter out of existing filters */
  loadFilter() {
    const dialogConfig2 = new MatDialogConfig();
    dialogConfig2.disableClose = false;
    dialogConfig2.autoFocus = true;
    
    dialogConfig2.data = {
      sender: "filtering",
      filters: this.filters
    }
    this.popupBoxReference = this.popupBox.open(PopupWindowComponent, dialogConfig2);
    
    this.popupBoxReference.afterClosed().subscribe(result => {
      if (result != null) {
        this.selected_filter_name = result.filterToActivate.name
        this.nodesToCollapse = [];
        this.nodesToCollapse = result.filterToActivate.filter;
        this.selected_filter_name = result.filterToActivate.name;
        this.changeFilterStatus(true, false);
        
      }
    });
    
  }
  
  /** Updates currently activated filter (if exists) with following headers and informs all other filters.
  * Relevant at the creation of new fields and deletion of fields from the XML file.
  * 
  * 
  * @param headers Headers that needs to be updated in the filter, according to mode
  * @param mode addition or deletion of those headers from the XML file, and if it's inside a tab or the tab itself
  * @param num_of_changes number of added/removed fields
  */
  updateFilter(headers: any, mode: string, num_of_changes?: number) {
    
    if (headers.length > 0) {
      
      // In order to avoid a situaion where new header got the location of exist header,
      // we need to inform all filters about that addition BEFORE we are actualy adding elements
      if (mode == "add-tab" || mode == "addition") {
        for (let filter of this.filters) {
          this.informFilter(filter.filter, headers, mode, num_of_changes)
          
        }
      }
      
      // Starting to add/remove headers to currently activated filter. nodesToCollapse and the filters array are connected, so any change is updated in both of them
      for (var i = 0; i < headers.length; i++) {
        if ((mode == 'addition' || mode == 'add-tab') && this.filter_disabled == false) {
          
          // Add it only if it's an header
          if (num_of_changes > 1) {
            this.nodesToCollapse.push(headers[i]);
          }
        }
        
        // In case we need to delete headers - find that header location inside the filter and delete it
        else if (mode == "tab-delete" || mode == "deletion") {
          var header = headers[i]
          
          for (let filter of this.filters) {
            var index = filter.filter.findIndex((element) => {
              return JSON.stringify(element) == JSON.stringify(header);
            })
            
            // If we found that element - delete it
            if (index != -1) {
              filter.filter.splice(index, 1)
            }
          }
          
        }
      }
      
      // After we updated the filter, we need to adjust all the fields that got affected by deletion
      // (their position is changed becuase we deleted elements above them)
      // + We need to inform all other filters as well
      if (mode == "tab-delete" || mode == "deletion") {
        
        for (let filter of this.filters) {
          this.informFilter(filter.filter, headers, mode, num_of_changes)
        }
      }
    }
    
  }
  
  
  /** Update recieved filter of addition/removal of fields, and changing affected fields accordingly 
  * @param headers Headers that needs to be updated in the filter, according to mode
  * @param mode addition or deletion of those headers, and if it's inside a tab or the tab itself
  * @param num_of_changes number of added/removed fields
  * 
  */
  informFilter(filter: any, headers: any, mode: string, num_of_changes: number) {
    
    // In case we are adding a tab, we need to change the location of all other tabs
    // that will be affected by it (higher location tabs)
    if (mode == "add-tab") {
      var added_tab_place = headers[0].iPosition;
      
      for (let node of filter) {
        if (node.iPosition >= added_tab_place) {
          node.iPosition++;
        }
      }
      
    }
    
    // In case we are adding a headers/single field inside a tab, we need to change the location of all other headers
    // that will be affected by it (higher location fields)
    else if (mode == "addition") {
      for (let node of filter) {
        if (node.iPosition == headers[0].iPosition && node.jPosition >= headers[0].jPosition) {
          node.jPosition += num_of_changes;
          
        }
      }
      
      // If we added just 1 field - it's not an header. we did the adjustments we wanted, now we can delete it from headers array
      if (num_of_changes == 1) {
        headers = [];
      }
      
    }
    
    // In case of deleted tab, we need to adjust all other headers location that got affected by it
    else if (mode == "tab-delete") {
      var deleted_tab_place = headers[0].iPosition;
      for (let node of filter) {
        if (node.iPosition > deleted_tab_place) {
          node.iPosition--;
        }
      }
      
    }
    
    // In case we deleted nodes inside that tab. we need to adjust all other headers that got affected by it
    else if (mode == "deletion") {
      for (let node of filter) {
        if (node.iPosition == headers[0].iPosition && node.jPosition > headers[0].jPosition) {
          node.jPosition -= num_of_changes;
          
        }
      }
      
    }
  }
  
  
  /**Send changes to DB for saving
  * @param newVersion indicates if saving as new version or not
  */
  async saveChanges(newVersion: boolean) {
    this.xmlConverter.updateValues(true)
    
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].xml_object = JSON.parse(JSON.stringify(this.xmlConverter.parsedXml));
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].xml_object_tree = JSON.parse(JSON.stringify(this.xmlConverter.xmlObjectTree));
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].title = this.xmlConverter.title;
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].file_string = JSON.parse(JSON.stringify(this.xmlConverter.fileString));
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].xml_object_max_id = this.xmlConverter.maxId;
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].filters = this.filters;
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].filter_disabled = this.filter_disabled;
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].selected_filter_name = this.selected_filter_name;
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].fileClicked = false;
    const experiment = new Experiment();
    experiment.name = this.experiment_name;
    experiment.categories = this.experiment_file_categories;
    experiment.filters = this.filters;//delete 
    experiment.first_ver_id = this.first_ver_id;
    experiment.version = this.current_version;
    experiment.prev_exp_ver_id = this.expriment_id
    experiment.viewed_tab_when_saved = {"file_location": this.selected_file_location, "tab_location": this.tab_index }
    
    // If it's a new version, notify the server. else - just update the current experiment
    if (newVersion) {
      var id = await this.database.addExperiment(experiment.name, experiment.categories, experiment.filters, experiment.files_tree, false, experiment.version, experiment.prev_exp_ver_id, experiment.first_ver_id, experiment.viewed_tab_when_saved)
      
      this.current_version++;
      this.prev_exp_ver_id = this.expriment_id
      this.expriment_id = id
    }
    else {
      
      // Get only the files objects that have been modified and send them to DB for saving
      let modified_files = [];
      for (let file_location of this.modified_files_locations) {
        var file = this.experiment_file_categories[file_location.i][file_location.j].file_objects[file_location.k];
        modified_files.push({ 'file': file, 'location': file_location })
      }
      
      this.database.updateExperiment(this.expriment_id, modified_files, experiment.viewed_tab_when_saved);
    }
    
    
    this.xmlConverter.unsavedChanges = false;
    this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].fileClicked = true;
    this.modified_files_locations = [];

  }
  
  
  
  /**
  * This function does two things: firstly, saves the current state of the loaded file into the corresponding place in the experiment_file_categories array
  * and then loads the data of the new selected file (click event)
  * @param xml_object parsed xml file (object)
  * @param xml_object_tree 
  * @param title title of the xml file (it's the first tag)
  * @param file_string raw xml file (text)
  * @param xml_object_max_id 
  * @param i index in experiment file categories array
  * @param j index in experiment file categories array
  * @param k index of specific file in experiment file categories array
  */
  loadFile(xml_object, xml_object_tree, title, file_string, xml_object_max_id, i, j, k) {
    this.tab_index = undefined
    // If there is already a checked file, uncheck it
    if (this.selected_file_location) {
      this.experiment_file_categories[this.selected_file_location.i][this.selected_file_location.j].file_objects[this.selected_file_location.k].fileClicked = false
    }
    
    this.experiment_file_categories[i][j].file_objects[k].fileClicked = true
    this.selected_file_location = { i: i, j: j, k: k } // Store the location of selected file
    
    if (!this.first_load) //stores the data of the currently loaded file (before the click)
    {
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].xml_object = JSON.parse(JSON.stringify(this.xmlConverter.parsedXml));
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].xml_object_tree = JSON.parse(JSON.stringify(this.xmlConverter.xmlObjectTree));
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].title = this.xmlConverter.title;
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].file_string = JSON.parse(JSON.stringify(this.xmlConverter.fileString));
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].xml_object_max_id = this.xmlConverter.maxId;
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].filters = this.filters;
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].filter_disabled = this.filter_disabled
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].selected_filter_name = this.selected_filter_name;
      if (this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].file_name != this.experiment_file_categories[i][j].file_objects[k].file_name)
      this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].fileClicked = false
      
    }
    
    this.xmlConverter.buildObjectTree(xml_object, xml_object_tree, title, file_string, xml_object_max_id)
    
    this.i_index = i
    this.J_index = j
    this.k_index = k
    this.first_load = false;
    this.filters = this.experiment_file_categories[i][j].file_objects[k].filters; //Load the relevant filters 
    
    this.filterMode = false;
    
    this.filter_disabled = this.experiment_file_categories[i][j].file_objects[k].filter_disabled;
    
    // In case we need to activate a filter at that file
    if (!this.filter_disabled) {
      for (let filter of this.experiment_file_categories[i][j].file_objects[k].filters) {
        if (filter.name == this.experiment_file_categories[i][j].file_objects[k].selected_filter_name) {
          this.selected_filter_name = filter.name
          this.nodesToCollapse = [];
          this.nodesToCollapse = filter.filter;
          this.changeFilterStatus(true, false);
          break;
        }
      }
      
    }
    
    this.fileName_for_download = this.experiment_file_categories[this.i_index][this.J_index].file_objects[this.k_index].file_name;
    //THIS FUNCTION IS ONLY FOR MMI_STATIONS CUSTOM VIEW 
    this.setTabNames(15, 3) //15 is the location of id key in MMI_STATIONS FILE 3 is the station name
    this.hideRawXmlFile()
    this.skabat_pass = "skabat"
  }
  
  /** Download a local file
  * @param fileContent this content of the file we want to save, must be String
  * @param fileName name of the file (will be downloaded with that name)
  */
  downloadFile(fileContent: string, fileName: string) {
    if (this.xmlConverter.unsavedChanges) {
      alert("Please save changes first!")
      return;
    }
    
    //In case of downloading a file outside of project
    //fileName = this.localFileName
    var blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    this.FileSaver.saveAs(blob, fileName+".xml");
  }
  
  /** Download all xml files of current project as ZIP file */
  downloadProjectFiles() {
    if (this.xmlConverter.unsavedChanges) {
      alert("Please save changes first!")
      return;
    }
    
    var zip = new this.JSZip();
    
    for (let cat of this.experiment_file_categories) {
      for (let i = 0; i < cat.length; i++) {
        for (let object of cat[i].file_objects) {
          zip.folder(cat[i].name).file(object.file_name + ".xml", object.file_string);
        }
      }
    }
    
    zip.generateAsync({ type: "blob" })
    .then(result => {
      this.FileSaver.saveAs(result, this.experiment_name + ".zip");
    });
  }
  
  /** Deletes current experiment */
  deleteExperiment() {
    if (confirm("THIS CANNOT BE UNDONE, ARE YOU SURE?")) {
      this.database.deleteExperiment(this.first_ver_id)
      location.reload()
    }
  }
  
  /** Opens a popup with all previous versions of current experiment, after user choose a version to restore to, 
  * calls the DB Service in order to restore to that version */
  restoreVersion() {
    var versions = [];
    const dialogConfig2 = new MatDialogConfig();
    dialogConfig2.disableClose = false;
    dialogConfig2.autoFocus = true;
    this.database.getPreviousVersionsIds(this.first_ver_id);
    this.oldVersionsSub = this.database.getOldVersionsUpdatedListener().subscribe(oldVers => {
      versions = oldVers;
      
      dialogConfig2.data = {
        sender: "restore",
        versions: versions
      }
      this.popupBoxReference = this.popupBox.open(PopupWindowComponent, dialogConfig2);
      this.popupBoxReference.afterClosed().subscribe(result => {
        if (result != null) {
          this.database.restore(this.first_ver_id, result.restoreTo_data).subscribe((experiment: Experiment) => {
            this.changeMode(true)
            this.setExperiment(experiment[0])
            
          })
        }
        this.oldVersionsSub.unsubscribe();
      });
    })
    
    
    
  }
  
  /** Stores locally the location of modified files */
  modifiedFileObjectLoaction(location?: any) {
    var location = this.selected_file_location;
    // Checking if that element(object) is already in the array
    var index = this.modified_files_locations.findIndex((element) => {
      return JSON.stringify(element) == JSON.stringify(location);
    })
    
    // If not - add it
    if (index == -1) {
      this.modified_files_locations.push(location)
    }
    
  }
  
  /** deletes a node from the file
  * @param xmlNode the node that needs to be deleted
  * @param location the location of that node
  */
  deleteEntity(xmlNode: any, location: any) {
    if (confirm("You're about to delete this key! are you sure?")) {
      this.xmlConverter.deleteEntity(xmlNode, location, this.filter_disabled)
      this.modifiedFileObjectLoaction()
      //=======================================================================//
      if (this.xmlConverter.title == 'MMI_Stations') //TEMP FOR CUSTOM MMI VIEW
      this.setTabNames(15, 3)
      //=======================================================================//
    }
  }
  
  /** gets the tab indexes of all the tab that are filtered in selected filter
  * @param filter selected filter
  */
  getFilteredTabs(filter: any) {
    var tabs = [];
    for (let node of filter) {
      if (!tabs.includes(node.iPosition)) {
        tabs.push(node.iPosition)
      }
    }
    return tabs;
  }
  
  /** Checks if the checkbox at selected location is checked or not */
  isChecked(location: any) {
    var index = this.marked_fields.findIndex((element) => {
      return JSON.stringify(element) == JSON.stringify(location);
    })
    
    return (index != -1)
  }
  
  
}
