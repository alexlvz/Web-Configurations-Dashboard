export class Experiment {
    name: string; // experiment name
    categories: any; // experiment categories (tree)
    filters: any; // holds filters for all files (array)
    id: string; // experiment id that is generated via mongoDB
    files_tree: any; // NOT IN USE ? 
    first_ver_id: string; // for version control. holds the id of the first version
    version: number; // current version of the experiment
    prev_exp_ver_id: string // prvious version (if exists)
    viewed_tab_when_saved?: any; // stores the position of the file + tab that was viewed, when the experiment was saved
    
    constructor(){}
}