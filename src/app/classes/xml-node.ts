export class XmlNode {
    public level: Number; //deepness in the xml tree
    public key: String; // xml key
    public value?: String | [String]; // value of the xml key
    public id: Number; // generated only for GUI purposes, for making operations on the nodes
    public addPosition?: Number; // holds the place in which child node will be added
    public show_nodes?: String;//only for child nodes
    public show_headers?: String;// is used to hold the collpase expand status only of parent nodes
    public collapse_expand?: String; //this is only for gui - displays the word collapse or expand
    public filtered?: Boolean; // if false, won't be shown if filter mode is true
    constructor(){
        this.show_headers = '-'; 
        this.show_nodes = '-'; 
        this.collapse_expand = 'Collapse' //NOT IN USE
        this.filtered = false;
    }
}
