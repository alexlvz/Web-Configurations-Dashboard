export class Catagory {
    public level: Number; // level of deepness in the files tree
    public name: String; // category name
    public files: []; // category files. Actually we don't use this array
    public file_objects: []; // file objects are objects that are created in this program for each raw xml file. holds file-object classes
    public show_files: String; //holds + or - to show / hide category files
    public show_selected_category: String; // holds + or - to show / hide category name
    constructor(){this.name = ""; this.files = []; this.file_objects = []; this.level = 1; this.show_files ="-"; this.show_selected_category = "-"}
}

