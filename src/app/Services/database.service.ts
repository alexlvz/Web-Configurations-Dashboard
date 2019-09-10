import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { map, first } from 'rxjs/operators';
import { Experiment } from "../classes/experiment";


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private experiments: Experiment[] = [];
  private experimentsUpdated = new Subject<Experiment[]>();
  private oldVersions: [];
  private oldVersionsUpdated = new Subject<Experiment[]>();
  
  
  private SERVER_ADDRESS = "http://localhost:3000"; 
  constructor(private http: HttpClient) { }
  
  /** Adds an Experiment to MongoDB.
  * @param name name of the experiment
  * @param categories object of experiment categories
  * @param filters array of all the filters that are related to this experiment
  * @param newExperiment indicates if it's a new experiment
  * @param version current version number
  * @param first_ver_id id of the first version of this experiment. Only needed for existing experiment. 
  */
  addExperiment(name: string, categories: any, filters:any, files_tree:any, newExperiment: Boolean, version:number, prev_exp_ver_id: string, first_ver_id: string, viewed_tab_when_saved?:any ) {
    return new Promise((resolve)=>{
      const experiment: Experiment = { 
        id: null, 
        name: name, 
        categories: categories, 
        filters: filters, 
        files_tree: files_tree, 
        version: version, 
        prev_exp_ver_id: prev_exp_ver_id,
        first_ver_id: first_ver_id,
        viewed_tab_when_saved: viewed_tab_when_saved
      };
      if (newExperiment){
        experiment.first_ver_id = null
      }
      this.http
      .post<{ message: string, experimentId: string }>(this.SERVER_ADDRESS +"/api/experiments", experiment)
      .subscribe(responseData => {
        const id = responseData.experimentId;
        experiment.id = id;
        if (newExperiment)
        {
          experiment.first_ver_id = id;
        }
        else{
          // experiment.first_ver_id = id;
        }
        this.experiments.push(experiment);
        this.experimentsUpdated.next([...this.experiments]);
        resolve(experiment.id) 
      },
      error => {alert("Request failed - Server is not responding!")});
      
    })
    
  }
  
  /** Loads all experiments */
  loadExperiments() {
    
    this.http
    .get<{ message: string; experiments: any }>(
      this.SERVER_ADDRESS + "/api/experiments/", {params:{isValidConnection: "TRUE"}}
      )
      .pipe(map((experimentData) => {
        return experimentData.experiments.map(experiment => {
          return {
            name: experiment.name,
            categories: experiment.categories,
            // filters: experiment.filters,
            //files_tree: experiment.files_tree,
            id: experiment._id,
            first_ver_id: experiment.first_ver_id,
            //version: experiment.version
          };
        })
      }))
      .subscribe(transformedExperiemnts => {
        this.experiments = transformedExperiemnts;
        this.experimentsUpdated.next([...this.experiments]);
      },
      error => {alert("Request failed - Server is not responding!")});
    }
    
    /** Loads all experiment with only name and id */ 
    loadExperimentsNames() {
      const queryParams = `?cols=${"_id , name , latest_ver "}&sample=${4}`; //sample is for testing and will be removed
      this.http
      .get<{ message: string; experiments: any }>(
        this.SERVER_ADDRESS + "/api/experiments/"+ queryParams, {params:{isValidConnection: "TRUE"}}
        )
        .pipe(map((experimentData) => {
          return experimentData.experiments.map(experiment => {         
            return {
              name: experiment.name,
              id: experiment._id
            };
          })
        }
        )
        )
        .subscribe(transformedExperiemnts => {
          this.experiments = transformedExperiemnts;
          this.experimentsUpdated.next([...this.experiments]);
        }, 
        error => {alert("Request failed - Server is not responding!")});
      }
      
      getExperimentsUpdatedListener() {
        return this.experimentsUpdated.asObservable();
      }
      
      getOldVersionsUpdatedListener() {
        return this.oldVersionsUpdated.asObservable();
      }
      
      cleanExperimentsListener(){
        this.experiments = [];
      }
      
      /** Loads a single experiment from database
      * @param id id of wanted experiment
      */
      getExperiment(id: string) {
        return this.http.get<{
          name: String,
          categories: any,
          // filters: any,
          // files_tree: any,
          id: String,
          version: Number
        }>(this.SERVER_ADDRESS + "/api/experiments/" + id);
      }
      
      /** Gets a list of all previous versions of selected experiment.
      * @param id id of the experiment we want to see it's previous versions
      * 
      * 
      * @returns a list with the version number, id of that version, and date of creation.
      */
      getPreviousVersionsIds(id: string){
        const queryParams = `?cols=${"id , version , date_of_creation , latest_ver "}&restore=${true}`; 
        this.http
        .get<{ message: string; olderVersions: any }>(
          this.SERVER_ADDRESS + "/api/experiments/"+ id + "/old" +  queryParams
          )
          .pipe(map((experimentData) => {
            return experimentData.olderVersions.map(experiment => {         
              return {
                id: experiment._id,
                version: experiment.version,
                date_of_creation: experiment.date_of_creation
              };
            })
          }
          )
          )
          .subscribe(transformedExperiemnts => {
            this.oldVersions = transformedExperiemnts;
            this.oldVersionsUpdated.next([...this.oldVersions]);
          }, 
          error => {console.error("Can't connect to server!")});
        }
        
        /** Restores an experiment to older version.
        * @param firstVersionID the id of the first version of that experiment
        * @param restoreToVer version number of the desired version you want to restore to
        * @param verID the id of that experiment version
        */
        restore(firstVersionID: string, restorationData)
        {
          return this.http
          .patch(this.SERVER_ADDRESS + "/api/experiments/"+ firstVersionID + "/restore" , restorationData)
        }
        
        /** Updates a selected experiment on database
        * @param id id of the experiment we want to update
        * @param experiment the updated experiment
        */
        updateExperiment(id: string, modifiedFiles:any, viewed_tab_when_saved: any ){
          if (modifiedFiles == []){
            return;
          }
          else {
            let dataToUpDate = {'modifiedFiles': modifiedFiles, 'viewed_tab_when_saved': viewed_tab_when_saved}
            this.http
            .patch(this.SERVER_ADDRESS + "/api/experiments/" + id, dataToUpDate ).subscribe(response => {
            }, error => {alert("Request failed - Server is not responding!")});
          }
        }
        
        
        /** Deletes an experiment from DB
        * @param id id of the experiment we want to delete
        */
        deleteExperiment(id: string){
          this.http
          .delete(this.SERVER_ADDRESS + "/api/experiments/" + id).subscribe(result => console.log(result), error => {alert("Server is not responding!")})
        }
        
        /** get an existing experiment ID and a name, copying that experiment and set it's name to the new name
        * @param newExperimentName the name of the new (copied) experiment
        * @param expToCopy_id the id of the experiment we would like to copy
        */
        copyExperiment(newExperimentName: string, expToCopy_id: string)
        {
          return new Promise((resolve)=>{
            var nameObject = {name: newExperimentName}
            this.http.post<{ message: string, experimentId: string }>(this.SERVER_ADDRESS +"/api/experiments/" + expToCopy_id + "/copy", nameObject).subscribe(response => {
              
              resolve(response.message);
              
            },error => {alert("Request failed - Server is not responding!")})
          })
        }
        
        
        /*
        downloadExp(id: string) {
          console.log("DB Service: going to download")
          this.http.get("http://localhost:3000/api/experiments/download/" + id)
        }
        */
      }
      