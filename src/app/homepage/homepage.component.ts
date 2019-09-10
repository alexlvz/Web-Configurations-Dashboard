import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import { FormComponent } from '../form/form.component';
import {XmlConverterService} from '../Services/xml-converter.service';
import { PopupWindowComponent } from '../popup-window/popup-window.component';
import { DatabaseService } from '../Services/database.service';
import { Subscription } from 'rxjs';
import { Experiment } from '../classes/experiment';


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  
  constructor(private xmlConverter: XmlConverterService, public popUpWindow: MatDialog, private formComp: FormComponent, private database: DatabaseService) { }
  popupReference; //reference to popup window
  canProceed=false; // MAYBE WE SHOULD REMOVE THIS
  screen_mode:string; //holds the status of program screen - home page or form page
  private experimentSub: Subscription; //subscribes to the experiments DB
  
  
  ngOnInit() {
    this.xmlConverter.currentMode.subscribe(mode => {this.screen_mode = mode;    
      if (mode != 'main_screen')
        this.formComp.first_load = true; // screen is changed. First load is set to load the first selected file
    })
  }
  /** Creates a popup box with default configurations */
  popupSettings(){

    const popup_configurations = new MatDialogConfig();
    popup_configurations.disableClose = true;
    popup_configurations.autoFocus = true;
    popup_configurations.height ='800px';
    popup_configurations.width ='800px';
    //below settings are for stylings
    popup_configurations.panelClass= 'my-panel'
    popup_configurations.backdropClass = 'backdropBackground'
    
    return popup_configurations;
    
  }

  /** sets settings and loads the new experiment popup */
  createExperiment(){
    //create popup box with default configurations
    const popup_configurations = this.popupSettings();

    popup_configurations.data = {
      sender: "createEx",
    }
    this.popupReference = this.popUpWindow.open(PopupWindowComponent, popup_configurations);
    this.popupReference.afterClosed().subscribe(data => {
      if (data != null){
        this.formComp.setExperiment(data);
        this.canProceed = true;
        this.xmlConverter.changeMode("main_screen") //move to the main program screen
      }  
    });
  }
  /** Loads a list of experiments and then loads selected experiment */
  loadExperiment(){

    //create popup box with default configurations
    const popup_configurations = this.popupSettings();
    
    this.database.loadExperimentsNames();
    
    this.experimentSub = this.database.getExperimentsUpdatedListener()
    .subscribe((experiments: Experiment[]) => {
      popup_configurations.data = {
        sender: "loadEx",
        experiments: experiments
      }   
      
      this.popupReference = this.popUpWindow.open(PopupWindowComponent, popup_configurations);
      this.popupReference.afterClosed().subscribe(data => {
        if (data != null){
          
          // Get that experiment from database and then load it
          this.database.getExperiment(data.id).subscribe((expriment: Experiment) => {
            
            this.canProceed = true;
            this.formComp.setExperiment(expriment)
            this.xmlConverter.changeMode("main_screen") //move to the main program screen
          })
        } 
        this.experimentSub.unsubscribe(); 
      });
    });
  }
  
  /** Opens a popup for coping an experiment */
  copyExperiment(){
    
    //create popup box with default configurations
    const popup_configurations = this.popupSettings();
    this.database.loadExperimentsNames();
    this.experimentSub = this.database.getExperimentsUpdatedListener()
    .subscribe((experiments: Experiment[]) => {
      popup_configurations.data = {
        sender: "copyEx",
        experiments: experiments
      }   
      
      this.popupReference = this.popUpWindow.open(PopupWindowComponent, popup_configurations);
      this.popupReference.afterClosed().subscribe(response => {
      this.experimentSub.unsubscribe();
        
      });
    });
  }

  /**
   * Change between home page and main form screen
   */
  loadFilesView() {
    this.xmlConverter.changeMode("main_screen")
    this.canProceed = true;
  }
  
}
