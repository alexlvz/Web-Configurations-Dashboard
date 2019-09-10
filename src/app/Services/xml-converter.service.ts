import { Injectable } from '@angular/core';
import { XmlNode } from '../classes/xml-node';
import { BehaviorSubject, Subscription } from 'rxjs';

declare var require: any;

@Injectable({
  providedIn: 'root'
})

export class XmlConverterService {
  parseString = require('xml2js').parseString; // holds the parseString connection function
  xml2js = require('xml2js');
  traversee = require('traverse');
  fileString; // xml raw input
  fileStringCopy; //for assignment purposes 
  parsedXml; // json object from coverted xml file
  xmlObjectTree = []; //xml object tree that represents the xml in our GUI
  val_keys = []; //for the xml creation - holds keys and their values
  ids_to_delete = [];
  node_to_add;
  maxId = 0;
  new_nodes = 0; //holds the number of new nods to add
  copy; //copy of parsed xml. this name should be changed !
  reshapedTree; //holds the xml tree but in a 2d array
  updatedParsedXml; // parsed xml after changes
  unsavedChanges = false;
  title; //holds the title of the xml file - takes the main xml tag as a name
  object_creation_done = false;
  files = []; //holds the selected files
  xmlToObject_clicked = false; //if the load file function is clicked
  clonedElement; // for cloning XML elements
  clonedElementPlace; // For adjusting NEW TABS with filters. place of element inside array of same tab name
  newTabPlace; // place of the new tab in general
  //===========================================//
  //transfer data between home and form pages
  private mode = new BehaviorSubject('home_screen');
  currentMode = this.mode.asObservable();
  
  // for transfering new headers that needs to be filtered, and them only
  private newFilteredHeaders = new BehaviorSubject('init');
  newHeaders = this.newFilteredHeaders.asObservable();
  
  //==========================================//
  
  constructor() { }
  //transfer data between home and form pages
  changeMode(mode: string) {
    
    this.mode.next(mode)
    
  }
  
  // Transfer new headers that needs to be filtered, and them only
  deliverNewHeaders(newHeaders: string) {
    this.newFilteredHeaders.next(newHeaders)
  }
  
  
  readFile(selected_file)
  {
    return new Promise((resolve)=>{
      const file: File = selected_file;
      const myReader: FileReader = new FileReader();
      myReader.readAsText(file);
      myReader.onloadend = (e) => {
        resolve(myReader.result)
      };
    })
  }
  
  parseFile(fileString)
  {
    return new Promise((resolve)=>{
      this.parseString(fileString, (err, result) => {
        resolve(result)
      });
    }) 
  }
  
  /**
  * Loads all the relevant data into memory in order to allow work with the currently loaded xml file
  * @param parsed_xml xml object
  * @param xml_object_tree 
  * @param title 
  * @param file_string raw data (text)
  * @param max_id 
  */
  buildObjectTree(parsed_xml, xml_object_tree, title, file_string, max_id)
  {
    this.parsedXml = parsed_xml;
    this.xmlToObject_clicked = true;
    this.xmlObjectTree = xml_object_tree
    this.title = title
    this.maxId = max_id
    this.fileString = file_string
    this.fileStringCopy = JSON.parse(JSON.stringify(this.fileString));
  }
  
  //this function now works only with local files !!!
  xmlToObject(selected_file) {
    this.xmlToObject_clicked = true;
    this.xmlObjectTree = []
    this.title = ""
    const file: File = selected_file;
    const myReader: FileReader = new FileReader();
    myReader.readAsText(file);
    myReader.onloadend = (e) => {
      this.fileString = myReader.result;
      this.parseString(this.fileString, (err, result) => {
        this.parsedXml = result;
      });
      this.xmlObjectTree = this.createXmlTree(this.parsedXml,false);
      this.fileStringCopy = JSON.parse(JSON.stringify(this.fileString));
    };
    
  }
  
  /**
  * listener for reading a user file
  * @param $event // mouse click to select file event
  */
  public fileListener($event): void {
    this.readFileContent($event.target);
  }
  
  readFileContent(inputValue: any): void {
    this.files = [];
    this.xmlObjectTree = [];
    this. xmlToObject_clicked = false;
    for(var i = 0 ; i < inputValue.files.length ; i++)
    {
      this.files.push(inputValue.files[i])
    }
  }
  
  /**Create xml tree from parsed xml object */
  createXmlTree(xmlObject: any, updateTree) {
    var xmlObjectTree = [];
    const object_arr = [];
    var id = 1; //id 0 is root. We do not display root at form
    var title;
    this.traversee(xmlObject).forEach(function (acc, x) {
      var object = new XmlNode();
      if (this.level == 0)
      title = this.keys[0];
      if (this.notLeaf) {
        
        if (this.parent !== undefined && isNaN(this.parent.key)) {
          if (this.parent.key !== undefined) {
            if (this.parent.parent.level !== 0) {
              this.id = id;
              id += 1;
              object.id = this.id;
              object.key = this.parent.key;
              object.level = this.parent.level / 2;
              object.value = 'header';
              object_arr.push(object);
            }
          }
        }
      }
      if (this.isLeaf) {
        this.id = id;
        id += 1;
        // If there is multiple keys at the same leaf, save them one by one
        if (this.parent.node.length > 1) {
          object.value = [this.parent.node[this.key]];
        }
        else {
          object.value = this.parent.node;
        }
        
        object.key = this.parent.key;
        object.level = this.parent.level / 2;
        object.id = this.id;
        if(object.key !='$')
        object_arr.push(object);
        else
        object_arr[object_arr.length-1].key +=" "+this.node;  
      }
    }, []);
    
    this.val_keys = JSON.parse(JSON.stringify(object_arr)); //Clone this object
    var k = 0, m = 0;
    xmlObjectTree[k] = [];
    
    for (var i = 0; i < this.val_keys.length - 1; i++) {
      if (this.val_keys[i + 1].level != 1) {
        xmlObjectTree[k][m] = this.val_keys[i];
        m++;
      }
      else {
        xmlObjectTree[k][m] = this.val_keys[i];
        m = 0;
        k++;
        
        xmlObjectTree[k] = [];
      }
    }
    xmlObjectTree[k][m] = this.val_keys[this.val_keys.length - 1];
    this.maxId = xmlObjectTree[xmlObjectTree.length - 1][[xmlObjectTree.length - 1].length - 1].id;
    xmlObjectTree[k][m] = this.val_keys[this.val_keys.length - 1];
    this.title = title;
    this.object_creation_done = true;
    //if some changes were made we have to update the object tree that is in memory
    if(updateTree)
    this.xmlObjectTree = xmlObjectTree
    return xmlObjectTree;
    
    
  }
  //==================================================================================//
  
  /** Creates a copy of an object and updates it changes(add/remove keys or value changes), saves the new object in UpdatedParsedXml */
  //new function - only creates the reshaped tree
  createReshapedTree() {
    var reshapedTree = [];
    for (let i = 0; i < this.xmlObjectTree.length; i++) {
      for (let j = 0; j < this.xmlObjectTree[i].length; j++) {
        var node = new XmlNode();
        node.key = this.xmlObjectTree[i][j].key;
        node.value = [this.xmlObjectTree[i][j].value[0]];
        node.id = this.xmlObjectTree[i][j].id;
        node.filtered = this.xmlObjectTree[i][j].filtered;
        reshapedTree.push(node);
      }
    }
    return reshapedTree;
  }
  
  //==================================================================================//
  
  /** Add a parent node with son
   * @param node the node that we are adding element to. if we are adding to root, this variable will be 'root'
   * @param key key of the new node
   * @param value value of the new node
   * @param location the location of the node that we are adding element to
   * @param filter_disabled indicates if the filter is disabled
   */
  addParent(node: any, key, value, parent, location: any, filter_disabled: boolean) {
    if (!parent)
    {
      return;
    }
    
    // create father node
    var parentNode = new XmlNode();
    
    if (node == 'root')
    {
      parentNode.addPosition = 0; 
      parentNode.level = 1;
    }
    else{
      parentNode.addPosition = node.id;
      parentNode.level = node.level + 1;
    }
    
    parentNode.key = parent;
    parentNode.value = ["h"];
    
    parentNode.id = this.maxId + 1;
    this.maxId += 1;
    
    // create son(leaf) node
    var sonNode = new XmlNode();
    sonNode.value = [value];
    sonNode.key = key;
    sonNode.addPosition = parentNode.id;
    sonNode.id = this.maxId + 1;
    if (node == 'root')
    {
      sonNode.level = 1
    }
    else{
      sonNode.level = node.level + 1;
    }
    this.maxId += 1;
    if (!filter_disabled)
    {
      parentNode.filtered = true;
      sonNode.filtered = true;
    }
    this.node_to_add = { parent: parentNode, son: sonNode };
    
    let oldXmlObject = JSON.parse(JSON.stringify(this.xmlObjectTree));
    let sons = this.countSons(location)
    
    for (let i = 0; i < this.xmlObjectTree.length; i++) {
      for (let j = 0; j < this.xmlObjectTree[i].length; j++) {
        if (this.xmlObjectTree[i][j].id == node.id) {
          var len = this.xmlObjectTree[i].length;
          this.xmlObjectTree[i].splice(len, 0, parentNode, sonNode)
          break;
        }
      }
    }
    
    this.reshapedTree = this.createReshapedTree();
    this.copy = JSON.parse(JSON.stringify(this.parsedXml))
    this.updatedParsedXml = this.traverseScanAndChange(this.copy, this.reshapedTree, 'addParent');
    this.generateUpdatedXmlFile(this.updatedParsedXml);
    location.j += sons;
    this.adjustMode(oldXmlObject, location, 2, 'addition', filter_disabled);
    
  }
  //==================================================================================//
  
  /** Adds a single field element (=son)
   * @param node the node that we are adding son to.
   * @param key key of the new node(son)
   * @param value value of the new node (son)
   * @param location location of the node that we are adding son to
   * @param filter_disabled indicates if the filter is disabled
   */
  addSon(node: any, key, value, location: any, filter_disabled: boolean) {
    var xmlNode = new XmlNode();
    if (node == 'root')
    {
      xmlNode.value = "Header";
      xmlNode.key = key;
      xmlNode.addPosition = 0; 
    }
    else{   
      xmlNode.value = [value];
      xmlNode.key = key;
      xmlNode.addPosition = node.id;
    }
    xmlNode.id = this.maxId + 1;
    xmlNode.level = node.level + 1;
    
    if (!filter_disabled)
    {
      xmlNode.filtered = true;
    }
    this.maxId += 1;
    this.node_to_add = xmlNode;
    
    let oldXmlObject = JSON.parse(JSON.stringify(this.xmlObjectTree));
    let sons = this.countSons(location)
    
    for (let i = 0; i < this.xmlObjectTree.length; i++) {
      for (let j = 0; j < this.xmlObjectTree[i].length; j++) {
        if (this.xmlObjectTree[i][j].id == node.id) {
          var len = this.xmlObjectTree[i].length;
          this.xmlObjectTree[i].splice(len, 0, xmlNode)          
          break;
        }
      }
    }
    
    this.reshapedTree = this.createReshapedTree();
    this.copy = JSON.parse(JSON.stringify(this.parsedXml))
    this.updatedParsedXml = this.traverseScanAndChange(this.copy, this.reshapedTree, 'add');
    this.generateUpdatedXmlFile(this.updatedParsedXml);
    location.j += sons;
    this.adjustMode(oldXmlObject, location, 1, 'addition', filter_disabled);
    
  }
  
  //==================================================================================//

  /** Clone XML element to desired location (by ID)
   * @param node the node we want to clone
   * @param location location of the node we want to clone. no location means we want to add it as new tab
   * @param filter_disabled indicates if the filter is disabled
   */
  copyParent(node: any, location: any, filter_disabled?: boolean)
  {    
    var mode = "addition"
    var parentNode = new XmlNode();
    parentNode.id = node.id; // This is the node we want to clone
    parentNode.level = 1;
    parentNode.key = node.key; 
    
    if (location){
      parentNode.addPosition = this.getParentID(location); // addPosition is location of the parent of 'node'
      
      // In case it's a new tab
      if (parentNode.addPosition == 0)
      {
        mode = "new-tab"
      }
    }
    
    //No location means we want to add it in a new tab
    else{ 
      parentNode.addPosition = 0;
    }
    
    this.node_to_add = parentNode;
    
    let oldXmlObject = JSON.parse(JSON.stringify(this.xmlObjectTree));
    
    let sons = this.countSons(location)
    var jPosition_of_new_entity = sons;
    
    
    if (mode == "addition"){
      // In case we have more headers with the same name at the level of the cloned entity
      // we need to find the position which the new entity will get
      while (this.xmlObjectTree[location.i][location.j+jPosition_of_new_entity] && (this.xmlObjectTree[location.i][location.j].key === this.xmlObjectTree[location.i][location.j+jPosition_of_new_entity].key)){
        var sons2 = this.countSons({i: location.i, j: location.j+sons})
        jPosition_of_new_entity += sons2;
      }
    }
    
    
    this.reshapedTree = this.createReshapedTree();
    this.copy = JSON.parse(JSON.stringify(this.parsedXml))
    this.traverseScanAndChange(this.copy, this.reshapedTree, 'cloneElement') // to clone son elements
    this.updatedParsedXml = this.traverseScanAndChange(this.copy, this.reshapedTree, 'addClonedElement') // add it to XML object
    this.generateUpdatedXmlFile(this.updatedParsedXml);
    
    location.j += jPosition_of_new_entity;    
        
    this.adjustMode(oldXmlObject, location, sons, mode, filter_disabled);
    
  }
  //==================================================================================//
  /** deletes all values from an object, remaining empty fields */
  deleteValues(object: any){
    this.traversee(object).forEach(function() 
    {
      if (this.isLeaf)
      {
        this.update("")
      }
    }
    );
  }
  //==================================================================================//
  
  /** For updating values */
  updateValues(toSave: boolean) {
    if (this.parsedXml == null || !this.unsavedChanges)
      return;
    /** We create an object named parsedXML, and run XML2JS on it. XML2JS Creates an object inside parsedXML. Inside that object there is an Array with the same name, and then all the
    * XML tags. Traverse creates nodes based on that, so the first scans will be of the object, then the object array, and then the tags.
    */
    
    // changes from manual editor mode
    if (!(this.fileStringCopy === this.fileString)) {
      this.fileStringCopy = this.fileString;
      this.parseString(this.fileString, (err, result) => {
        this.parsedXml = result;
      });
      this.generateUpdatedXmlFile(this.parsedXml);
    }
    else {
      var reshapedTree = []; // Will be used in Traverse. will make Traverse quicker and easier to read & understand
      let oldXmlObject = JSON.parse(JSON.stringify(this.xmlObjectTree));
      
      reshapedTree = this.createReshapedTree();
      const copy = JSON.parse(JSON.stringify(this.parsedXml)) //    *******************
      const updatedParsedXml = this.traverseScanAndChange(copy, reshapedTree, 'update');
      this.generateUpdatedXmlFile(updatedParsedXml);
      this.adjustMode(oldXmlObject, -1, 0, 'valueChange');
      
    }
    
  }
  
  //==================================================================================//
  
  /** Deletes an entity from the XML Tree.
   * @param node the node that we want to delete
   * @param location the location of that node
   */
  deleteEntity(node: any, location: any, filter_disabled: boolean) {
    
    let oldXmlObject = JSON.parse(JSON.stringify(this.xmlObjectTree));
    var mode = "deletion"
    
    if (location.j == 0){
      mode = "tab-delete"
    }
    
    if (node.value == 'header') // delete block
    {
      for (let i = 0; i < this.xmlObjectTree.length; i++) {
        for (let j = 0; j < this.xmlObjectTree[i].length; j++) {
          if (this.xmlObjectTree[i][j].id == node.id) {
            while (this.xmlObjectTree[i][j + 1].level > node.level) {
              this.ids_to_delete.push(this.xmlObjectTree[i][j + 1].id);
              this.xmlObjectTree[i].splice(j + 1, 1);
              if (this.xmlObjectTree[i][j + 1] == undefined)
              break;
            }
            break;
          }
        }
      }
    }
    this.ids_to_delete.push(node.id);
    //======delete the node itself========//
    for (let i = 0; i < this.xmlObjectTree.length; i++) {
      for (let j = 0; j < this.xmlObjectTree[i].length; j++) {
        if (this.xmlObjectTree[i][j].id == node.id) {
          this.xmlObjectTree[i].splice(j, 1);
        }
      }
    }
    
    var num_of_decrements = this.ids_to_delete.length;
    
    
    this.reshapedTree = this.createReshapedTree();
    
    this.copy = JSON.parse(JSON.stringify(this.parsedXml))
    this.updatedParsedXml = this.traverseScanAndChange(this.copy, this.reshapedTree, 'delete');
    this.generateUpdatedXmlFile(this.updatedParsedXml);
    this.adjustMode(oldXmlObject, location, num_of_decrements, mode);
    
  }
  
  //==================================================================================//
  
  
  //this is the traverse run with a flag that represents the selected option (update,add,addParent,delete)
  traverseScanAndChange(copy, reshapedTree, flag) {
    this.unsavedChanges = true;
    var ids_to_delete = this.ids_to_delete;
    var node_to_add = this.node_to_add;
    var id = 0;
    var maxId_Traverese = this.maxId;
    const clonedElement = [];
    var clonedElementCopy = this.clonedElement;
    var clonedElementPlace = this.clonedElementPlace;
    var newTabPlace = 0;
    var updatedParsedXml = this.traversee(copy).forEach(function () {
      if (this.level == 1)
      {
        this.id = id;
        id += 1;
      }
      for (var j = 0; j < reshapedTree.length; j++) {
        if (this.notLeaf) {
          if (this.parent !== undefined && isNaN(this.parent.key)) {
            if (this.parent.key !== undefined) {
              if (this.parent.parent.level !== 0) {
                // loop runs on the same 'this', we check this condition to avoid setting id over and over again to the same 'this'
                if (this.id == undefined) {
                  // If we added an entity, Traverse will create a node with the entity name and null as value. it ID needs to be bigger than the existing ones
                  if (this.node == null) {
                    this.id = maxId_Traverese;
                    maxId_Traverese += 1;
                  }
                  else {
                    this.id = id;
                    id += 1;
                  }
                }
              }
            }
          }
        }
        if (this.isLeaf) {
          //parsedXML always stays unchanged, so IDs that were created here will be identical to those at xmlToObject()
          if (this.id == undefined) {
            // If we added an entity, Traverse will create a node with the entity name and null as value. it ID needs to be bigger than the existing ones
            if (this.node == null) {
              this.id = maxId_Traverese;
              maxId_Traverese += 1;
            }
            else {
              this.id = id;
              id += 1;
            }
          }
          if (flag == 'update' && reshapedTree[j].id === this.id && reshapedTree[j].value[0] != this.node && this.node != undefined) {
            this.update(reshapedTree[j].value[0])
          }
        }
      }
      if (flag == 'delete' && ids_to_delete.includes(this.id)) {
        let place = ids_to_delete.indexOf(this.id);
        ids_to_delete.splice(place, 1) // We deleted that node, so we need to remove it from ids_to_delete as well
        this.delete();
      }
      if (flag == 'add') {
        
        if (this.id == node_to_add.addPosition) {
          
          // In case that the name of node_to_add.key is already exists at this nodes sons - it will add it.
          // without this condition, it will erase the current data of that son, and will save only the new data.
          if (this.keys.includes(node_to_add.key)) {
            var duplicateName = this.node[node_to_add.key][0];
            duplicateName[node_to_add.key] = node_to_add.value;
            this.node[node_to_add.key] = [duplicateName];
          }
          else {
            // Add the new node key + value
            this.node[node_to_add.key] = [node_to_add.value[0]];
          }
        }
      }
      if (flag == 'addParent') {
        // Adds a parent with son to the XML
        if (this.id == node_to_add.parent.addPosition) {
          var leaf = {}
          leaf[node_to_add.son.key] = node_to_add.son.value;
          
          if (!this.keys.includes(node_to_add.parent.key)) {
            this.keys.unshift(node_to_add.parent.key);
            this.node[node_to_add.parent.key] = [leaf];            
          }
          else{
            this.node[node_to_add.parent.key].push(leaf); 
            
          }
        }
      }
      if (flag == 'cloneElement') {
        //Cloning element & all of it elements
        if (this.id == node_to_add.id) { 
          clonedElement.push(JSON.parse(JSON.stringify(this.node)));    
        }
      }
      if (flag == 'addClonedElement') {
        // Adds cloned element
        if (this.id == node_to_add.addPosition) { 
          
          // In case its a new key name
          if (!this.keys.includes(node_to_add.key)) {
            this.keys.unshift(node_to_add.key);
            this.node[node_to_add.key] = clonedElementCopy;
          }
          else{
            // In case that this key already exists
            this.node[node_to_add.key].push(clonedElementCopy[0]); 
            clonedElementPlace = this.node[node_to_add.key].length; // we need this data for adjusting the filter
            
            // Get the amount of main parents (AKA Tabs) until this addition
            for (var k = 0 ; k <= this.keys.indexOf(node_to_add.key); k++){
              newTabPlace += this.node[this.keys[k]].length;
            }                     
          }    
        }
      }
    });
    
    // Getting data after traversal
    if (flag == 'cloneElement') {
      this.clonedElement = JSON.parse(JSON.stringify(clonedElement));
    }
    if (flag == 'addClonedElement') {
      if (clonedElementPlace != 0)
      {
        this.clonedElementPlace = clonedElementPlace-1;
      }
      else
      {
        this.clonedElementPlace = clonedElementPlace;
      } 
      
      if (newTabPlace != 0)
      {
        this.newTabPlace = newTabPlace-1;
      }
      else
      {
        this.newTabPlace = newTabPlace;
      } 
    }
    return updatedParsedXml;
  }
  
  //==================================================================================//
  //new function - creates a new "xml file" each time. code is simple to understand
  generateUpdatedXmlFile(updatedParsedXml) {
    const builder = new this.xml2js.Builder();
    const xml = builder.buildObject(updatedParsedXml);
    this.parseString(xml, (err, result) => {
      this.parsedXml = JSON.parse(JSON.stringify(result));
      this.createXmlTree(this.parsedXml,true)
    });
    this.fileString = xml;
    this.fileStringCopy = JSON.parse(JSON.stringify(this.fileString));
  }
  
  // any change with data-binding at the form will trigger that method, so a notice will appear to save your changes
  onChanges() {
    this.unsavedChanges = true;
  }
  
  //==================================================================================//
  /** Gets node position, and returns it parent's ID */
  getParentID(nodePosition: any){
    // can be done with nodeID instead, but will take more runtime
    
    if (nodePosition.j == 0)
    return 0; // means that we want to clone the tab itself
    
    if (nodePosition.j >= 1){
      for (var t = nodePosition.j-1; t>=0 ; t--)
      {
        if (this.xmlObjectTree[nodePosition.i][t].level == this.xmlObjectTree[nodePosition.i][nodePosition.j].level-1)
        {
          return this.xmlObjectTree[nodePosition.i][t].id
        }
      }
    }
    
  }
  
  //==================================================================================//
  /** Gets an i,j location and checks in XmlObjectTree how many sons (at all levels) it have. Returned value includes the header   */
  countSons(location: any){
    if (location.j == 0)
    {
      return this.xmlObjectTree[location.i].length;
    }

    for (var i = 0; i<this.xmlObjectTree[location.i].length; i++)
    {
      if (this.xmlObjectTree[location.i][location.j+1+i]){
        // we check >= because of extreme case where the copied entity is the last item at this level
        if (this.xmlObjectTree[location.i][location.j].level >= this.xmlObjectTree[location.i][location.j+1+i].level)  //+1 because we don't want to compare item to itself at first iteration
        {
          return i+1; //+1 for the header
        }

        // In case of we arrived to the end of the file
        if (this.xmlObjectTree[location.i][location.j+1+i] == this.xmlObjectTree[location.i][this.xmlObjectTree[location.i].length-1]){
          return i+2 // +1 for the header and +1 for the node we just checked (we check j+i+1)
        }
      }
      
    }
    
  }
  //==================================================================================//
  
  /** Adjust Collapse/Expand mode for each entity, according to it latest status.
  * @param oldXmlFile Copy of xmlObjectTree before the changes
  * @param changeAt The desired position of the change. i and j indexs of the changed item, at the form of {i: , j: }. If just the value was changed, this param will be -1
  * @param num_of_changes number of changes inside the tree, in comparison to xmlObjectTree before the changes
  * @param actionType indicates the action that was done - addition, deletion, or updating a value
  * @param filter_disabled if the filter is disabled
  */
  adjustMode(oldXmlFile: any, changeAt: any, num_of_changes: number, actionType:String, filter_disabled?:boolean){
    
    //oldXmlTree instead of oldXmlFile? 
    
    var comparison_tree = oldXmlFile; // Shorter tree, selected accroding to the action that was made. default is oldXmlFile
    
    if (actionType == 'deletion')
    {
      comparison_tree = this.xmlObjectTree;
    }
    
    // In case of addition/deletion of a tab
    if (actionType == "new-tab" || actionType == "tab-delete"){
      if (actionType == "new-tab"){
        this.adjustTab(oldXmlFile, actionType)
      }
      else{
        this.adjustTab(oldXmlFile, actionType, changeAt.i)
      }
    }
    
    // In case of addition/deletion inside the tab
    else{
      
      for (var i = 0; i<comparison_tree.length; i++)
      {
        for (var j = 0; j<comparison_tree[i].length; j++)
        {
          
          // If we are at the position of the change - change the following values according to the action that was made
          // and according to the amount of changes
          if (actionType != 'valueChange' && i == changeAt.i && j>= changeAt.j)
          {
            // will adjust all the GUI fields except in the new header
            if (actionType == 'addition')
            {
              this.xmlObjectTree[i][j+num_of_changes].show_headers = oldXmlFile[i][j].show_headers
              this.xmlObjectTree[i][j+num_of_changes].show_nodes = oldXmlFile[i][j].show_nodes
              this.xmlObjectTree[i][j+num_of_changes].collapse_expand = oldXmlFile[i][j].collapse_expand 
              this.xmlObjectTree[i][j+num_of_changes].filtered = oldXmlFile[i][j].filtered;
            }
            else if (actionType == 'deletion')
            {
              this.xmlObjectTree[i][j].show_headers = oldXmlFile[i][j+num_of_changes].show_headers
              this.xmlObjectTree[i][j].show_nodes = oldXmlFile[i][j+num_of_changes].show_nodes
              this.xmlObjectTree[i][j].collapse_expand = oldXmlFile[i][j+num_of_changes].collapse_expand 
              this.xmlObjectTree[i][j].filtered = oldXmlFile[i][j+num_of_changes].filtered;
            }
          }
          
          // In all other fields - the values needs to stay the same
          else
          {
            this.xmlObjectTree[i][j].show_headers = oldXmlFile[i][j].show_headers
            this.xmlObjectTree[i][j].show_nodes = oldXmlFile[i][j].show_nodes
            this.xmlObjectTree[i][j].collapse_expand = oldXmlFile[i][j].collapse_expand 
            this.xmlObjectTree[i][j].filtered = oldXmlFile[i][j].filtered;
          }
        }
      }
      
    }
    
    // After we adjusted the view, we need to update the filters as well
    if ( (actionType == 'addition' || actionType == "new-tab") )
    {
      
      // in case we added something inside a tab
      if (actionType == "addition"){
        this.addToFilter(changeAt.i,changeAt.j,num_of_changes, filter_disabled);
      }
      
      // In case we added a new tab
      else{
        this.addToFilter(this.newTabPlace, this.xmlObjectTree[this.newTabPlace].length, num_of_changes, filter_disabled, changeAt.i);
      }
      
    }
    if (actionType == 'deletion' || actionType == "tab-delete")
    {
      if (actionType == 'deletion'){
        this.removeFromFilter(oldXmlFile, changeAt.i,changeAt.j, num_of_changes)
      }
      else{        
        this.removeFromFilter(oldXmlFile, changeAt.i,changeAt.j, num_of_changes, filter_disabled)
      }
    }
  }
  
  //==================================================================================//
  
  /** Adjusts mode for tabs - deletion or addition
  * 
  * @param oldXmlFile Copy of xmlObjectTree before the changes
  * @param actionType indicates the action that was done - addition, deletion, or updating a value
  * @param deletedTabPlace the place of the deleted tab (before deletion)
  */
  adjustTab(oldXmlFile: any, actionType:String, deletedTabPlace?: number ){

    if (actionType == "new-tab"){

      for (var i = 0; i<oldXmlFile.length ; i++  ){
        for (var j = 0; j< oldXmlFile[i].length; j++){
          
          if (i < this.newTabPlace){
            this.xmlObjectTree[i][j].show_headers = oldXmlFile[i][j].show_headers
            this.xmlObjectTree[i][j].show_nodes = oldXmlFile[i][j].show_nodes
            this.xmlObjectTree[i][j].collapse_expand = oldXmlFile[i][j].collapse_expand 
            this.xmlObjectTree[i][j].filtered = oldXmlFile[i][j].filtered;
          }
          else {
            this.xmlObjectTree[i+1][j].show_headers = oldXmlFile[i][j].show_headers
            this.xmlObjectTree[i+1][j].show_nodes = oldXmlFile[i][j].show_nodes
            this.xmlObjectTree[i+1][j].collapse_expand = oldXmlFile[i][j].collapse_expand 
            this.xmlObjectTree[i+1][j].filtered = oldXmlFile[i][j].filtered;
          }
        }
      }
    }
    
    // It's a deletion of a tab
    else{

      for (var i = 0; i<this.xmlObjectTree.length ; i++  ){
        for (var j = 0; j< this.xmlObjectTree[i].length; j++){
          
          if (i < deletedTabPlace){
            this.xmlObjectTree[i][j].show_headers = oldXmlFile[i][j].show_headers
            this.xmlObjectTree[i][j].show_nodes = oldXmlFile[i][j].show_nodes
            this.xmlObjectTree[i][j].collapse_expand = oldXmlFile[i][j].collapse_expand 
            this.xmlObjectTree[i][j].filtered = oldXmlFile[i][j].filtered;
          }
          else{
            this.xmlObjectTree[i][j].show_headers = oldXmlFile[i+1][j].show_headers
            this.xmlObjectTree[i][j].show_nodes = oldXmlFile[i+1][j].show_nodes
            this.xmlObjectTree[i][j].collapse_expand = oldXmlFile[i+1][j].collapse_expand 
            this.xmlObjectTree[i][j].filtered = oldXmlFile[i+1][j].filtered;
          }
        }
      }
    }
  }
  
  //==================================================================================//
  
  /** Adds new nodes to currently activated filter (if exists) and informs form of positions changes.
  * @param iPosition the i position of the added node
  * @param jPosition the j position of the added node
  * @param num_of_changes amount of changes to the file as a result of the addition. (the length of the added header)
  * @param filter_disabled if the filter is disabled
  * @param oldTabPlace In case of tab addition, indicates the position of tab that was cloned
  */
  addToFilter(iPosition: number, jPosition: number, num_of_changes: number, filter_disabled: boolean, oldTabPlace?: number){
    var newHeaders = [];
    var mode = 'addition';

    // In case it's a new tab
    if (jPosition == this.xmlObjectTree[iPosition].length)
    {
      mode = "add-tab";
      iPosition = this.newTabPlace;
      
      if (filter_disabled == false){ //side-note: if filter_disabled == undefined or null, (!filter_disabled) will be TRUE. that's why we check here for false
      for (var k=0; k<num_of_changes; k++){
        this.xmlObjectTree[iPosition][k].filtered = this.xmlObjectTree[oldTabPlace][k].filtered;
        // If it's an header that needs to be filtered, we need to inform 'form' component as well (for display)
        if (this.xmlObjectTree[iPosition][k].filtered && (this.xmlObjectTree[iPosition][k].value == "header" || this.xmlObjectTree[iPosition][k].value == "h"))
        {
          newHeaders.push({iPosition: iPosition, jPosition: k})
        }
      }
    }
    
    // Filter is disabled, so we just need to inform 'form' that there is a new tab
    else if (filter_disabled){
      newHeaders.push({iPosition: iPosition, jPosition: jPosition })
    }
  }
  
  // In case we added a single field addition
  else if (num_of_changes == 1){
    
    if (filter_disabled == false){ //side-note: if filter_disabled == undefined or null, (!filter_disabled) will be TRUE. that's why we check here for false
    this.xmlObjectTree[iPosition][jPosition].filtered = true; 
  }
  newHeaders.push({iPosition: iPosition, jPosition: jPosition})
}

else{

  for (var k=0; k<num_of_changes; k++){
    
    if (filter_disabled == false){
      
      this.xmlObjectTree[iPosition][jPosition+k].filtered = true; 
      
      // In case its a cloned header. 
      // this.xmlObjectTree[iPosition][jPosition+k].filtered == oldXmlFile[iPosition][LOCATION OF CLONED HEADER]...
            
      // If it's an header, we need to inform 'form' component as well (for display)
      if (this.xmlObjectTree[iPosition][jPosition+k].value == "header" || this.xmlObjectTree[iPosition][jPosition+k].value == "h")
      {
        newHeaders.push({iPosition: iPosition, jPosition: jPosition+k})
      }
    }
    
    else if (filter_disabled){
      // If it's an header, we need to inform 'form' component as well (for display)
      if (this.xmlObjectTree[iPosition][jPosition+k].value == "header" || this.xmlObjectTree[iPosition][jPosition+k].value == "h")
      {
        newHeaders.push({iPosition: iPosition, jPosition: jPosition+k})
      }
    }
    
    
  }
}


// Setup data and notify to subscribers that there is new nodes
var dataToSend = {headers: newHeaders, mode: mode, num_of_changes: num_of_changes }
this.newFilteredHeaders.next(JSON.stringify(dataToSend));
this.unsavedChanges = true;
}

/** Removes deleted headers from filter configuration
* @param oldXmlFile the xmlObjectTree before the deletion
* @param iPosition the i position of the first deletion
* @param jPosition the j position of the first deletion
* @param num_of_deletions number of deletions
* @param filter_disabled if the filter is disabled
*/
removeFromFilter(oldXmlFile: any, iPosition: number, jPosition: number, num_of_deletions: number, filter_disabled?: boolean)
{
  var headersToRemove = [];
  var mode = 'deletion'
  
  //tab delete
  if (oldXmlFile[iPosition].length == num_of_deletions){
    
    mode = "tab-delete";
    
    // We deleted a tab, so we just need to inform all filters
    headersToRemove.push({iPosition: iPosition, jPosition: jPosition})
  }
  
  // In case we deleted a single field
  else if (num_of_deletions == 1){
    headersToRemove.push({iPosition: iPosition, jPosition: jPosition})
  }
  
  else{
    for (var k=0; k<num_of_deletions; k++)
    {      
      if (filter_disabled == false){ 
        // If it's a filtered header, we need to inform 'form' component as well, so it will delete it from filter configuration as well
        if (oldXmlFile[iPosition][jPosition+k].filtered && oldXmlFile[iPosition][jPosition+k].value == "header" || oldXmlFile[iPosition][jPosition+k].value == "h")
        {
          headersToRemove.push({iPosition: iPosition, jPosition: jPosition+k})
        }
      }
      
      // Filter is not activated, get all deleted nodes and inform 'form' componont, so if that nodes belongs to any filter - it will be deleted from there
      else{
        if (oldXmlFile[iPosition][jPosition+k].value == "header" || oldXmlFile[iPosition][jPosition+k].value == "h")
        {
          headersToRemove.push({iPosition: iPosition, jPosition: jPosition+k})
        }
      }
      
    }
  }
  // Setup data and notify to subscribers that there is new nodes
  var dataToSend = {headers: headersToRemove, mode: mode, num_of_changes: num_of_deletions }
  this.newFilteredHeaders.next(JSON.stringify(dataToSend));
}

}
