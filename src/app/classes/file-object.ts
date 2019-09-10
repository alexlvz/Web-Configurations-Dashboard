export class FileObject {
    public xml_object: any // XML object that was created from the coversment of the xml raw file
    public file_name: String // name of the xml file
    public xml_object_tree: any // GUI tree. it's used to show the xml nodes in the form. also use for data binding
    public title: any // holds the name of the first node in the xml file
    public file_string: String // raw xml file
    public xml_object_max_id: String // max id that was given by the traverse function (used in the xml object tree)
    public filters: any // filters for current file. array.
    public selected_filter_name: any
    public filter_disabled: boolean // if enabled, only filtered nodes will be shown
    public fileClicked: boolean // if this file had been selected for viewing / editing by the user
    public isModified: boolean // if changes are made on this file
    
    constructor(xml_obj, f_name, xml_obj_tree, title, file_string, xml_obj_max_id, filters?){
        this.xml_object = xml_obj;
        this.file_name = f_name;
        this.xml_object_tree = xml_obj_tree;
        this.title = title;
        this.file_string = file_string;
        this.xml_object_max_id = xml_obj_max_id;
        this.selected_filter_name = "";
        this.filter_disabled = true;
        this.fileClicked = false;
        this.isModified = false;
        
        if (filters)
        {
            this.filters = filters
        }
        else{
            this.filters = []
        }
    }
}
